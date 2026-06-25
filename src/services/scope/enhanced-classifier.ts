/**
 * Enhanced Message Classifier
 * 
 * Comprehensive classification system with granular categories
 * Replaces simple pattern matching with detailed category analysis
 */

import {
  MentalHealthCategory,
  UtilityCategory,
  OutOfScopeCategory,
  SpecialCategory,
  InputQualityCategory,
  BlockedCategory,
  AbuseCategory,
  UserIntent,
  CategoryHelpers,
  type EnhancedClassificationResult,
  type Category
} from './classification-types';

export class EnhancedClassifier {
  /**
   * Classify message with comprehensive category system
   */
  static classify(
    message: string,
    conversationHistory?: string[]
  ): EnhancedClassificationResult {
    const messageLower = message.toLowerCase().trim();
    const matchedPatterns: string[] = [];
    
    // 1. Check input quality first
    const inputQuality = this.checkInputQuality(message);
    if (inputQuality) {
      return this.buildResult(
        inputQuality.category,
        true, // Allow - unclear messages should continue conversation
        inputQuality.confidence,
        UserIntent.UNKNOWN,
        false,
        matchedPatterns,
        inputQuality.reason
      );
    }
    
    // 2. Check abuse indicators (HIGHEST PRIORITY for student safety)
    const abuseCheck = this.checkAbuseCategories(messageLower, matchedPatterns);
    if (abuseCheck) {
      return abuseCheck;
    }
    
    // 3. Check blocked categories (sexual content, drugs, violence)
    const blockedCheck = this.checkBlockedCategories(messageLower, matchedPatterns);
    if (blockedCheck) {
      return blockedCheck;
    }
    
    // 4. Check special categories (prompt injection, jailbreak)
    const specialCheck = this.checkSpecialCategories(message, conversationHistory);
    if (specialCheck) {
      return specialCheck;
    }
    
    // 5. Check mental health categories (highest priority for in-scope)
    const mentalHealthCheck = this.checkMentalHealthCategories(messageLower, matchedPatterns);
    if (mentalHealthCheck) {
      return mentalHealthCheck;
    }
    
    // 6. Check utility categories (greetings, memory tests, etc.)
    const utilityCheck = this.checkUtilityCategories(messageLower, matchedPatterns);
    if (utilityCheck) {
      return utilityCheck;
    }
    
    // 7. Check out-of-scope categories
    const outOfScopeCheck = this.checkOutOfScopeCategories(messageLower, matchedPatterns);
    if (outOfScopeCheck) {
      return outOfScopeCheck;
    }
    
    // 8. Default: unknown but allow
    return this.buildResult(
      InputQualityCategory.UNKNOWN,
      true,
      50,
      UserIntent.UNKNOWN,
      false,
      matchedPatterns,
      'Message does not match clear patterns - allowing with low confidence'
    );
  }
  
  /**
   * Check input quality (gibberish, emoji-only, etc.)
   */
  private static checkInputQuality(message: string): { category: InputQualityCategory; confidence: number; reason: string } | null {
    // Empty message
    if (!message || message.trim().length === 0) {
      return {
        category: InputQualityCategory.EMPTY_MESSAGE,
        confidence: 100,
        reason: 'Empty or whitespace-only message'
      };
    }
    
    // Emoji only (check if message is very short and has no alphanumeric characters)
    const hasNoAlphanumeric = !/[a-zA-Z0-9]/.test(message);
    const isShort = message.length < 20;
    if (hasNoAlphanumeric && isShort && message.trim().length > 0) {
      return {
        category: InputQualityCategory.EMOJI_ONLY,
        confidence: 90,
        reason: 'Message contains no alphanumeric characters (likely emojis or symbols)'
      };
    }
    
    // Repeated characters (aaaaa, ........., etc.)
    const repeatedChars = /^(.)\1{4,}$/;
    if (repeatedChars.test(message.trim())) {
      return {
        category: InputQualityCategory.REPEATED_CHARACTERS,
        confidence: 100,
        reason: 'Message is repeated characters'
      };
    }
    
    // Gibberish (random characters, keyboard mashing)
    const consonantCluster = /[bcdfghjklmnpqrstvwxyz]{5,}/i;
    const vowelRatio = (message.match(/[aeiou]/gi) || []).length / message.length;
    if (consonantCluster.test(message) || (vowelRatio < 0.1 && message.length > 5)) {
      return {
        category: InputQualityCategory.GIBBERISH,
        confidence: 90,
        reason: 'Message appears to be gibberish or keyboard mashing'
      };
    }
    
    return null;
  }
  
