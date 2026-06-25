/**
 * Scope Classifier Service
 * 
 * Purpose: Gate-keep user messages BEFORE calling the LLM
 * Prevents out-of-scope conversations (recipes, coding, movies, etc.)
 * 
 * Critical Feature: Fast pattern matching with emotional context detection
 */

export interface ScopeClassificationResult {
  inScope: boolean;
  confidence: number; // 0-100
  category: 
    | 'mental_health'      // ✅ In scope
    | 'emotional_wellness' // ✅ In scope
    | 'stress_anxiety'     // ✅ In scope
    | 'relationships'      // ✅ In scope
    | 'self_reflection'    // ✅ In scope
    | 'recipe'             // ❌ Out of scope
    | 'coding'             // ❌ Out of scope
    | 'movie'              // ❌ Out of scope
    | 'politics'           // ❌ Out of scope
    | 'general_knowledge'  // ❌ Out of scope
    | 'homework'           // ❌ Out of scope
    | 'technical_help'     // ❌ Out of scope
    | 'daily_life_leakage' // ❌ Out of scope (food, sleep, weather, etc. becoming main topic)
    | 'unclear';           // ⚠️ Needs clarification
  emotionalConnection: boolean; // Is there an emotional component?
  reason: string;
}

export class ScopeClassifier {
  /**
   * Classify user message BEFORE calling LLM
   * Uses fast pattern matching first, then falls back to LLM for ambiguous cases
   */
  static async classify(
    message: string,
    conversationHistory?: string[]
  ): Promise<ScopeClassificationResult> {
    
    const messageLower = message.toLowerCase().trim();
    
    // 0. Check in-scope patterns FIRST (emotional content takes priority)
    // This ensures emotional context is detected before blocking
    const inScopePatterns = {
      emotions: /anxious|stressed|worried|sad|depressed|angry|frustrated|overwhelmed|overwhelming|lonely|scared|hurt|disappointed|hopeless|exhausted|nervous|afraid|upset|miserable|worthless|irritable|dizzy|weak|focus|panic|insecure/i,
      mental_health: /mental health|therapy|counseling|struggling|can't cope|breaking down|burnout|can't handle|falling apart/i,
      relationships: /friend|family|parent|relationship|fight|argument|breakup|conflict|betrayed|abandoned|rejected|ignored/i,
      stress: /stress|pressure|too much|can't handle|overworked|drowning|suffocating/i,
      self_reflection: /feel|feeling|emotion|why do i|understand myself|what's wrong with me|am i|who am i|self doubt/i,
    };
    
    for (const [category, pattern] of Object.entries(inScopePatterns)) {
      if (pattern.test(messageLower)) {
        return {
          inScope: true,
          confidence: 90,
          category: 'mental_health',
          emotionalConnection: true,
          reason: `Clear mental health/emotional content (${category})`
        };
      }
    }
    
    // 1. Check explicit out-of-scope patterns (fast path)
    // This must come BEFORE daily-life leakage to catch explicit topics like movies/finance
    const outOfScopePatterns = {
      'recipe': /recipe|cook|ingredients|food preparation|how to make|cooking instructions|bake|baking/i,
      'coding': /code|program|function|javascript|python|bug|error|html|css|react|angular|vue|nodejs|programming|syntax|debug|compile/i,
      'movie': /movie|film|watch|recommend.*movie|suggest.*movie|actor|actress|cinema|series|show|netflix|streaming|hollywood|bollywood|famous actor/i,
      'politics': /president|minister|government|politics|election|party|congress|parliament|vote|campaign/i,
      'finance': /stock|market|trading|invest|portfolio|dividend|share|option|futures|forex|crypto|bitcoin|ethereum|broker|bull|bear|wall street|nasdaq|dow jones|s&p|intraday|swing|day trading/i,
      'general_knowledge': /who is|what is|capital of|population of|history of|geography|science question|math question|define|explain.*concept|tell me about|talk about (movies|fruits|vegetables|food|sports|games|politics)|favorite (movie|food|fruit|vegetable|sport|game|color)|what do you think about|recommend me/i,
      'homework': /homework|assignment|solve this|answer.*question|exam question|help.*with.*problem|school.*work/i,
      'technical_help': /install|download|setup|configure|computer|phone|device|software|app.*not.*working|troubleshoot/i,
      'general_info_request': /lets talk about (?!how|feeling|stress|anxiety|emotions|mental|wellbeing|relationships|friends|family|school pressure|exam stress)|tell me more about (?!how|feeling|myself|stress|anxiety|what i'm going through)|whats? your favorite|what type of (movies|food|music|sports)|any famous/i
    };
    
    for (const [category, pattern] of Object.entries(outOfScopePatterns)) {
      if (pattern.test(messageLower)) {
        // Check if there's emotional connection
        const hasEmotionalContext = this.detectEmotionalConnection(message);
        
        // CONTEXT-AWARE: Sports/entertainment topics about relationships are IN-SCOPE
        // Example: "fighting over cricket match" is about friendship conflict, not sports
        const contextAwarePatterns = {
          sports_conflict: /fight(ing)?|argu(ing|ment)|hate|angry|irritat|annoy|mad|upset|betting|bet|win|lose/i,
          movie_conflict: /fight(ing)?|argu(ing|ment)|breakup|relationship|crush|love|feelings for/i,
        };
        
        const isContextualRelationship = Object.values(contextAwarePatterns).some(p => p.test(messageLower));
        
        if (isContextualRelationship) {
          return {
            inScope: true,
            confidence: 90,
            category: 'relationships',
            emotionalConnection: true,
            reason: `${category} topic but context is about relationship conflict/emotion`
          };
        }
        
        if (!hasEmotionalContext) {
          return {
            inScope: false,
            confidence: 95,
            category: category as any,
            emotionalConnection: false,
            reason: `Pure ${category} request with no emotional context`
          };
        } else {
          // Has emotional connection - allow it but flag the category
          return {
            inScope: true,
            confidence: 85,
            category: 'emotional_wellness',
            emotionalConnection: true,
            reason: `${category} topic but with clear emotional context`
          };
        }
      }
    }
    
    // 2. Check for daily-life topic leakage (prevent drift to non-emotional topics)
    const dailyLifeLeakage = this.detectDailyLifeTopicLeakage(message, conversationHistory);
    if (dailyLifeLeakage.isLeakage) {
      return {
        inScope: false,
        confidence: 90,
        category: 'daily_life_leakage',
        emotionalConnection: false,
        reason: dailyLifeLeakage.reason
      };
    }
    
    // 3. Check for minimal/unclear messages
    const minimalMessages = /^(hi|hello|hey|ok|okay|yes|no|hmm|hmmm|idk|k|kk|lol|haha|yeah|yea|nah)$/i;
    if (minimalMessages.test(messageLower)) {
      return {
        inScope: true,
        confidence: 100,
        category: 'unclear',
        emotionalConnection: false,
        reason: 'Minimal greeting or acknowledgment - allow conversation to continue'
      };
    }
    
    // 4. If no patterns match, treat as unclear but allow it
    // (Let the system prompt handle unclear messages naturally)
    return {
      inScope: true,
      confidence: 60,
      category: 'unclear',
      emotionalConnection: false,
      reason: 'Message does not match clear patterns - allowing with low confidence'
    };
  }
  
  /**
   * Detect if out-of-scope topic has emotional connection
   * 
   * This checks the INTENT, not just the topic.
   * 
   * Examples:
   * - "I'm stressed about coding" ✅ Has emotional connection
   * - "Write me a Python function" ❌ No emotional connection
   * - "I'm worried about my exam" ✅ Has emotional connection
   * - "Solve this math problem" ❌ No emotional connection
   * - "How do I control emotions while trading?" ✅ Has emotional connection
   * - "I get very emotional while trading" ✅ Has emotional connection
   * - "My coding project is stressing me out" ✅ Has emotional connection
   */
  private static detectEmotionalConnection(message: string): boolean {
    const emotionalConnectors = [
      // Emotional states with "about"
      /stressed about/i,
      /anxious about/i,
      /worried about/i,
      /scared about/i,
      /frustrated with/i,
      /overwhelmed by/i,
      /nervous about/i,
      /afraid of/i,
      
      // Emotional expressions
      /feeling.*because/i,
      /makes me feel/i,
      /struggling with/i,
      /can't handle/i,
      /difficult for me/i,
      /hard for me/i,
      
      // Self-reflection
      /why do i/i,
      /am i bad/i,
      /is something wrong with me/i,
      
      // Relational distress
      /makes me upset/i,
      /hurts me/i,
      /affects me/i,
      
      // Emotional control/intent patterns
      /emotional control/i,
      /control emotions/i,
      /manage emotions/i,
      /emotional while/i,
      /emotional when/i,
      /get emotional/i,
      /become emotional/i,
      /feel emotional/i,
      
      // Direct emotional statements
      /i'm struggling/i,
      /i am struggling/i,
      /i'm panicking/i,
      /i am panicking/i,
      /i panic/i,
      /i'm overwhelmed/i,
      /i am overwhelmed/i,
      
      // Emotional impact patterns
      /stressing me out/i,
      /stresses me out/i,
      /makes me anxious/i,
      /makes me stressed/i,
      /makes me angry/i,
      /makes me sad/i,
      /makes me frustrated/i,
      
      // Wellness/mental health context
      /improve.*wellness/i,
      /mental wellness/i,
      /emotional wellness/i,
      /emotional support/i,
      /emotional help/i,
    ];
    
    return emotionalConnectors.some(pattern => pattern.test(message));
  }
  
  /**
   * Detect daily-life topic leakage
   * 
   * Distinguishes between:
   * - Emotional impact of daily states (allowed): "I'm hungry and it's making me irritable"
   * - Daily-life topics becoming the main conversation (not allowed): "Let's grab a snack", "I'm having deer curry"
   * 
   * This prevents conversations from drifting to food, sleep, weather, shopping, etc.
   */
  private static detectDailyLifeTopicLeakage(
    message: string,
    conversationHistory?: string[]
  ): { isLeakage: boolean; reason: string } {
    const messageLower = message.toLowerCase().trim();
    
    // Patterns that indicate daily-life topic is becoming the main focus
    const dailyLifeFocusPatterns = {
      food: [
        // Direct food statements (not emotional)
        /^(i am|i'm having|i'm eating|i ate) (a|some|the)?\s*(\w+\s+)?(food|meal|snack|lunch|dinner|breakfast|curry|pizza|burger|pasta|rice|bread|sandwich|salad|soup|noodles|chicken|beef|pork|fish|vegetable|fruit)/i,
        /^(let's|lets) (grab|get|have|eat) (a|some|the)?\s*(snack|food|meal|lunch|dinner|breakfast|bite)/i,
        /^(what|which) (food|snack|meal|dish) (should|do|can) i (eat|have|cook|make)/i,
        /what should i (eat|have|cook|make)/i,
        /^(i'm|i am) (going to|planning to|want to) (cook|make|eat|have) (a|some)?\s*(\w+\s+)?(food|meal|dish|recipe)/i,
        /what('s| is)? (for|your)? (dinner|lunch|breakfast|snack)/i,
        /what do you want to eat/i,
        /what should i cook/i,
        /i'm making /i,
        /i'm cooking /i,
        /i'm preparing /i,
        /grab a (snack|bite|food)/i,
        /have a (snack|meal|lunch|dinner)/i,
      ],
      sleep: [
        /^(i am|i'm) (going to|gonna) (sleep|bed|nap)/i,
        /^(i|i'm) (need to|gotta) (sleep|rest|nap)/i,
        /^(time for|it's time) (bed|sleep|nap)/i,
        /^(goodnight|good night|gn|gnight)/i,
        /^(i|i'm) off to (bed|sleep)/i,
        /i'm going to bed/i,
      ],
      weather: [
        /^(it's|its) (sunny|rainy|cloudy|hot|cold|windy|snowing)/i,
        /^(the )?weather (is|was|will be)/i,
        /^(what's|what is) the weather/i,
        /^(it's|its) (a )?(nice|beautiful|terrible|awful) day/i,
      ],
      shopping: [
        /^(i'm|i am) (going to|gonna) (buy|get|shop|shopping)/i,
        /^(i need|i want) to (buy|get|shop)/i,
        /^(let's|lets) go (shopping|to the store)/i,
        /^(i|i'm) (at the store|shopping)/i,
        /what should i buy/i,
        /going shopping/i,
        /going to the store/i,
        /i'm shopping/i,
      ],
      entertainment: [
        /^(i'm|i am) (watching|going to watch) (a|the)?\s*(movie|film|show|series)/i,
        /^(what|which) (movie|film|show) (should|do|can) i watch/i,
        /^(let's|lets) watch (a|the)?\s*(movie|film|show)/i,
        /i'm watching /i,
      ],
      music: [
        /^(i'm|i am) (listening to|going to listen) (some|a|the)?\s*(music|song)/i,
        /^(what|which) (song|music) (should|do|can) i listen to/i,
        /what's your favorite song/i,
      ],
      vacation: [
        /^(i'm|i am) (going to|planning to|on) (vacation|holiday|trip)/i,
        /^(i|i'm) (traveling|going to travel) to/i,
        /where should i go (for vacation|on holiday)/i,
        /going on vacation/i,
        /going on holiday/i,
      ],
    };
    
    // Check if current message matches daily-life focus patterns
    for (const [category, patterns] of Object.entries(dailyLifeFocusPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(messageLower)) {
          // Check if there's emotional context that would make this in-scope
          const hasEmotionalContext = this.detectEmotionalConnection(message);
          
          if (hasEmotionalContext) {
            // Allow if there's clear emotional context
            return { isLeakage: false, reason: '' };
          }
          
          // Check conversation history for drift
          if (conversationHistory && conversationHistory.length > 0) {
            const recentHistory = conversationHistory.slice(-3);
            const dailyLifeCount = recentHistory.filter(msg => {
              const msgLower = msg.toLowerCase();
              // Count how many recent messages are about this daily-life topic
              for (const pattern of patterns) {
                if (pattern.test(msgLower)) return true;
              }
              return false;
            }).length;
            
            // If 2+ recent messages are about this daily-life topic, it's leakage
            if (dailyLifeCount >= 1) {
              return {
                isLeakage: true,
                reason: `Conversation has drifted to ${category} topic without emotional context`
              };
            }
          }
          
          // Single message about daily-life topic without emotional context
          return {
            isLeakage: true,
            reason: `Daily-life ${category} topic without emotional connection`
          };
        }
      }
    }
    
    return { isLeakage: false, reason: '' };
  }

  /**
   * Check if message is part of a test/jailbreak attempt
   * Detects patterns like rapid topic switching or obvious boundary testing
   */
  static detectJailbreakAttempt(
    message: string,
    conversationHistory?: string[]
  ): boolean {
    if (!conversationHistory || conversationHistory.length < 3) {
      return false;
    }
    
    // Check if user is rapidly switching unrelated topics
    const recentTopics = conversationHistory.slice(-5);
    const topicCategories = new Set<string>();
    
    const topicPatterns = {
      'recipe': /recipe|cook|food/i,
      'movie': /movie|film|actor/i,
      'coding': /code|program/i,
      'politics': /politics|government/i,
      'homework': /homework|assignment/i,
    };
    
    for (const msg of recentTopics) {
      for (const [category, pattern] of Object.entries(topicPatterns)) {
        if (pattern.test(msg)) {
          topicCategories.add(category);
        }
      }
    }
    
    // If user has tried 3+ different out-of-scope topics, likely testing boundaries
    return topicCategories.size >= 3;
  }
}
