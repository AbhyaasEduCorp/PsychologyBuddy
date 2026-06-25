/**
 * Conversation State Analyzer
 * 
 * Analyzes conversation flow to determine readiness for exercise interventions.
 * Based on psychological session stages: Expression → Exploration → Understanding → Reflection → Intervention
 */

export type ConversationStage = 
  | 'expression'      // User is venting, expressing initial emotions
  | 'exploration'     // User is exploring causes and patterns
  | 'understanding'   // User is gaining insights
  | 'reflection'      // User is reflecting on patterns/insights
  | 'intervention'    // Ready for actionable exercises
  | 'closure';        // Session is winding down

export type EmotionIntensity = 'low' | 'moderate' | 'high' | 'crisis';

export interface ConversationState {
  stage: ConversationStage;
  emotion: string;
  intensity: EmotionIntensity;
  readinessScore: number; // 0-100
  userIntent: string;
  conversationDepth: 'surface' | 'moderate' | 'deep';
  insightMoment: boolean; // Did user just have an "aha" moment?
  ventingComplete: boolean; // Has user finished expressing initial concerns?
}

export interface Message {
  sender: 'student' | 'bot';
  content: string;
}

export class ConversationStateAnalyzer {
  /**
   * Analyze the current conversation state to determine readiness for interventions
   */
  static analyzeState(messages: Message[]): ConversationState {
    if (messages.length === 0) {
      return this.getInitialState();
    }

    // Get recent student messages for analysis
    const studentMessages = messages
      .filter(m => m.sender === 'student')
      .slice(-5); // Last 5 messages

    if (studentMessages.length === 0) {
      return this.getInitialState();
    }

    const lastStudentMessage = studentMessages[studentMessages.length - 1].content.toLowerCase();
    const conversationLength = studentMessages.length;

    // Detect conversation stage
    const stage = this.detectStage(studentMessages, messages);

    // Detect emotion and intensity
    const { emotion, intensity } = this.detectEmotionAndIntensity(lastStudentMessage, studentMessages);

    // Detect user intent
    const userIntent = this.detectIntent(lastStudentMessage);

    // Calculate readiness score
    const readinessScore = this.calculateReadinessScore({
      stage,
      emotion,
      intensity,
      messages: studentMessages,
      conversationLength
    });

    // Detect conversation depth
    const conversationDepth = this.detectConversationDepth(studentMessages);

    // Detect insight moments
    const insightMoment = this.detectInsightMoment(lastStudentMessage);

    // Check if venting is complete
    const ventingComplete = this.isVentingComplete(studentMessages, stage);

    return {
      stage,
      emotion,
      intensity,
      readinessScore,
      userIntent,
      conversationDepth,
      insightMoment,
      ventingComplete
    };
  }

  /**
   * Detect the current stage of the conversation
   */
  private static detectStage(studentMessages: Message[], allMessages: Message[]): ConversationStage {
    const lastMessage = studentMessages[studentMessages.length - 1].content.toLowerCase();
    const messageCount = studentMessages.length;

    // Check for closure indicators
    if (this.hasClosureIndicators(lastMessage)) {
      return 'closure';
    }

    // Check for intervention readiness (insight moments)
    if (this.hasInsightIndicators(lastMessage)) {
      return 'reflection';
    }

    // Check for understanding/reflection patterns
    if (this.hasUnderstandingIndicators(lastMessage)) {
      return 'understanding';
    }

    // Check for exploration patterns (asking "why")
    if (this.hasExplorationIndicators(lastMessage)) {
      return 'exploration';
    }

    // Early messages are typically expression
    if (messageCount <= 2) {
      return 'expression';
    }

    // Check if still venting (short, emotional bursts)
    if (this.isStillVenting(studentMessages)) {
      return 'expression';
    }

    // Default to exploration after initial expression
    return 'exploration';
  }