  /**
   * Check abuse categories (HIGHEST PRIORITY for student safety)
   */
  private static checkAbuseCategories(
    messageLower: string,
    matchedPatterns: string[]
  ): EnhancedClassificationResult | null {
    const patterns: Record<AbuseCategory, RegExp[]> = {
      [AbuseCategory.PHYSICAL_ABUSE]: [
        /(parent|dad|mom|father|mother|teacher|coach).*(hits?|beats?|hurts?|punches?|kicks?) me/i,
        /someone (hits?|beats?|hurts?|punches?|kicks?) me/i,
        /(get|getting) (hit|beaten|hurt|abused) (at home|by)/i,
        /afraid.*(parent|dad|mom|father|mother).*(hurt|hit|beat)/i
      ],
      [AbuseCategory.SEXUAL_ABUSE]: [
        /(parent|dad|mom|father|mother|teacher|coach|uncle|relative).*(touches? me|makes? me|forces? me)/i,
        /someone.*(touches? me|makes? me do|forces? me).*(inappropriately|sexually|private)/i,
        /(molest|rape|sexual abuse)/i,
        /uncomfortable.*(touch|physical contact)/i
      ],
      [AbuseCategory.EMOTIONAL_ABUSE]: [
        /(parent|dad|mom).*(screams?|yells?|shouts?).*(constantly|every day|always)/i,
        /(calls? me|tells? me).*(worthless|stupid|useless|idiot).*(every day|always|constantly)/i,
        /afraid of (parent|dad|mom|father|mother)/i
      ],
      [AbuseCategory.NEGLECT]: [
        /(parents?|dad|mom).*(don't|doesn't|never) (feed me|give me food|care about me)/i,
        /no food at home/i,
        /(left alone|stay alone) (all day|all night|for days)/i
      ],
      [AbuseCategory.SEVERE_BULLYING]: [
        /(everyone|kids|students|classmates).*(hates? me|wants? me dead|threatens? me)/i,
        /(scared|afraid|terrified) to go to school/i,
        /(bullies?|kids).*(threaten|hurt|beat).*(every day|constantly)/i,
        /want to kill me|going to hurt me/i
      ]
    };
    
    for (const [category, regexList] of Object.entries(patterns)) {
      for (const regex of regexList) {
        if (regex.test(messageLower)) {
          matchedPatterns.push(regex.source);
          
          return this.buildResult(
            category as AbuseCategory,
            true, // In scope but requires special handling
            100,
            UserIntent.CRISIS,
            true,
            matchedPatterns,
            `Abuse indicator detected: ${category} - requires immediate attention`,
            true, // Requires immediate attention
            false,
            false,
            10, // Maximum intensity
            false,
            true // Is abuse
          );
        }
      }
    }
    
    return null;
  }
  
