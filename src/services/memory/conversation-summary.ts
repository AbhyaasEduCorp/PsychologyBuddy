/**
 * Conversation Summary Service
 * 
 * Purpose: Generate accurate summaries from ACTUAL messages
 * Critical: Never let AI "guess" what was discussed
 * 
 * Problem Solved:
 * - "What did we discuss?" → AI hallucinates (WRONG)
 * - Should read from actual message history
 */

interface Message {
  senderType: 'STUDENT' | 'BOT';
  content: string;
  createdAt: Date;
}

export interface ConversationSummary {
  topics: string[];
  keyMoments: string[];
  emotionalThemes: string[];
  userConcerns: string[];
  conversationStage: 'greeting' | 'exploration' | 'deep_discussion' | 'reflection' | 'closing';
  messageCount: number;
}

export class ConversationSummaryService {
  /**
   * Generate accurate summary from actual messages
   * NO AI GUESSING - read from real history
   */
  static generateSummary(messages: Message[]): ConversationSummary {
    const topics = new Set<string>();
    const keyMoments: string[] = [];
    const emotionalThemes = new Set<string>();
    const userConcerns: string[] = [];
    
    // Filter only student messages for analysis
    const studentMessages = messages.filter(msg => msg.senderType === 'STUDENT');
    
    for (const msg of studentMessages) {
      // Extract topics
      const detectedTopics = this.detectTopics(msg.content);
      detectedTopics.forEach(t => topics.add(t));
      
      // Extract emotional themes
      const emotions = this.detectEmotions(msg.content);
      emotions.forEach(e => emotionalThemes.add(e));
      
      // Identify key moments (significant emotional expressions)
      if (this.isKeyMoment(msg.content)) {
        keyMoments.push(msg.content.substring(0, 100));
      }
      
      // Extract user concerns
      const concerns = this.extractConcerns(msg.content);
      userConcerns.push(...concerns);
    }
    
    // Determine conversation stage
    const stage = this.determineStage(messages);
    
    return {
      topics: Array.from(topics),
      keyMoments,
      emotionalThemes: Array.from(emotionalThemes),
      userConcerns,
      conversationStage: stage,
      messageCount: messages.length
    };
  }
  
  /**
   * Detect topics from message content
   */
  private static detectTopics(message: string): string[] {
    const topics: string[] = [];
    const messageLower = message.toLowerCase();
    
    const topicPatterns = {
      'exams': /exam|test|grade|quiz|result/i,
      'academics': /school|study|homework|assignment|class/i,
      'relationships': /friend|boyfriend|girlfriend|relationship|dating/i,
      'family': /parent|mom|dad|mother|father|family|sibling/i,
      'anxiety': /anxious|anxiety|worried|panic|nervous/i,
      'depression': /depressed|depression|sad|hopeless|empty/i,
      'stress': /stressed|stress|pressure|overwhelmed/i,
      'self-esteem': /confidence|self-esteem|worth|good enough/i,
      'loneliness': /lonely|alone|isolated|nobody/i,
      'anger': /angry|frustrated|mad|irritated/i,
      'sleep': /sleep|insomnia|tired|exhausted/i,
      'future': /future|career|college|plans/i
    };
    
    for (const [topic, pattern] of Object.entries(topicPatterns)) {
      if (pattern.test(messageLower)) {
        topics.push(topic);
      }
    }
    
    return topics;
  }
  
  /**
   * Detect emotional themes
   */
  private static detectEmotions(message: string): string[] {
    const emotions: string[] = [];
    const messageLower = message.toLowerCase();
    
    const emotionPatterns = {
      'anxiety': /anxious|worried|scared|nervous|afraid/i,
      'sadness': /sad|depressed|down|hopeless|empty/i,
      'stress': /stressed|overwhelmed|pressure|too much/i,
      'anger': /angry|frustrated|mad|annoyed/i,
      'loneliness': /lonely|alone|isolated/i,
      'confusion': /confused|don't know|not sure/i,
      'hurt': /hurt|pain|wounded/i,
      'disappointment': /disappointed|let down|failed/i
    };
    
    for (const [emotion, pattern] of Object.entries(emotionPatterns)) {
      if (pattern.test(messageLower)) {
        emotions.push(emotion);
      }
    }
    
    return emotions;
  }
  
  /**
   * Identify if message is a key moment
   */
  private static isKeyMoment(message: string): boolean {
    const keyMomentPatterns = [
      /i feel|i'm feeling/i,
      /i can't|i cannot/i,
      /nobody|no one/i,
      /always|never/i,
      /i failed|i messed up/i,
      /i'm struggling|struggling with/i,
      /i don't want to/i,
      /makes me feel/i,
      /i'm worried|i'm scared/i
    ];
    
    return keyMomentPatterns.some(pattern => pattern.test(message));
  }
  
  /**
   * Extract specific user concerns
   */
  private static extractConcerns(message: string): string[] {
    const concerns: string[] = [];
    
    // Pattern: "I'm worried about X"
    const worriedMatch = message.match(/worried about (.+?)(?:\.|$)/i);
    if (worriedMatch) concerns.push(worriedMatch[1]);
    
    // Pattern: "I'm stressed about X"
    const stressedMatch = message.match(/stressed about (.+?)(?:\.|$)/i);
    if (stressedMatch) concerns.push(stressedMatch[1]);
    
    // Pattern: "I failed X"
    const failedMatch = message.match(/failed (?:in |my )?(.+?)(?:\.|$)/i);
    if (failedMatch) concerns.push(`failing ${failedMatch[1]}`);
    
    return concerns;
  }
  
  /**
   * Determine conversation stage
   */
  private static determineStage(messages: Message[]): ConversationSummary['conversationStage'] {
    const messageCount = messages.length;
    const studentMessages = messages.filter(m => m.senderType === 'STUDENT');
    
    if (messageCount <= 4) return 'greeting';
    if (messageCount <= 10) return 'exploration';
    if (messageCount <= 20) return 'deep_discussion';
    
    // Check if conversation seems to be winding down
    const lastStudentMessages = studentMessages.slice(-3).map(m => m.content.toLowerCase());
    const closingPhrases = ['thanks', 'thank you', 'okay', 'got it', 'bye', 'that helps'];
    const hasClosingPhrase = lastStudentMessages.some(msg => 
      closingPhrases.some(phrase => msg.includes(phrase))
    );
    
    return hasClosingPhrase ? 'closing' : 'reflection';
  }
  
  /**
   * Generate natural language summary for AI context
   */
  static generateNaturalSummary(summary: ConversationSummary): string {
    const parts: string[] = [];
    
    if (summary.topics.length > 0) {
      parts.push(`Topics discussed: ${summary.topics.join(', ')}`);
    }
    
    if (summary.emotionalThemes.length > 0) {
      parts.push(`Emotional themes: ${summary.emotionalThemes.join(', ')}`);
    }
    
    if (summary.userConcerns.length > 0) {
      parts.push(`User concerns: ${summary.userConcerns.join(', ')}`);
    }
    
    parts.push(`Conversation stage: ${summary.conversationStage}`);
    
    return parts.length > 0
      ? `\n\nCONVERSATION SUMMARY:\n${parts.join('\n')}\n`
      : '';
  }
}