  /**
   * Detect emotion and its intensity from message content
   */
  private static detectEmotionAndIntensity(
    lastMessage: string, 
    recentMessages: Message[]
  ): { emotion: string; intensity: EmotionIntensity } {
    // Crisis indicators (highest priority)
    const crisisPatterns = [
      /\b(suicid|kill myself|end it all|want to die|harm myself|hurt myself)\b/i,
      /\b(can't go on|no point|give up|no hope)\b/i
    ];

    for (const pattern of crisisPatterns) {
      if (pattern.test(lastMessage)) {
        return { emotion: 'crisis', intensity: 'crisis' };
      }
    }

    // Emotion patterns with intensity markers
    const emotionPatterns = {
      anxiety: {
        keywords: ['anxious', 'worried', 'nervous', 'panic', 'stressed', 'overwhelmed', 'scared', 'afraid'],
        intensifiers: ['very', 'extremely', 'so', 'really', 'can\'t stop', 'always']
      },
      sadness: {
        keywords: ['sad', 'depressed', 'down', 'hopeless', 'empty', 'lonely', 'miserable', 'crying'],
        intensifiers: ['very', 'extremely', 'so', 'really', 'all the time', 'always']
      },
      anger: {
        keywords: ['angry', 'frustrated', 'mad', 'furious', 'irritated', 'annoyed'],
        intensifiers: ['very', 'extremely', 'so', 'really', 'can\'t control']
      },
      stress: {
        keywords: ['stressed', 'pressure', 'overwhelmed', 'burden', 'too much'],
        intensifiers: ['very', 'extremely', 'so', 'really', 'can\'t handle']
      },
      confusion: {
        keywords: ['confused', 'lost', 'don\'t know', 'uncertain', 'unclear'],
        intensifiers: ['very', 'completely', 'totally', 'so']
      }
    };

    let detectedEmotion = 'neutral';
    let intensity: EmotionIntensity = 'low';

    for (const [emotion, { keywords, intensifiers }] of Object.entries(emotionPatterns)) {
      for (const keyword of keywords) {
        if (lastMessage.includes(keyword)) {
          detectedEmotion = emotion;

          // Check intensity
          const hasIntensifier = intensifiers.some(int => lastMessage.includes(int));
          const hasExclamation = lastMessage.includes('!');
          const hasCapitals = /[A-Z]{3,}/.test(recentMessages[recentMessages.length - 1].content);
          const hasRepetition = recentMessages.filter(m => 
            m.content.toLowerCase().includes(keyword)
          ).length > 1;

          if (hasIntensifier || hasExclamation || hasCapitals || hasRepetition) {
            intensity = 'high';
          } else if (lastMessage.length > 100 || hasRepetition) {
            intensity = 'moderate';
          } else {
            intensity = 'low';
          }

          break;
        }
      }
      if (detectedEmotion !== 'neutral') break;
    }

    return { emotion: detectedEmotion, intensity };
  }

  /**
   * Detect user's primary intent in the conversation
   */
  private static detectIntent(message: string): string {
    const intentPatterns = {
      seeking_support: ['need help', 'don\'t know what to do', 'can you help'],
      seeking_validation: ['am i wrong', 'is it normal', 'does this make sense'],
      seeking_understanding: ['why do i', 'what does this mean', 'trying to understand'],
      venting: ['just need to talk', 'needed to get this out', 'had to tell someone'],
      problem_solving: ['what should i do', 'how can i', 'what would you suggest']
    };

    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      if (patterns.some(pattern => message.includes(pattern))) {
        return intent;
      }
    }

    return 'general_conversation';
  }