  /**
   * Check blocked categories (dangerous/inappropriate content)
   */
  private static checkBlockedCategories(
    messageLower: string,
    matchedPatterns: string[]
  ): EnhancedClassificationResult | null {
    const patterns: Record<BlockedCategory, RegExp[]> = {
      [BlockedCategory.SEXUAL_CONTENT]: [
        /how (do i|to) (have )?sex/i,
        /show me.*sexual/i,
        /(sexual|sex) positions?/i,
        /how to.*virginity/i,
        /(porn|pornography|xxx)/i,
        /explicit.*content/i
      ],
      [BlockedCategory.EXPLICIT_DATING_ADVICE]: [
        /how to.*(seduce|make out with)/i,
        /sexual.*relationship/i
      ],
      [BlockedCategory.ADULT_RELATIONSHIPS]: [
        /marriage (advice|counseling)/i,
        /divorce advice/i
      ],
      [BlockedCategory.SELF_HARM_INSTRUCTIONS]: [
        /how to (cut|harm|hurt) myself/i,
        /best way to cut/i,
        /where to cut/i,
        /self[- ]harm (methods?|techniques?|ways?)/i
      ],
      [BlockedCategory.SUICIDE_METHODS]: [
        /how to (kill myself|commit suicide|end my life)/i,
        /(best|easiest|painless) way to (die|kill myself)/i,
        /suicide methods?/i,
        /how (much|many).*(pills?|overdose)/i
      ],
      [BlockedCategory.DRUG_INSTRUCTIONS]: [
        /how to (use|take|do|smoke) (drugs?|weed|marijuana|cocaine|heroin|meth)/i,
        /drug (instructions?|usage)/i,
        /get high/i
      ],
      [BlockedCategory.DRUG_PROCUREMENT]: [
        /where (to|can i) (buy|get|find|obtain) (drugs?|weed|marijuana|cocaine)/i,
        /dealer|drug dealer/i
      ],
      [BlockedCategory.WEAPONS]: [
        /how to (make|build|get|buy) (a )?(gun|weapon|bomb|explosive)/i,
        /where to buy (gun|weapon|knife)/i
      ],
      [BlockedCategory.VIOLENCE_INSTRUCTIONS]: [
        /how to (hurt|kill|harm|attack) (someone|people)/i,
        /best way to (fight|hurt) someone/i
      ],
      [BlockedCategory.HACKING]: [
        /how to hack/i,
        /hacking (tutorial|guide)/i,
        /break into (account|system)/i
      ],
      [BlockedCategory.CHEATING_SYSTEMS]: [
        /how to cheat (on|in) (exam|test)/i,
        /cheat codes?/i,
        /exam answers?/i
      ],
      [BlockedCategory.STEALING]: [
        /how to (steal|shoplift)/i,
        /stealing (guide|tutorial)/i
      ],
      [BlockedCategory.CRIME]: [
        /how to commit/i,
        /get away with/i,
        /illegal activity/i
      ],
      [BlockedCategory.POLITICAL_DEBATES]: [
        /(discuss|debate|argue about|talk about).*(politics|political|election|government)/i,
        /what do you think about.*(president|minister|political)/i
      ],
      [BlockedCategory.RELIGIOUS_DEBATES]: [
        /(discuss|debate|argue about).*(religion|god|islam|christianity|hinduism|buddhism)/i,
        /which religion is (best|right|true)/i
      ],
      [BlockedCategory.GAMBLING]: [
        /how to gamble/i,
        /betting (tips?|advice)/i,
        /online gambling/i
      ]
    };
    
    for (const [category, regexList] of Object.entries(patterns)) {
      for (const regex of regexList) {
        if (regex.test(messageLower)) {
          matchedPatterns.push(regex.source);
          
          return this.buildResult(
            category as BlockedCategory,
            false, // NOT in scope - blocked
            100,
            UserIntent.UNKNOWN,
            false,
            matchedPatterns,
            `Blocked content detected: ${category} - inappropriate for students`,
            false,
            false,
            false,
            0,
            true // Is blocked
          );
        }
      }
    }
    
    return null;
  }
  
