import { NextResponse } from "next/server";
import prisma from "@/src/prisma";
import OpenAI from "openai";
import { getSystemPrompt } from "@/src/lib/ai/prompts/system-prompt-v2";
import { createInitialConversationState, buildCrisisStateFromHistory } from "@/src/lib/ai/prompts/memory-state";
import { ContentEscalationDetector } from "@/src/services/escalations/content-escalation-detector";
import { EscalationAlertService } from "@/src/services/escalations/escalation-alert-service";
import { EscalationPipeline } from "@/src/services/escalations/escalation-pipeline";
import { ScopeClassifier, RedirectEngine, EnhancedClassifier, ConversationStateTracker } from "@/src/services/scope";
import { conversationStateStore } from "@/src/services/scope/conversation-state-store";
import { ConversationMemory, ConversationSummaryService, type UserMemory } from "@/src/services/memory";
import { buildConversationContext, formatMessagesForAI, estimateTokens, countMessageTokens } from "@/src/lib/ai/context-manager";
import { StudentContextService } from "@/src/services/personalization";

// Initialize OpenAI with error handling
let openai: OpenAI;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });
  console.log('OpenAI client initialized successfully');
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
  openai = null as any;
}

/**
 * Map category to topic group for conversation state tracking
 */
function mapCategoryToTopicGroup(category: string): string {
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('movie') || categoryLower.includes('tv') || 
      categoryLower.includes('celebrity') || categoryLower.includes('music') ||
      categoryLower.includes('sport') || categoryLower.includes('gaming') ||
      categoryLower.includes('anime') || categoryLower.includes('comic')) {
    return 'entertainment';
  }
  
  if (categoryLower.includes('recipe') || categoryLower.includes('cooking') || 
      categoryLower.includes('food') || categoryLower.includes('nutrition')) {
    return 'food';
  }
  
  if (categoryLower.includes('coding') || categoryLower.includes('programming') || 
      categoryLower.includes('debugging') || categoryLower.includes('software')) {
    return 'coding';
  }
  
  if (categoryLower.includes('homework') || categoryLower.includes('assignment') || 
      categoryLower.includes('mathematics') || categoryLower.includes('science')) {
    return 'homework';
  }
  
  if (categoryLower.includes('politics') || categoryLower.includes('government') || 
      categoryLower.includes('election')) {
    return 'politics';
  }
  
  if (categoryLower.includes('shopping') || categoryLower.includes('product')) {
    return 'shopping';
  }
  
  if (categoryLower.includes('sport')) {
    return 'sports';
  }
  
  return 'default';
}

