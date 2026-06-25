/**
 * Conversation Memory Service
 * 
 * Purpose: Store and retrieve user facts RELIABLY
 * Critical: Never let AI "decide" if it knows something
 * 
 * Problem Solved:
 * - "What's my name?" → "I don't have access" (WRONG)
 * - Should always know if name was provided
 */

export interface UserMemory {
  userName?: string;
  pronouns?: string;
  mentionedTopics: string[];
  emotionalState?: {
    current?: string;
    intensity?: number;
  };
  sessionContext?: {
    examStress?: boolean;
    relationshipIssues?: boolean;
    familyConflict?: boolean;
    academicPressure?: boolean;
  };
  lastDiscussedTopic?: string;
  preferences?: {
    copingStrategies?: string[];
    triggers?: string[];
  };
}

export class ConversationMemory {
  /**
   * Extract facts from user message
   * Never trust AI memory - use structured extraction
   */
  static extractFacts(message: string, currentMemory: UserMemory): UserMemory {
    const messageLower = message.toLowerCase();
    const updatedMemory = { ...currentMemory };
    
    // Extract name (various patterns)
    // CRITICAL FIX: Only extract from explicit name statements
    const namePatterns = [
      /my name is (\w+)/i,
      /call me (\w+)/i,
      /this is (\w+)/i,
      // DO NOT USE: /i'?m (\w+)/i - too broad, catches "I'm not sure" → "Not"
    ];
    
    // Blacklist of invalid names
    const invalidNames = [
      'not', 'none', 'nothing', 'unknown', 'sure', 'okay', 'fine', 
      'good', 'bad', 'yes', 'no', 'maybe', 'i', 'me', 'my', 'is'
    ];
    
    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const extractedName = match[1].toLowerCase();
        
        // Validate name
        if (extractedName.length < 2) continue; // Too short
        if (invalidNames.includes(extractedName)) continue; // Blacklisted
        if (/\d/.test(extractedName)) continue; // Contains numbers
        
        // Valid name - capitalize first letter
        updatedMemory.userName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1).toLowerCase();
        break;
      }
    }
    
    // Extract emotional state
    const emotionalKeywords = {
      'anxious': 8,
      'stressed': 7,
      'worried': 6,
      'overwhelmed': 9,
      'sad': 6,
      'depressed': 9,
      'angry': 7,
      'frustrated': 6,
      'lonely': 7,
      'scared': 8,
      'hurt': 6,
      'disappointed': 5,
      'hopeless': 10,
      'exhausted': 7,
      'nervous': 6,
      'afraid': 8,
      'upset': 5
    };
    
    for (const [emotion, intensity] of Object.entries(emotionalKeywords)) {
      if (messageLower.includes(emotion)) {
        updatedMemory.emotionalState = {
          current: emotion,
          intensity
        };
        break;
      }
    }
    
    // Extract session context (what they're dealing with)
    if (!updatedMemory.sessionContext) {
      updatedMemory.sessionContext = {};
    }
    
    if (/exam|test|grade|quiz/i.test(message)) {
      updatedMemory.sessionContext.examStress = true;
      updatedMemory.lastDiscussedTopic = 'exam stress';
    }
    
    if (/parent|mom|dad|mother|father|family/i.test(message)) {
      updatedMemory.sessionContext.familyConflict = true;
      updatedMemory.lastDiscussedTopic = 'family issues';
    }
    
    if (/friend|relationship|breakup|boyfriend|girlfriend/i.test(message)) {
      updatedMemory.sessionContext.relationshipIssues = true;
      updatedMemory.lastDiscussedTopic = 'relationship concerns';
    }
    
    if (/homework|assignment|study|studying|school work/i.test(message)) {
      updatedMemory.sessionContext.academicPressure = true;
      updatedMemory.lastDiscussedTopic = 'academic pressure';
    }
    
    // Track mentioned topics
    const topicKeywords = {
      'exams': /exam|test|grade/i,
      'family': /parent|mom|dad|family/i,
      'friends': /friend|friendship/i,
      'relationships': /relationship|boyfriend|girlfriend|breakup/i,
      'school': /school|class|teacher/i,
      'anxiety': /anxious|anxiety|worried/i,
      'depression': /depressed|depression|sad|hopeless/i,
      'stress': /stressed|stress|pressure/i
    };
    
    for (const [topic, pattern] of Object.entries(topicKeywords)) {
      if (pattern.test(message)) {
        if (!updatedMemory.mentionedTopics.includes(topic)) {
          updatedMemory.mentionedTopics.push(topic);
        }
      }
    }
    
    return updatedMemory;
  }
  
  /**
   * Generate memory context for AI prompt
   * This is injected into EVERY AI call
   */
  static generateContext(memory: UserMemory): string {
    const parts: string[] = [];
    
    if (memory.userName) {
      parts.push(`KNOWN USER INFORMATION:\n- User's name: ${memory.userName}`);
    }
    
    if (memory.emotionalState?.current) {
      parts.push(`- Current emotional state: ${memory.emotionalState.current} (intensity: ${memory.emotionalState.intensity}/10)`);
    }
    
    if (memory.lastDiscussedTopic) {
      parts.push(`- Last discussed topic: ${memory.lastDiscussedTopic}`);
    }
    
    if (memory.sessionContext) {
      const contexts: string[] = [];
      if (memory.sessionContext.examStress) contexts.push('exam/test stress');
      if (memory.sessionContext.familyConflict) contexts.push('family conflict');
      if (memory.sessionContext.relationshipIssues) contexts.push('relationship concerns');
      if (memory.sessionContext.academicPressure) contexts.push('academic pressure');
      
      if (contexts.length > 0) {
        parts.push(`- Session context: ${contexts.join(', ')}`);
      }
    }
    
    if (memory.mentionedTopics.length > 0) {
      parts.push(`- Topics mentioned this session: ${memory.mentionedTopics.join(', ')}`);
    }
    
    return parts.length > 0 
      ? `\n\n${parts.join('\n')}\n`
      : '';
  }
  
  /**
   * Initialize empty memory for new session
   */
  static createEmpty(): UserMemory {
    return {
      mentionedTopics: [],
      sessionContext: {}
    };
  }
  
  /**
   * Check if memory contains user's name
   */
  static hasName(memory: UserMemory): boolean {
    return !!memory.userName;
  }
  
  /**
   * Get user's name or null
   */
  static getName(memory: UserMemory): string | null {
    return memory.userName || null;
  }
}