  /**
   * Check special categories (security threats)
   */
  private static checkSpecialCategories(
    message: string,
    conversationHistory?: string[]
  ): EnhancedClassificationResult | null {
    const matchedPatterns: string[] = [];
    
    // Prompt injection
    const promptInjectionPatterns = [
      /ignore (previous|all|above|prior) (instructions?|prompts?|rules?)/i,
      /forget (everything|all|what|previous)/i,
      /new (instructions?|prompts?|rules?):/i,
      /system:?\s*you are/i,
      /pretend (you're|you are|to be)/i,
      /act as (if|though)/i,
      /roleplays? as/i
    ];
    
    for (const pattern of promptInjectionPatterns) {
      if (pattern.test(message)) {
        matchedPatterns.push(pattern.source);
        return this.buildResult(
          SpecialCategory.PROMPT_INJECTION,
          false, // Reject
          100,
          UserIntent.TESTING,
          false,
          matchedPatterns,
          'Prompt injection attempt detected',
          false,
          false,
          true
        );
      }
    }
    
    // Jailbreak attempt (rapid topic switching)
    if (conversationHistory && conversationHistory.length >= 5) {
      const recentTopics = this.detectTopicSwitching(conversationHistory.slice(-5));
      if (recentTopics >= 3) {
        return this.buildResult(
          SpecialCategory.JAILBREAK_ATTEMPT,
          false, // Reject
          95,
          UserIntent.TESTING,
          false,
          ['rapid_topic_switching'],
          'Jailbreak attempt detected (3+ rapid topic switches)',
          false,
          true,
          false
        );
      }
    }
    
    return null;
  }
  
  /**
   * Check mental health categories
   */
  private static checkMentalHealthCategories(
    messageLower: string,
    matchedPatterns: string[]
  ): EnhancedClassificationResult | null {
    const patterns: Record<MentalHealthCategory, RegExp[]> = {
      [MentalHealthCategory.CRISIS]: [
        // Imminent crisis (happening NOW) - highest priority
        /(jumping|going to jump) from/i,
        /standing on the edge/i,
        /(about to|going to) (do it|end it)/i,
        /(this is )?goodbye.*(forever|world)/i,
        /ending it (now|right now|today)/i,
        /(have|got) (the )?(pills?|gun|knife|rope|means)/i,
        /im at .*(ready to|about to) (jump|do it)/i,
        
        // Active self-harm intent (ignore emotional context)
        /(want to|going to|need to|plan to) cut (myself|my)/i,
        /(want to|going to|need to) (hurt|harm|burn|hit) myself/i,
        /cutting myself (now|right now)/i,
        
        // Suicidal ideation
        /want to (die|kill myself|end my life)/i,
        /suicide|suicidal/i,
        /better off dead/i,
        /can't go on|don't want to live/i,
        /no reason to (live|be here)/i
      ],
      [MentalHealthCategory.DEPRESSION_INDICATORS]: [
        /depressed|depression/i,
        /hopeless|worthless/i,
        /nothing matters|no point/i,
        /can't feel anything|numb/i,
        /lost interest in everything/i
      ],
      [MentalHealthCategory.ANXIETY]: [
        /anxious|anxiety|worried|panic|nervous/i,
        /can't stop worrying|racing thoughts/i,
        /panic attack/i
      ],
      [MentalHealthCategory.STRESS]: [
        /stressed|stress|pressure|overwhelmed/i,
        /too much|can't handle|breaking down/i
      ],
      [MentalHealthCategory.LONELINESS]: [
        /lonely|alone|isolated|nobody/i,
        /no (one|friends|body) (cares|understands)/i
      ],
      [MentalHealthCategory.SELF_ESTEEM]: [
        /not good enough|worthless|failure/i,
        /hate myself|bad person/i,
        /confidence|self-esteem/i
      ],
      [MentalHealthCategory.BURNOUT]: [
        /burnout|burnt out|exhausted/i,
        /can't do (this|it) anymore/i
      ],
      [MentalHealthCategory.ACADEMIC_STRESS]: [
        /(failed|failing) (exam|test|grade)/i,
        /stressed about (exam|test|school|grades)/i,
        /(exam|test) anxiety/i
      ],
      [MentalHealthCategory.FAMILY_ISSUES]: [
        /(fight|arguing|conflict) with (parents?|mom|dad|family)/i,
        /(parents?|mom|dad|family) (don't understand|comparing me)/i
      ],
      [MentalHealthCategory.FRIENDSHIP_ISSUES]: [
        /(fight|argument) with friend/i,
        /friend (betrayed|abandoned|ignored) me/i,
        /losing friends/i
      ],
      [MentalHealthCategory.RELATIONSHIPS]: [
        /relationship (problems?|issues?)/i,
        /breakup|broke up/i,
        /(boyfriend|girlfriend) (left|cheated)/i
      ],
      [MentalHealthCategory.GRIEF]: [
        /grief|grieving|mourning/i,
        /(died|passed away|lost)/i
      ],
      [MentalHealthCategory.MOTIVATION]: [
        /no motivation|can't motivate/i,
        /don't feel like doing anything/i
      ],
      [MentalHealthCategory.COPING]: [
        /how (do i|to) (cope|deal|handle)/i,
        /coping (with|strategies)/i
      ],
      [MentalHealthCategory.REFLECTION]: [
        /why do i (feel|react|act)/i,
        /understand myself|know myself/i,
        /what's wrong with me/i
      ],
      [MentalHealthCategory.EMOTIONAL_SUPPORT]: [
        /need (someone|support|help)/i,
        /can you (help|listen)/i
      ],
      [MentalHealthCategory.MENTAL_HEALTH]: [
        /mental health|therapy|counseling/i
      ],
      [MentalHealthCategory.WORK_STRESS]: [
        /work stress|stressed at work/i,
        /job pressure/i
      ],
      [MentalHealthCategory.LIFE_TRANSITIONS]: [
        /moving to|starting (college|university|new job)/i,
        /big change|life transition/i
      ]
    };
    
    for (const [category, regexList] of Object.entries(patterns)) {
      for (const regex of regexList) {
        if (regex.test(messageLower)) {
          matchedPatterns.push(regex.source);
          
          // Determine intent and intensity
          const isCrisis = category === MentalHealthCategory.CRISIS;
          const intent = isCrisis ? UserIntent.CRISIS :
                        category === MentalHealthCategory.REFLECTION ? UserIntent.REFLECTION :
                        category === MentalHealthCategory.COPING ? UserIntent.COPING :
                        UserIntent.EMOTIONAL_SUPPORT;
          
          const intensity = this.detectEmotionalIntensity(messageLower);
          
          return this.buildResult(
            category as MentalHealthCategory,
            true, // In scope
            95,
            intent,
            true, // Has emotional connection
            matchedPatterns,
            `Mental health content detected: ${category}`,
            isCrisis,
            false,
            false,
            intensity
          );
        }
      }
    }
    
    return null;
  }
  
  /**
   * Check utility categories
   */
  private static checkUtilityCategories(
    messageLower: string,
    matchedPatterns: string[]
  ): EnhancedClassificationResult | null {
    const patterns: Record<UtilityCategory, RegExp[]> = {
      [UtilityCategory.GREETING]: [
        /^(hi|hello|hey|hiya|sup|yo)$/i,
        /^good (morning|afternoon|evening)$/i
      ],
      [UtilityCategory.MEMORY_TESTING]: [
        /what('?s| is) my name/i,
        /do you (know|remember) my name/i,
        /tell me my name/i
      ],
      [UtilityCategory.CONVERSATION_RECALL]: [
        /what (did we|were we) (discuss|talk about)/i,
        /what (have we|we've) talked about/i,
        /earlier conversation|previous (discussion|conversation)/i
      ],
      [UtilityCategory.BOT_CAPABILITIES]: [
        /what can you (do|help with)/i,
        /how (do you|can you) help/i,
        /who are you|what are you/i
      ],
      [UtilityCategory.FEEDBACK]: [
        /you('?re| are) (helpful|great|amazing|good)/i,
        /thank you|thanks/i
      ],
      [UtilityCategory.SMALL_TALK]: [
        /^(okay|ok|yes|yeah|yea|yep|nope|no)$/i,
        /^(hmm|hmmm|uh|umm)$/i
      ]
    };
    
    for (const [category, regexList] of Object.entries(patterns)) {
      for (const regex of regexList) {
        if (regex.test(messageLower)) {
          matchedPatterns.push(regex.source);
          
          const intent = category === UtilityCategory.MEMORY_TESTING ? UserIntent.MEMORY_RECALL :
                        category === UtilityCategory.CONVERSATION_RECALL ? UserIntent.MEMORY_RECALL :
                        UserIntent.SMALL_TALK;
          
          return this.buildResult(
            category as UtilityCategory,
            true, // In scope
            100,
            intent,
            false,
            matchedPatterns,
            `Utility conversation: ${category}`
          );
        }
      }
    }
    
    return null;
  }
  
  /**
   * Check out-of-scope categories
   */
  private static checkOutOfScopeCategories(
    messageLower: string,
    matchedPatterns: string[]
  ): EnhancedClassificationResult | null {
    const patterns: Record<OutOfScopeCategory, RegExp[]> = {
      // Entertainment
      [OutOfScopeCategory.MOVIES]: [
        /movie|film|cinema/i,
        /recommend.*movie|suggest.*movie/i,
        /favorite movie|best movie/i,
        /shah rukh|srk|deepika|ranveer|priyanka|amitabh|bachchan/i, // Bollywood actors
        /name.*actor|tell.*about.*actor|discuss.*(them|actor|movie)/i,
        /hollywood|bollywood/i
      ],
      [OutOfScopeCategory.TV_SHOWS]: [
        /tv show|series|netflix|streaming/i,
        /watched.*show|watching.*series/i
      ],
      [OutOfScopeCategory.CELEBRITIES]: [
        /tell me about (will smith|any actor|celebrity)/i,
        /famous actor|celebrity|star/i,
        /who is your favorite (actor|actress)/i,
        /discuss.*(actor|actress|celebrity|star)/i,
        /lets? (talk|discuss) about (actor|actress|celebrity|movie|film)/i
      ],
      [OutOfScopeCategory.MUSIC]: [
        /music|song|album|artist|band/i,
        /favorite (song|music|band)/i
      ],
      [OutOfScopeCategory.SPORTS]: [
        /sport|game|match|tournament/i,
        /football|cricket|basketball/i
      ],
      [OutOfScopeCategory.GAMING]: [
        /video game|gaming|esports/i,
        /play.*game/i
      ],
      [OutOfScopeCategory.ANIME]: [
        /anime|manga/i
      ],
      [OutOfScopeCategory.COMICS]: [
        /comic|marvel|dc comics/i
      ],
      
      // Food
      [OutOfScopeCategory.RECIPES]: [
        /recipe|cooking instructions/i,
        /(how to|give me|teach me|show me).*(make|cook|bake|prepare)/i,
        /recipe (of|for) (the )?/i,
        /taco|curry|pasta|pizza|dish|meal preparation/i
      ],
      [OutOfScopeCategory.COOKING]: [
        /cook|bake|fry|boil|simmer/i
      ],
      [OutOfScopeCategory.FOOD]: [
        /lets? (talk|discuss|chat) about (fruits?|vegetables?|veggies?|food)/i,
        /favorite (fruit|veggie|vegetables?|food)/i,
        /tell me about (fruits?|vegetables?|veggies?)/i,
        /what.*eat.*(fruits?|vegetables?)/i,
        /name some (fruits?|vegetables?)/i,
        /food item|unique food/i,
        /(throwing|planning).*party.*food/i
      ],
      [OutOfScopeCategory.NUTRITION]: [
        /nutrition|vitamins|diet plan/i,
        /what.*good for health/i
      ],
      
      // Fashion & Appearance (NEW CATEGORY)
      [OutOfScopeCategory.FASHION_APPEARANCE]: [
        /what.*(wear|dress|outfit|clothing)/i,
        /which (dress|outfit|clothes)/i,
        /fashion|style/i,
        /event.*(dress|wear|outfit)/i,
        /what should i wear/i,
        /help me (choose|pick).*dress/i
      ],
      
      // Technical
      [OutOfScopeCategory.CODING]: [
        /write.*code|program|function/i,
        /javascript|python|react|html/i
      ],
      [OutOfScopeCategory.PROGRAMMING]: [
        /programming|software development/i
      ],
      [OutOfScopeCategory.DEBUGGING]: [
        /debug|fix.*bug|error/i
      ],
      [OutOfScopeCategory.SOFTWARE_ENGINEERING]: [
        /software engineering|system design/i
      ],
      
      // Academic
      [OutOfScopeCategory.HOMEWORK]: [
        /help.*homework|solve.*assignment/i,
        /answer.*question|do my homework/i
      ],
      [OutOfScopeCategory.ASSIGNMENTS]: [
        /assignment|project help/i
      ],
      [OutOfScopeCategory.MATHEMATICS]: [
        /solve.*math|calculate|equation/i
      ],
      [OutOfScopeCategory.SCIENCE_HELP]: [
        /explain.*(photosynthesis|physics|chemistry)/i
      ],
      
      // General info
      [OutOfScopeCategory.POLITICS]: [
        /politics|government|election/i,
        /(president|minister|prime minister)/i
      ],
      [OutOfScopeCategory.GOVERNMENT]: [
        /government policy/i
      ],
      [OutOfScopeCategory.ELECTIONS]: [
        /election|voting|candidate/i
      ],
      [OutOfScopeCategory.HISTORY]: [
        /history of|historical/i
      ],
      [OutOfScopeCategory.GEOGRAPHY]: [
        /capital of|geography|located in/i
      ],
      [OutOfScopeCategory.GENERAL_KNOWLEDGE]: [
        /who is|what is|tell me about/i,
        /what do you think about/i
      ],
      
      // Commercial
      [OutOfScopeCategory.SHOPPING]: [
        /shopping|buy|purchase/i
      ],
      [OutOfScopeCategory.PRODUCTS]: [
        /recommend.*product/i
      ],
      [OutOfScopeCategory.TRAVEL]: [
        /travel|vacation|trip/i
      ],
      [OutOfScopeCategory.TOURISM]: [
        /tourist|sightseeing/i
      ],
      [OutOfScopeCategory.FINANCE]: [
        /invest|stocks|trading/i
      ],
      [OutOfScopeCategory.INVESTING]: [
        /investment advice/i
      ],
      [OutOfScopeCategory.CRYPTO]: [
        /cryptocurrency|bitcoin/i
      ],
      
      // Professional advice
      [OutOfScopeCategory.MEDICAL_ADVICE]: [
        /medical advice|diagnose|prescribe/i,
        /what medicine|drug/i
      ],
      [OutOfScopeCategory.LEGAL_ADVICE]: [
        /legal advice|lawsuit|contract/i
      ],
      [OutOfScopeCategory.CAREER_ADVICE]: [
        /what (career|job) should i (choose|pick)/i,
        /become a (doctor|engineer|lawyer)/i,
        /career path|career choice/i
      ]
    };
    
    for (const [category, regexList] of Object.entries(patterns)) {
      for (const regex of regexList) {
        if (regex.test(messageLower)) {
          matchedPatterns.push(regex.source);
          
          // Check if there's emotional context
          const hasEmotionalContext = this.detectEmotionalConnection(messageLower);
          
          if (hasEmotionalContext) {
            // Allow with emotional context
            return this.buildResult(
              MentalHealthCategory.EMOTIONAL_SUPPORT,
              true,
              85,
              UserIntent.EMOTIONAL_SUPPORT,
              true,
              matchedPatterns,
              `${category} topic but with emotional context - allowing`
            );
          }
          
          // Reject without emotional context
          return this.buildResult(
            category as OutOfScopeCategory,
            false, // Out of scope
            95,
            UserIntent.INFORMATION_REQUEST,
            false,
            matchedPatterns,
            `Out of scope: ${category}`
          );
        }
      }
    }
    
    return null;
  }
  
  /**
   * Detect emotional connection in message
   */
  private static detectEmotionalConnection(message: string): boolean {
    const emotionalConnectors = [
      /stressed about/i,
      /anxious about/i,
      /worried about/i,
      /scared about/i,
      /frustrated with/i,
      /overwhelmed by/i,
      /nervous about/i,
      /feeling.*because/i,
      /makes me feel/i,
      /struggling with/i,
      /can't handle/i,
      /difficult for me/i,
      /hard for me/i
    ];
    
    return emotionalConnectors.some(pattern => pattern.test(message));
  }
  
  /**
   * Detect emotional intensity (0-10)
   */
  private static detectEmotionalIntensity(message: string): number {
    let intensity = 5; // Base
    
    // High intensity words
    if (/extremely|completely|totally|absolutely|can't.*anymore/i.test(message)) intensity += 3;
    if (/very|really|so|such/i.test(message)) intensity += 2;
    if (/always|never|nobody|nothing/i.test(message)) intensity += 2;
    if (/!{2,}/.test(message)) intensity += 1; // Multiple exclamation marks
    
    // Crisis indicators
    if (/die|kill|suicide|end.*life/i.test(message)) intensity = 10;
    
    return Math.min(intensity, 10);
  }
  
  /**
   * Detect rapid topic switching (jailbreak indicator)
   */
  private static detectTopicSwitching(recentMessages: string[]): number {
    const topics = new Set<string>();
    
    const topicPatterns = {
      'recipe': /recipe|cook|food/i,
      'movie': /movie|film|actor/i,
      'coding': /code|program/i,
      'politics': /politics|government/i,
      'homework': /homework|assignment/i,
      'sports': /sport|game|match/i,
      'shopping': /shop|buy|purchase/i
    };
    
    for (const msg of recentMessages) {
      for (const [topic, pattern] of Object.entries(topicPatterns)) {
        if (pattern.test(msg)) {
          topics.add(topic);
        }
      }
    }
    
    return topics.size;
  }
  
  /**
   * Build classification result
   */
  private static buildResult(
    category: Category,
    inScope: boolean,
    confidence: number,
    intent: UserIntent,
    emotionalConnection: boolean,
    matchedPatterns: string[],
    reason: string,
    requiresImmediateAttention: boolean = false,
    isJailbreakAttempt: boolean = false,
    isPromptInjection: boolean = false,
    emotionalIntensity?: number,
    isBlocked: boolean = false,
    isAbuse: boolean = false
  ): EnhancedClassificationResult {
    return {
      category,
      categoryType: CategoryHelpers.getCategoryType(category),
      inScope,
      confidence,
      intent,
      emotionalConnection,
      emotionalIntensity,
      matchedPatterns,
      reason,
      requiresImmediateAttention,
      isJailbreakAttempt,
      isPromptInjection,
      isBlocked,
      isAbuse
    };
  }
}
