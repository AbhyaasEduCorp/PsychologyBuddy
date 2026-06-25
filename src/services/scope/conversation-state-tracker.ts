/**
 * Conversation State Tracker
 * 
 * Purpose: Track active topics and prevent redirect bypass
 * Critical Fix: Once out-of-scope topic detected, lock it for next N messages
 * 
 * Problem Solved:
 * - User says "movie" → redirect ✅
 * - User says "bollywood" → bot discusses movies ❌ (BYPASS)
 * 
 * Solution:
 * - User says "movie" → redirect + LOCK "entertainment" topic
 * - User says "bollywood" → still classified as "entertainment" → redirect
 */

export interface ConversationState {
  // Active out-of-scope topic (if any)
  outOfScopeTopic?: string;
  outOfScopeCategory?: string;
  
  // Topic lock metadata
  topicLockedAt?: Date;
  topicLockMessageCount: number; // How many messages since lock
  
  // Redirect tracking
  redirectCount: number; // Total redirects in this session
  consecutiveRedirects: number; // Redirects in a row
  
  // Memory status
  memoryAvailable: boolean;
  userName?: string;
  
  // Conversation flow
  lastUserIntent?: string;
  lastEmotionalTopic?: string;
}

export class ConversationStateTracker {
  // Topic lock duration (messages) — 8 turns to prevent drift through related sub-topics
  private static readonly TOPIC_LOCK_DURATION = 8;
  
  // Max consecutive redirects before special handling
  private static readonly MAX_CONSECUTIVE_REDIRECTS = 3;
  
  /**
   * Create empty conversation state
   */
  static createEmpty(): ConversationState {
    return {
      topicLockMessageCount: 0,
      redirectCount: 0,
      consecutiveRedirects: 0,
      memoryAvailable: false
    };
  }
  
  /**
   * Lock an out-of-scope topic
   * Next N messages related to this topic will be automatically rejected
   */
  static lockOutOfScopeTopic(
    state: ConversationState,
    topic: string,
    category: string
  ): ConversationState {
    return {
      ...state,
      outOfScopeTopic: topic,
      outOfScopeCategory: category,
      topicLockedAt: new Date(),
      topicLockMessageCount: 0,
      consecutiveRedirects: state.consecutiveRedirects + 1
    };
  }
  
  /**
   * Check if message is related to locked topic
   * Returns true if message should be auto-rejected
   */
  static isLockedTopicMessage(
    state: ConversationState,
    message: string
  ): boolean {
    // No locked topic
    if (!state.outOfScopeTopic) return false;
    
    // Topic lock expired
    if (state.topicLockMessageCount >= this.TOPIC_LOCK_DURATION) {
      return false;
    }
    
    // Check if message is related to locked topic
    const messageLower = message.toLowerCase();
    
    const topicPatterns: Record<string, RegExp[]> = {
      'entertainment': [
        /movie|film|actor|actress|director|cinema|hollywood|bollywood|series|show|netflix|celebrity|star/i,
        /watch|watching|recommend.*movie|favorite.*movie/i,
        // Add specific entertainment-related terms
        /shah rukh|srk|deepika|ranveer|priyanka|amitabh/i, // Bollywood actors
        /action|drama|thriller|comedy|romantic.*movie|genres?/i, // Movie genres
        /favorite.*(actor|actress|film|series)/i, // Favorite entertainment
        /which.*movie|name.*movie|tell.*about.*(actor|movie)/i, // Entertainment queries
        /discuss.*(them|movies|actors|films)/i // Discussion about entertainment
      ],
      'food': [
        /recipe|cook|food|veggie|vegetable|fruit|dish|meal|cuisine|nutrition/i,
        /eat|eating|taste|delicious|favorite.*food/i,
        /lets talk about (fruits?|vegetables?|veggies?)/i
      ],
      'coding': [
        /code|coding|program|programming|function|debug|software|developer|javascript|python|html|css|react/i
      ],
      'homework': [
        /homework|assignment|solve|answer|question|math|science|help.*with/i
      ],
      'politics': [
        /politics|government|president|minister|election|vote|party/i
      ],
      'sports': [
        /sport|game|match|football|cricket|basketball|team|player/i
      ],
      'shopping': [
        /shop|shopping|buy|purchase|product|price|store/i
      ]
    };
    
    // Get patterns for locked category
    const categoryPatterns = topicPatterns[state.outOfScopeCategory || state.outOfScopeTopic] || [];
    
    // Check if message matches any pattern
    return categoryPatterns.some(pattern => pattern.test(messageLower));
  }
  
  /**
   * Increment message count for locked topic
   */
  static incrementLockCount(state: ConversationState): ConversationState {
    if (!state.outOfScopeTopic) return state;
    
    const newCount = state.topicLockMessageCount + 1;
    
    // If lock expired, clear topic
    if (newCount >= this.TOPIC_LOCK_DURATION) {
      return {
        ...state,
        outOfScopeTopic: undefined,
        outOfScopeCategory: undefined,
        topicLockedAt: undefined,
        topicLockMessageCount: 0
      };
    }
    
    return {
      ...state,
      topicLockMessageCount: newCount
    };
  }
  
  /**
   * Clear locked topic (user changed subject successfully)
   */
  static clearLockedTopic(state: ConversationState): ConversationState {
    return {
      ...state,
      outOfScopeTopic: undefined,
      outOfScopeCategory: undefined,
      topicLockedAt: undefined,
      topicLockMessageCount: 0,
      consecutiveRedirects: 0 // Reset consecutive count
    };
  }
  
  /**
   * Update redirect count
   */
  static incrementRedirectCount(state: ConversationState): ConversationState {
    return {
      ...state,
      redirectCount: state.redirectCount + 1,
      consecutiveRedirects: state.consecutiveRedirects + 1
    };
  }
  
  /**
   * Reset consecutive redirects (user sent in-scope message)
   */
  static resetConsecutiveRedirects(state: ConversationState): ConversationState {
    return {
      ...state,
      consecutiveRedirects: 0
    };
  }
  
  /**
   * Check if user is testing boundaries (too many consecutive redirects)
   */
  static isBoundaryTesting(state: ConversationState): boolean {
    return state.consecutiveRedirects >= this.MAX_CONSECUTIVE_REDIRECTS;
  }
  
  /**
   * Update memory status
   */
  static updateMemoryStatus(
    state: ConversationState,
    userName?: string
  ): ConversationState {
    return {
      ...state,
      memoryAvailable: !!userName,
      userName
    };
  }
  
  /**
   * Update conversation flow
   */
  static updateConversationFlow(
    state: ConversationState,
    intent?: string,
    emotionalTopic?: string
  ): ConversationState {
    return {
      ...state,
      lastUserIntent: intent,
      lastEmotionalTopic: emotionalTopic
    };
  }
  
  /**
   * Get state summary for logging
   */
  static getSummary(state: ConversationState): string {
    const parts: string[] = [];
    
    if (state.outOfScopeTopic) {
      parts.push(`Locked: ${state.outOfScopeTopic} (${state.topicLockMessageCount}/${this.TOPIC_LOCK_DURATION})`);
    }
    
    if (state.consecutiveRedirects > 0) {
      parts.push(`Redirects: ${state.consecutiveRedirects}`);
    }
    
    if (state.userName) {
      parts.push(`User: ${state.userName}`);
    }
    
    if (state.lastEmotionalTopic) {
      parts.push(`Topic: ${state.lastEmotionalTopic}`);
    }
    
    return parts.length > 0 ? parts.join(' | ') : 'Empty state';
  }
}
