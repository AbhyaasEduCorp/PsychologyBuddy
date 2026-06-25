import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { 
      mood, triggers, notes, botMessage, lastMessages, 
      crisisContext, activeConcerns, conversationSummary, riskLevel 
    } = await req.json();

    console.log('Quick replies request:', { 
      mood, botMessage: botMessage?.substring(0, 50), 
      lastMessagesCount: lastMessages?.length, 
      hasCrisisContext: !!crisisContext,
      activeConcerns,
      riskLevel 
    });

    // Detect crisis signals from recent messages
    const CRISIS_SIGNALS = [
      /hurt(ing)? myself|self.?harm|blade|cut myself|want to die|suicidal|wrist.*hurting/i,
      /feel like hurting|hurting myself|hurt my (wrist|arm)/i,
    ];
    
    const allContent = [
      botMessage || '',
      ...(lastMessages || []).map((m: any) => m.content || '')
    ].join(' ');
    
    const hasCrisisSignals = crisisContext || 
      riskLevel === 'HIGH' || riskLevel === 'IMMINENT' || riskLevel === 'MODERATE' ||
      CRISIS_SIGNALS.some(p => p.test(allContent));

    // Auto-detect activeConcerns from lastMessages if not provided by caller
    let resolvedConcerns: string[] = activeConcerns || [];
    if (!activeConcerns?.length && lastMessages?.length) {
      const CONCERN_PATTERNS: Record<string, RegExp> = {
        'homesickness': /miss (my |home|family|mom|dad|parents)|feel homesick|want to go home|hate (hostel|boarding)/i,
        'loneliness': /feel (so )?alone|feel (so )?lonely|nobody (talks|cares)|no friends/i,
        'family separation': /away from (home|family)|hostel|boarding school/i,
        'exam stress': /exam|test stress|scared of (exam|test)|failing/i,
        'parental pressure': /parents? (compare|pressure|scold|angry|disappointed)/i,
        'friendship conflict': /fight with (my |a )?(friend|best friend)|falling out/i,
        'anxiety': /anxious|anxiety|panic|so nervous/i,
      };
      const historyText = lastMessages.map((m: any) => m.content || '').join(' ');
      const detected = new Set<string>();
      for (const [concern, pattern] of Object.entries(CONCERN_PATTERNS)) {
        if (pattern.test(historyText)) detected.add(concern);
      }
      resolvedConcerns = Array.from(detected);
    }

    // Build context for generating quick replies
    let context = "";
    
    // Crisis context — highest priority
    if (hasCrisisSignals) {
      context += `⚠️ CRISIS CONTEXT ACTIVE (riskLevel: ${riskLevel || 'detected'}): This student has expressed serious distress or self-harm concerns. Quick replies MUST reflect their emotional state — not generic cheerful responses.\n\n`;
    }
    
    // Active concerns — shape what topics feel relevant
    if (resolvedConcerns.length > 0) {
      context += `Active Concerns in This Conversation: ${resolvedConcerns.join(', ')}\n`;
      context += `Quick replies should feel relevant to these concerns.\n\n`;
    }
    
    // Conversation summary for additional context
    if (conversationSummary) {
      context += `Conversation Summary: ${conversationSummary}\n\n`;
    }
    
    if (botMessage) {
      context += `Buddy's Last Message: ${botMessage}\n`;
    }
    
    if (lastMessages?.length) {
      context += `\nRecent Context:\n`;
      lastMessages.slice(-5).forEach((msg: any) => {
        const role = msg.sender === 'student' ? 'Student' : 'Buddy';
        context += `${role}: ${msg.content.substring(0, 120)}${msg.content.length > 120 ? '...' : ''}\n`;
      });
    }
    
    if (mood) {
      context += `\nCurrent Mood: ${mood}\n`;
    }
    
    if (triggers?.length) {
      context += `Triggers/Concerns: ${triggers.join(", ")}\n`;
    }
    
    if (notes) {
      context += `Additional Notes: ${notes}\n`;
    }

    // Add context priority guidance
    context += `\nCONTEXT PRIORITY:
1. Buddy's last message (what question or statement did they make?)
2. Active concerns (what is this student actually going through?)
3. Crisis context (if active, replies must match emotional weight)
4. Recent conversation
5. Mood and triggers

If Buddy asked a question, the replies should directly answer that question.
If crisis context is active, replies must reflect the student's real situation.
If active concerns include homesickness/loneliness, replies should feel like a lonely student would say.
`;

    // Generate quick replies using OpenAI
    const prompt = `You are generating quick reply options for a STUDENT talking to Buddy (their emotional wellness companion).

${context}

CRITICAL: These are STUDENT replies, NOT Buddy replies!

Quick replies are things the STUDENT might naturally say in response to Buddy's message.

Generate 3-4 quick reply options that the STUDENT could click to send:
- What the student might naturally say next
- Natural student responses to Buddy's message
- Authentic student language
- Short and conversational (3-8 words)

EXAMPLE - CORRECT:
Buddy: "How are you feeling today?"
Student Quick Replies: ["I'm okay", "Not great honestly", "A bit stressed", "I'm not sure"]

EXAMPLE - WRONG (These are Buddy responses, not student responses):
❌ "I'm sorry to hear that"
❌ "That sounds tough"
❌ "Do you want to talk more?"
❌ "I'm here for you"

CRITICAL RULES:
1. Generate what the STUDENT would say, not what Buddy would say
2. If Buddy asked a question, provide natural STUDENT answers
3. If Buddy made a statement, provide natural STUDENT reactions
4. Use first-person perspective ("I'm...", "I feel...", "I've been...")
5. Sound like a real student talking to a supportive friend

STUDENT LANGUAGE EXAMPLES:
✅ "It's been rough"
✅ "I'm not sure"
✅ "Can we talk about it?"
✅ "Yeah, kind of"
✅ "I'm stressed about exams"
✅ "Things at home are hard"

BOT LANGUAGE TO AVOID:
❌ "I'm here for you" (That's what Buddy says)
❌ "Do you want to talk?" (That's what Buddy asks)
❌ "That sounds difficult" (That's Buddy's empathy)
❌ "I'm sorry to hear that" (That's Buddy's response)

CONTEXT PRIORITY:
1. What would a student naturally say after Buddy's last message?
2. What fits the recent conversation flow?
3. What matches the student's mood and triggers?

REPLY DIVERSITY:
- Direct answers
- Uncertainty expressions ("I'm not sure", "Maybe")
- Emotional disclosures ("I'm stressed", "I'm sad")
- Agreement ("Yeah", "I guess so")
- Questions ("Can we talk about it?", "What should I do?")

CRISIS CONTEXT REPLIES (Use ONLY when crisis signals are active):
If crisis context is active, generate replies like:
✅ "I'm still scared"
✅ "I don't know what to do"
✅ "Can we keep talking?"
✅ "I'm not okay"
✅ "It still hurts"
✅ "I don't want to tell anyone"
✅ "I'm feeling a bit better"
✅ "I needed to tell someone"

AVOID:
- Therapist language
- Support/empathy language (that's Buddy's role)
- Questions Buddy would ask
- Responses that sound like advice or suggestions
- Generic/upbeat replies when crisis context is active

Return ONLY a JSON array of strings, like:
["I'm not sure", "It's been difficult", "Can we talk about it?"]

No explanations, no markdown, just the JSON array.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "";
    console.log('OpenAI response:', content);

    // Parse the JSON response
    let quickReplies: string[] = [];
    try {
      // Try to parse as JSON array
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        // Stricter validation: max 35 chars AND max 8 words
        quickReplies = parsed.slice(0, 4).filter((reply: any) => {
          if (typeof reply !== 'string' || reply.length === 0) return false;
          const wordCount = reply.trim().split(/\s+/).length;
          return reply.length <= 35 && wordCount <= 8;
        });
      }
    } catch (parseError) {
      console.error('Failed to parse quick replies as JSON:', parseError);
      // Fallback: extract lines that look like replies
      const lines = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => {
          if (line.length === 0 || line.length > 35) return false;
          const wordCount = line.trim().split(/\s+/).length;
          return wordCount <= 8 && !line.startsWith('-') && !line.startsWith('*');
        });
      quickReplies = lines.slice(0, 4);
    }

    // If still no valid replies, use fallback based on mood
    if (quickReplies.length === 0) {
      quickReplies = getFallbackQuickReplies(mood, triggers);
    }

    console.log('Generated quick replies:', quickReplies);

    return NextResponse.json({
      success: true,
      quickReplies,
    });
  } catch (error) {
    console.error('Error generating quick replies:', error);
    
    // Return fallback replies on error
    const { mood, triggers } = await req.json().catch(() => ({}));
    const fallbackReplies = getFallbackQuickReplies(mood, triggers);
    
    return NextResponse.json({
      success: true,
      quickReplies: fallbackReplies,
    });
  }
}

function getFallbackQuickReplies(mood?: string, triggers?: string[]): string[] {
  // Updated fallback replies - more diverse and works for all emotional states
  const moodReplies: Record<string, string[]> = {
    "Happy": [
      "Yeah, things are going well",
      "Today's been pretty decent",
      "I'm not really sure why",
      "I've been feeling better"
    ],
    "Okay": [
      "I'm doing alright",
      "Not sure honestly",
      "A few things actually",
      "It's been okay I guess"
    ],
    "Sad": [
      "It's been a rough week",
      "I'm not really sure why",
      "Can we talk about it?",
      "I've been struggling lately"
    ],
    "Anxious": [
      "I'm worried about a lot",
      "It's hard to relax",
      "I keep overthinking things",
      "I'm not sure what's bothering me"
    ],
    "Tired": [
      "I'm really exhausted",
      "I've been so drained",
      "It's hard to explain",
      "I can't seem to rest"
    ],
  };

  const triggerReplies: Record<string, string[]> = {
    "exams": [
      "Exams are stressing me out",
      "I'm worried about failing",
      "It's hard to focus",
      "I'm not sure I'm ready"
    ],
    "family": [
      "Family stuff has been difficult",
      "Things at home are rough",
      "It's hard to explain",
      "I'm struggling with my family"
    ],
    "friends": [
      "I'm having friendship issues",
      "Things with friends are hard",
      "I feel left out lately",
      "I'm not sure what happened"
    ],
    "sleep": [
      "I can't sleep well lately",
      "I'm always tired",
      "It's hard to rest",
      "Sleep has been really hard"
    ],
    "school": [
      "School is overwhelming",
      "I'm stressed about classes",
      "It's a lot to handle",
      "I'm not sure I can keep up"
    ],
    "health": [
      "I'm worried about my health",
      "I haven't been feeling well",
      "It's been on my mind",
      "I'm not sure what's wrong"
    ],
  };

  // Try mood-based replies first
  if (mood && moodReplies[mood]) {
    return moodReplies[mood];
  }

  // Try trigger-based replies
  if (triggers?.length) {
    for (const trigger of triggers) {
      if (triggerReplies[trigger]) {
        return triggerReplies[trigger];
      }
    }
  }

  // Universal fallback - works for positive, neutral, and negative states
  return [
    "I'm not really sure",
    "A few things actually",
    "Can we talk about it?",
    "It's hard to explain"
  ];
}