  /**
   * Calculate readiness score (0-100) for exercise intervention
   */
  private static calculateReadinessScore(params: {
    stage: ConversationStage;
    emotion: string;
    intensity: EmotionIntensity;
    messages: Message[];
    conversationLength: number;
  }): number {
    let score = 0;

    // Stage contribution (40 points max)
    const stageScores: Record<ConversationStage, number> = {
      expression: 10,
      exploration: 25,
      understanding: 35,
      reflection: 40,
      intervention: 40,
      closure: 15 // Too late
    };
    score += stageScores[params.stage];

    // Crisis situations should NOT get high readiness scores (need human intervention)
    if (params.intensity === 'crisis') {
      return 0;
    }

    // Intensity consideration (20 points max)
    // High intensity = not ready yet (still in emotional peak)
    // Moderate = good time to suggest exercises
    const intensityScores = {
      low: 15,
      moderate: 20,
      high: 5,
      crisis: 0
    };
    score += intensityScores[params.intensity];

    // Conversation depth (20 points max)
    const avgMessageLength = params.messages.reduce((sum, m) => sum + m.content.length, 0) / params.messages.length;
    if (avgMessageLength > 150) score += 20;
    else if (avgMessageLength > 80) score += 10;

    // Conversation maturity (20 points max)
    if (params.conversationLength >= 5) score += 20;
    else if (params.conversationLength >= 3) score += 10;

    return Math.min(100, score);
  }

  /**
   * Detect conversation depth
   */
  private static detectConversationDepth(messages: Message[]): 'surface' | 'moderate' | 'deep' {
    const avgLength = messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length;
    const hasDeepThinking = messages.some(m => 
      m.content.toLowerCase().includes('because') ||
      m.content.toLowerCase().includes('realize') ||
      m.content.toLowerCase().includes('understand')
    );

    if (avgLength > 150 && hasDeepThinking) return 'deep';
    if (avgLength > 80) return 'moderate';
    return 'surface';
  }

  /**
   * Detect insight moments ("aha" moments)
   */
  private static detectInsightMoment(message: string): boolean {
    const insightIndicators = [
      'i think i',
      'i realize',
      'i understand now',
      'that makes sense',
      'i see now',
      'i guess',
      'maybe i',
      'i\'ve been',
      'i should',
      'i need to'
    ];

    return insightIndicators.some(indicator => message.includes(indicator));
  }

  /**
   * Check if venting phase is complete
   */
  private static isVentingComplete(messages: Message[], stage: ConversationStage): boolean {
    if (stage === 'expression') return false;

    // Check if messages are getting longer and more reflective
    if (messages.length < 2) return false;

    const recentLength = messages[messages.length - 1].content.length;
    const previousLength = messages[messages.length - 2].content.length;

    return recentLength > previousLength && recentLength > 80;
  }

  // Helper methods for stage detection

  private static hasClosureIndicators(message: string): boolean {
    const closurePatterns = [
      'thank you',
      'thanks for listening',
      'i feel better',
      'that helps',
      'i should go',
      'i\'ll try that',
      'goodbye',
      'bye'
    ];
    return closurePatterns.some(pattern => message.includes(pattern));
  }

  private static hasInsightIndicators(message: string): boolean {
    const insightPatterns = [
      'i think i',
      'i realize',
      'i understand',
      'that makes sense',
      'i see',
      'maybe i',
      'i guess i'
    ];
    return insightPatterns.some(pattern => message.includes(pattern));
  }

  private static hasUnderstandingIndicators(message: string): boolean {
    const understandingPatterns = [
      'because',
      'the reason',
      'i noticed',
      'it seems like',
      'i\'ve been'
    ];
    return understandingPatterns.some(pattern => message.includes(pattern));
  }

  private static hasExplorationIndicators(message: string): boolean {
    const explorationPatterns = [
      'why do i',
      'why am i',
      'what makes',
      'how come',
      'wondering'
    ];
    return explorationPatterns.some(pattern => message.includes(pattern));
  }

  private static isStillVenting(messages: Message[]): boolean {
    // Short, emotional bursts indicate venting
    const recent = messages.slice(-3);
    const avgLength = recent.reduce((sum, m) => sum + m.content.length, 0) / recent.length;
    return avgLength < 60 && recent.length < 4;
  }

  private static getInitialState(): ConversationState {
    return {
      stage: 'expression',
      emotion: 'neutral',
      intensity: 'low',
      readinessScore: 0,
      userIntent: 'general_conversation',
      conversationDepth: 'surface',
      insightMoment: false,
      ventingComplete: false
    };
  }
}