export async function POST(req: Request) {
  try {
    const { message, studentId, sessionId } = await req.json();

    console.log('[ChatStream] Request received:', { studentId, sessionId, messageLength: message?.length });

    if (!message || !studentId || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log('Chat stream request:', { message, studentId, sessionId });

    // Verify that the chat session exists and belongs to the student
    // First get the user ID from studentId
    const user = await prisma.user.findUnique({
      where: { studentId: studentId }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
        isActive: true
      }
    });

    console.log('Session lookup result:', session);

    if (!session) {
      // Try to find any session for this student to help debug
      const anySession = await prisma.chatSession.findFirst({
        where: {
          user: {
            studentId: studentId
          }
        }
      });
      console.log('Any session found for student:', anySession?.id);
      
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 }
      );
    }

    // Get recent conversation history for context (limit to last 50 messages for better continuity)
    const conversationHistory = await prisma.chatMessage.findMany({
      where: {
        sessionId: sessionId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50,
    });

    console.log('Conversation history loaded:', conversationHistory.length, 'messages');

    // Reverse to get chronological order for scope classification
    const chronologicalHistory = conversationHistory.reverse();
    const conversationContext = chronologicalHistory
      .filter(msg => msg.senderType === 'STUDENT')
      .map(msg => msg.content);

    // ========================================
    // CONVERSATION STATE TRACKING
    // Track active topics and prevent redirect bypass
    // ========================================
    let conversationState = conversationStateStore.get(sessionId);
    console.log('[ConversationState] Current state:', ConversationStateTracker.getSummary(conversationState));
    
    // Check if message is related to locked out-of-scope topic
    const isLockedTopicMessage = ConversationStateTracker.isLockedTopicMessage(
      conversationState,
      message
    );
    
    if (isLockedTopicMessage) {
      console.log('[ConversationState] ⚠️ Message matches LOCKED topic:', conversationState.outOfScopeTopic);
      console.log('[ConversationState] Auto-rejecting without reclassification');
      
      // Increment lock count
      conversationState = ConversationStateTracker.incrementLockCount(conversationState);
      conversationState = ConversationStateTracker.incrementRedirectCount(conversationState);
      conversationStateStore.set(sessionId, conversationState);
      
      // Check if user is boundary testing
      const isBoundaryTesting = ConversationStateTracker.isBoundaryTesting(conversationState);
      
      // Generate redirect for locked topic
      const redirectMessage = RedirectEngine.generate(
        conversationState.outOfScopeCategory || conversationState.outOfScopeTopic || 'default',
        conversationContext.length,
        isBoundaryTesting
      );
      
      // Save messages
      const studentMessage = await prisma.chatMessage.create({
        data: {
          sessionId,
          senderType: "STUDENT",
          content: message,
        },
      });
      
      await prisma.chatMessage.create({
        data: {
          sessionId,
          senderType: "BOT",
          content: redirectMessage,
        },
      });
      
      // Return redirect
      const redirectStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(redirectMessage));
          controller.close();
        },
      });

      return new Response(redirectStream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    // ========================================
    // ENHANCED SCOPE CLASSIFICATION - GRANULAR CONTROL
    // Gate-keep BEFORE calling LLM with comprehensive category system
    // ========================================
    console.log('[ScopeCheck] Classifying message with enhanced classifier');
    const enhancedResult = EnhancedClassifier.classify(
      message,
      conversationContext
    );
    
    console.log('[ScopeCheck] Enhanced Result:', {
      category: enhancedResult.category,
      categoryType: enhancedResult.categoryType,
      inScope: enhancedResult.inScope,
      confidence: enhancedResult.confidence,
      intent: enhancedResult.intent,
      emotionalConnection: enhancedResult.emotionalConnection,
      emotionalIntensity: enhancedResult.emotionalIntensity,
      requiresImmediateAttention: enhancedResult.requiresImmediateAttention,
      isJailbreakAttempt: enhancedResult.isJailbreakAttempt,
      isPromptInjection: enhancedResult.isPromptInjection,
      matchedPatterns: enhancedResult.matchedPatterns.length,
      reason: enhancedResult.reason
    });
    
    // If immediate attention required (crisis), flag for escalation
    if (enhancedResult.requiresImmediateAttention) {
      console.log('[ScopeCheck] ⚠️ CRISIS DETECTED - Requires immediate attention');
    }

    // If message is out of scope, return redirect WITHOUT calling LLM
    if (!enhancedResult.inScope) {
      console.log('[ScopeCheck] Message rejected - out of scope');
      
      // CRITICAL FIX: Lock the out-of-scope topic to prevent bypass
      // Map category to topic group
      const topicGroup = mapCategoryToTopicGroup(enhancedResult.category);
      conversationState = ConversationStateTracker.lockOutOfScopeTopic(
        conversationState,
        String(enhancedResult.category).toLowerCase(),
        topicGroup
      );
      conversationStateStore.set(sessionId, conversationState);
      
      console.log('[ConversationState] Topic LOCKED:', {
        topic: conversationState.outOfScopeTopic,
        category: conversationState.outOfScopeCategory,
        duration: '5 messages'
      });
      
      // Generate varied redirect response based on category
      const redirectMessage = RedirectEngine.generate(
        topicGroup,
        conversationContext.length,
        enhancedResult.isJailbreakAttempt || false
      );
      
      // Save student message
      console.log('Saving student message (out of scope) for session:', sessionId);
      const studentMessage = await prisma.chatMessage.create({
        data: {
          sessionId,
          senderType: "STUDENT",
          content: message,
        },
      });
      console.log('Student message saved:', studentMessage.id);
      
      // Save redirect as bot message
      console.log('Saving redirect message for session:', sessionId);
      await prisma.chatMessage.create({
        data: {
          sessionId,
          senderType: "BOT",
          content: redirectMessage,
        },
      });
      console.log('Redirect message saved');
      
      // Return redirect response as stream
      const redirectStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(redirectMessage));
          controller.close();
        },
      });

      return new Response(redirectStream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }
    
    console.log('[ScopeCheck] Message allowed - proceeding to LLM');
    console.log('[ScopeCheck] User intent:', enhancedResult.intent);
    console.log('[ScopeCheck] Category:', `${enhancedResult.categoryType} / ${enhancedResult.category}`);
    
    // CRITICAL FIX: Clear locked topic if user successfully changed subject
    if (conversationState.outOfScopeTopic) {
      console.log('[ConversationState] User changed subject - clearing topic lock');
      conversationState = ConversationStateTracker.clearLockedTopic(conversationState);
      conversationStateStore.set(sessionId, conversationState);
    }
    
    // Update conversation flow
    conversationState = ConversationStateTracker.updateConversationFlow(
      conversationState,
      enhancedResult.intent,
      enhancedResult.category as string
    );
    conversationStateStore.set(sessionId, conversationState);

    // ========================================    // ========================================
    // MEMORY EXTRACTION AND TRACKING
    // Extract facts from conversation to prevent "I don't know your name" bugs
    // ========================================
    
    // Build user memory from conversation history
    let userMemory: UserMemory = ConversationMemory.createEmpty();
    
    // Extract facts from all student messages
    for (const msg of chronologicalHistory) {
      if (msg.senderType === 'STUDENT') {
        userMemory = ConversationMemory.extractFacts(msg.content, userMemory);
      }
    }
    
    // Extract from current message
    userMemory = ConversationMemory.extractFacts(message, userMemory);
    
    // Generate memory context for AI
    const memoryContext = ConversationMemory.generateContext(userMemory);
    
    console.log('[Memory] User memory:', {
      hasName: ConversationMemory.hasName(userMemory),
      name: ConversationMemory.getName(userMemory),
      topicsCount: userMemory.mentionedTopics.length,
      emotionalState: userMemory.emotionalState?.current,
      lastTopic: userMemory.lastDiscussedTopic
    });
    
    // ========================================
    // CONVERSATION SUMMARY
    // Generate accurate summary from actual messages (no AI guessing)
    // ========================================
    const conversationSummary = ConversationSummaryService.generateSummary(
      chronologicalHistory.map(msg => ({
        senderType: msg.senderType,
        content: msg.content,
        createdAt: msg.createdAt
      }))
    );
    
    const summaryContext = ConversationSummaryService.generateNaturalSummary(conversationSummary);
    
    console.log('[ConversationSummary] Topics:', conversationSummary.topics);
    console.log('[ConversationSummary] Stage:', conversationSummary.conversationStage);
    console.log('[ConversationSummary] Emotional themes:', conversationSummary.emotionalThemes);

    // Save student message (for in-scope messages)
    console.log('Saving student message for session:', sessionId);
    const studentMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        senderType: "STUDENT",
        content: message,
      },
    });
    console.log('Student message saved:', studentMessage.id);

    // Run escalation detection asynchronously (fire and forget) to not block response
    console.log('[EscalationCheck] Running escalation detection asynchronously');
    (async () => {
      try {
        // Use AI-powered escalation pipeline
        const pipeline = new EscalationPipeline();
        const pipelineResult = await pipeline.executePipeline(
          message,
          conversationContext,
          studentId,
          sessionId
        );

        console.log('[EscalationCheck] AI Pipeline result:', {
          success: pipelineResult.success,
          isEscalation: pipelineResult.detection?.isEscalation,
          riskLevel: pipelineResult.detection?.riskAssessment.overallRiskLevel,
          riskScore: pipelineResult.detection?.riskAssessment.riskScore,
          alertCreated: pipelineResult.alertCreated,
          notificationsSent: pipelineResult.notificationsSent
        });

        // If AI pipeline failed, fall back to keyword-based detection
        if (!pipelineResult.success) {
          console.log('[EscalationCheck] AI pipeline failed, falling back to keyword detection');
          const keywordDetection = await ContentEscalationDetector.analyzeMessage(
            message,
            studentId,
            sessionId,
            conversationContext
          );

          if (ContentEscalationDetector.isValidEscalation(keywordDetection)) {
            console.log('[EscalationCheck] Keyword-based escalation detected');
            // Create alert using existing service
            try {
              const alert = await EscalationAlertService.createEscalationAlert(
                studentId,
                sessionId,
                keywordDetection,
                message,
                studentMessage.createdAt.toISOString()
              );
              console.log('[EscalationCheck] Fallback alert created:', alert.id);
            } catch (error) {
              console.error('[EscalationCheck] Failed to create fallback alert:', error);
            }
          }
        }
      } catch (error) {
        console.error('[EscalationCheck] Error in AI escalation detection:', error);
        // Don't fail the chat request if escalation detection fails
      }
    })();

    // Try to get AI response with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // Format conversation history for AI (use chronological order)
        const formattedHistory = formatMessagesForAI(chronologicalHistory);
        
        // ========================================
        // PRIVACY-PRESERVING PERSONALIZATION
        // Inject Tier 1 context (safe, non-invasive)
        // ========================================
        
        const studentContext = await StudentContextService.getContextForAI(studentId);
        const contextPrompt = StudentContextService.generateContextPrompt(studentContext);
        
        console.log('[Personalization] Student context loaded:', {
          hasName: !!studentContext.personalInfo.preferredName,
          hasInterests: studentContext.interests.categories.length > 0,
          hasMoodData: !!studentContext.recentMood.lastSessionSummary,
          hasGoals: !!studentContext.activeGoals.currentPathway,
          dataUsed: contextPrompt.dataUsed,
        });
        
        // Log context access for transparency
        await StudentContextService.logContextAccess(
          studentId,
          contextPrompt.dataUsed,
          sessionId
        );
        
        // ========================================
        // POST-ESCALATION SUPPORT
        // Check if student is continuing after escalation alert
        // ========================================
        
        const PostEscalationSupport = await import('@/src/services/escalations/post-escalation-support');
        const postEscalationContext = await PostEscalationSupport.getPostEscalationContext(sessionId, studentId);
        const postEscalationPrompt = PostEscalationSupport.formatPostEscalationContextForPrompt(postEscalationContext);
        
        if (postEscalationContext.shouldAcknowledge) {
          console.log('[PostEscalation] Acknowledgment needed:', {
            alertId: postEscalationContext.alertId,
            level: postEscalationContext.escalationLevel,
            minutesSince: postEscalationContext.minutesSinceAlert,
          });
        }
        
        // ========================================
        // BUILD V2 SYSTEM PROMPT WITH CONVERSATION STATE
        // Uses modular, compact prompt with structured memory
        // ========================================
        
        // Build crisis-aware conversation state from history
        // This ensures crisis/self-harm context persists across ALL topic changes
        const crisisConversationState = buildCrisisStateFromHistory(
          chronologicalHistory.map(m => ({ content: m.content, senderType: m.senderType }))
        );
        
        if (crisisConversationState.riskLevel !== 'NONE') {
          console.log('[CrisisState] ⚠️ Risk detected from history:', {
            riskLevel: crisisConversationState.riskLevel,
            crisisIndicators: crisisConversationState.crisisIndicators.length,
            requiresFollowUp: crisisConversationState.requiresCrisisFollowUp,
            summary: crisisConversationState.conversationSummary
          });
        }
        
        const baseSystemPrompt = getSystemPrompt(crisisConversationState, 'IN');
        
        // Enhance system prompt with:
        // 1. Student context (Tier 1 personalization)
        // 2. Memory context (conversation facts)
        // 3. Summary context (conversation flow)
        // 4. Post-escalation support (if applicable)
        const enhancedSystemPrompt = baseSystemPrompt + 
          contextPrompt.contextText + 
          postEscalationPrompt + 
          memoryContext + 
          summaryContext;
        
        // Build conversation context with smart memory management
        const messagesForAI = await buildConversationContext(
          enhancedSystemPrompt,
          formattedHistory,
          message,
          openai
        );

        console.log('Sending to AI with NEW V2 PROMPT (Compact Mode + Personalization)');
        console.log('Messages for AI context:', messagesForAI.length, 'messages');
        console.log('[Memory] Injected memory context:', memoryContext ? 'YES' : 'NO');
        console.log('[Memory] Injected summary context:', summaryContext ? 'YES' : 'NO');
        console.log('[Personalization] Injected student context:', contextPrompt.dataUsed.length > 0 ? 'YES' : 'NO');
        console.log('[PostEscalation] Injected support context:', postEscalationPrompt ? 'YES' : 'NO');
        console.log('Total estimated tokens:', estimateTokens(enhancedSystemPrompt) + countMessageTokens(formattedHistory) + estimateTokens(message));

        const stream = await openai.chat.completions.create({
          model: "gpt-3.5-turbo-16k", // Using 16k model to support comprehensive system prompt + 50 message history
          messages: messagesForAI,
          max_tokens: 150,  // Prevents long-winded "AI monologues" 
          temperature: 0.7,  // Keeps it creative but grounded
          frequency_penalty: 0.5,  // Reduces repetition
          stream: true,
        });

        const responseStream = new ReadableStream({
          async start(controller) {
            try {
              let rawResponse = "";
              
              // Stream chunks in real-time instead of collecting all first
              for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) {
                  rawResponse += content;
                  // Send chunk immediately for real-time streaming
                  controller.enqueue(new TextEncoder().encode(content));
                }
              }

              console.log('AI response complete:', rawResponse);
              
              // Save bot reply message asynchronously after streaming is complete
              (async () => {
                try {
                  console.log('Saving bot message for session:', sessionId);
                  const botMessage = await prisma.chatMessage.create({
                    data: {
                      sessionId,
                      senderType: "BOT",
                      content: rawResponse,
                    },
                  });
                  console.log('Bot message saved:', botMessage.id);
                } catch (error) {
                  console.error('Failed to save bot message:', error);
                }
              })();
              
              controller.close();
            } catch (error) {
              console.error("Stream error:", error);
              controller.error(error);
            }
          },
        });

        return new Response(responseStream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Transfer-Encoding": "chunked",
          },
        });
      } catch (error: any) {
        if (error.message.includes('429') && retryCount < maxRetries - 1) {
          retryCount++;
          const delayMs = Math.pow(2, retryCount) * 1000;
          console.log(`Stream rate limited, retrying in ${delayMs}ms (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        console.log(`Stream AI request failed: ${error.message}`);
        break;
      }
    }
    
    // If all retries fail, send a fallback response
    const fallbackMessage = "I understand you're sharing something important. I'm Psychology Buddy, and sometimes the AI service might be busy, but I'm here to listen. Could you tell me more about what's on your mind?";
    console.log("Using fallback response");
    
    const fallbackStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(fallbackMessage));
        controller.close();
      },
    });

    return new Response(fallbackStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (err) {
    console.error("Chat stream error:", err);
    
    if (err instanceof Error && err.message.includes('429')) {
      return NextResponse.json(
        { error: "AI service is temporarily unavailable. Please try again in a few moments." },
        { status: 429 }
      );
    }
    
    if (err instanceof Error && err.message.includes('API key')) {
      return NextResponse.json(
        { error: "OpenAI service configuration error. Please contact support." },
        { status: 500 }
      );
    }
    
    if (err instanceof Error && err.message.includes('insufficient_quota')) {
      return NextResponse.json(
        { error: "OpenAI quota exceeded. Please check your billing details." },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}

