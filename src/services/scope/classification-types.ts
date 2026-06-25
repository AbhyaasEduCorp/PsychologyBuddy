/**
 * Classification Types for Message Categorization
 * 
 * Comprehensive category system for precise message classification
 * Enables granular scope control and intent understanding
 */

// ============================================
// MENTAL HEALTH RELATED (IN SCOPE)
// ============================================
export enum MentalHealthCategory {
  MENTAL_HEALTH = 'MENTAL_HEALTH',
  EMOTIONAL_SUPPORT = 'EMOTIONAL_SUPPORT',
  STRESS = 'STRESS',
  ANXIETY = 'ANXIETY',
  DEPRESSION_INDICATORS = 'DEPRESSION_INDICATORS',
  SELF_ESTEEM = 'SELF_ESTEEM',
  LONELINESS = 'LONELINESS',
  BURNOUT = 'BURNOUT',
  MOTIVATION = 'MOTIVATION',
  RELATIONSHIPS = 'RELATIONSHIPS',
  FRIENDSHIP_ISSUES = 'FRIENDSHIP_ISSUES',
  FAMILY_ISSUES = 'FAMILY_ISSUES',
  ACADEMIC_STRESS = 'ACADEMIC_STRESS',
  WORK_STRESS = 'WORK_STRESS',
  GRIEF = 'GRIEF',
  LIFE_TRANSITIONS = 'LIFE_TRANSITIONS',
  COPING = 'COPING',
  REFLECTION = 'REFLECTION',
  CRISIS = 'CRISIS'
}

// ============================================
// ALLOWED UTILITY (IN SCOPE)
// ============================================
export enum UtilityCategory {
  GREETING = 'GREETING',
  SMALL_TALK = 'SMALL_TALK',
  MEMORY_TESTING = 'MEMORY_TESTING',
  CONVERSATION_RECALL = 'CONVERSATION_RECALL',
  FEEDBACK = 'FEEDBACK',
  BOT_CAPABILITIES = 'BOT_CAPABILITIES'
}

// ============================================
// OUT OF SCOPE
// ============================================
export enum OutOfScopeCategory {
  // Entertainment
  MOVIES = 'MOVIES',
  TV_SHOWS = 'TV_SHOWS',
  CELEBRITIES = 'CELEBRITIES',
  MUSIC = 'MUSIC',
  SPORTS = 'SPORTS',
  GAMING = 'GAMING',
  ANIME = 'ANIME',
  COMICS = 'COMICS',
  
  // Food & Cooking
  RECIPES = 'RECIPES',
  COOKING = 'COOKING',
  FOOD = 'FOOD',
  NUTRITION = 'NUTRITION',
  
  // Fashion & Appearance
  FASHION_APPEARANCE = 'FASHION_APPEARANCE',
  
  // Technical
  CODING = 'CODING',
  PROGRAMMING = 'PROGRAMMING',
  DEBUGGING = 'DEBUGGING',
  SOFTWARE_ENGINEERING = 'SOFTWARE_ENGINEERING',
  
  // Academic Help
  HOMEWORK = 'HOMEWORK',
  ASSIGNMENTS = 'ASSIGNMENTS',
  MATHEMATICS = 'MATHEMATICS',
  SCIENCE_HELP = 'SCIENCE_HELP',
  
  // General Information
  POLITICS = 'POLITICS',
  GOVERNMENT = 'GOVERNMENT',
  ELECTIONS = 'ELECTIONS',
  HISTORY = 'HISTORY',
  GEOGRAPHY = 'GEOGRAPHY',
  GENERAL_KNOWLEDGE = 'GENERAL_KNOWLEDGE',
  
  // Commercial
  SHOPPING = 'SHOPPING',
  PRODUCTS = 'PRODUCTS',
  TRAVEL = 'TRAVEL',
  TOURISM = 'TOURISM',
  FINANCE = 'FINANCE',
  INVESTING = 'INVESTING',
  CRYPTO = 'CRYPTO',
  
  // Professional Advice
  MEDICAL_ADVICE = 'MEDICAL_ADVICE',
  LEGAL_ADVICE = 'LEGAL_ADVICE',
  CAREER_ADVICE = 'CAREER_ADVICE'
}

// ============================================
// BLOCKED CATEGORIES (STUDENT SAFETY)
// ============================================
export enum BlockedCategory {
  // Explicit/Inappropriate Content
  SEXUAL_CONTENT = 'SEXUAL_CONTENT',
  EXPLICIT_DATING_ADVICE = 'EXPLICIT_DATING_ADVICE',
  ADULT_RELATIONSHIPS = 'ADULT_RELATIONSHIPS',
  
  // Dangerous Content
  SELF_HARM_INSTRUCTIONS = 'SELF_HARM_INSTRUCTIONS',
  SUICIDE_METHODS = 'SUICIDE_METHODS',
  DRUG_INSTRUCTIONS = 'DRUG_INSTRUCTIONS',
  DRUG_PROCUREMENT = 'DRUG_PROCUREMENT',
  WEAPONS = 'WEAPONS',
  VIOLENCE_INSTRUCTIONS = 'VIOLENCE_INSTRUCTIONS',
  
  // Criminal Activity
  HACKING = 'HACKING',
  CHEATING_SYSTEMS = 'CHEATING_SYSTEMS',
  STEALING = 'STEALING',
  CRIME = 'CRIME',
  
  // Controversial Topics (for students)
  POLITICAL_DEBATES = 'POLITICAL_DEBATES',
  RELIGIOUS_DEBATES = 'RELIGIOUS_DEBATES',
  GAMBLING = 'GAMBLING'
}

// ============================================
// ABUSE DETECTION (STUDENT SAFETY)
// ============================================
export enum AbuseCategory {
  PHYSICAL_ABUSE = 'PHYSICAL_ABUSE',
  SEXUAL_ABUSE = 'SEXUAL_ABUSE',
  EMOTIONAL_ABUSE = 'EMOTIONAL_ABUSE',
  NEGLECT = 'NEGLECT',
  SEVERE_BULLYING = 'SEVERE_BULLYING'
}

// ============================================
// SPECIAL CATEGORIES
// ============================================
export enum SpecialCategory {
  PROMPT_INJECTION = 'PROMPT_INJECTION',
  ROLEPLAY_ESCAPE = 'ROLEPLAY_ESCAPE',
  BOUNDARY_TESTING = 'BOUNDARY_TESTING',
  JAILBREAK_ATTEMPT = 'JAILBREAK_ATTEMPT'
}

// ============================================
// INPUT QUALITY
// ============================================
export enum InputQualityCategory {
  GIBBERISH = 'GIBBERISH',
  REPEATED_CHARACTERS = 'REPEATED_CHARACTERS',
  EMOJI_ONLY = 'EMOJI_ONLY',
  EMPTY_MESSAGE = 'EMPTY_MESSAGE',
  UNKNOWN = 'UNKNOWN'
}

// ============================================
// USER INTENT
// ============================================
export enum UserIntent {
  EMOTIONAL_SUPPORT = 'emotional_support',
  REFLECTION = 'reflection',
  VENTING = 'venting',
  COPING = 'coping',
  MEMORY_RECALL = 'memory_recall',
  SMALL_TALK = 'small_talk',
  INFORMATION_REQUEST = 'information_request',
  TECHNICAL_HELP = 'technical_help',
  TESTING = 'testing',
  CRISIS = 'crisis',
  UNKNOWN = 'unknown'
}

// ============================================
// UNIFIED CATEGORY TYPE
// ============================================
export type Category = 
  | MentalHealthCategory 
  | UtilityCategory 
  | OutOfScopeCategory 
  | SpecialCategory 
  | InputQualityCategory
  | BlockedCategory
  | AbuseCategory;

// ============================================
// CLASSIFICATION RESULT
// ============================================
export interface EnhancedClassificationResult {
  // Primary classification
  category: Category;
  categoryType: 'mental_health' | 'utility' | 'out_of_scope' | 'special' | 'input_quality' | 'blocked' | 'abuse';
  
  // Scope decision
  inScope: boolean;
  confidence: number; // 0-100
  
  // User intent
  intent: UserIntent;
  
  // Context
  emotionalConnection: boolean;
  emotionalIntensity?: number; // 0-10
  
  // Pattern details
  matchedPatterns: string[];
  reason: string;
  
  // Special flags
  requiresImmediateAttention?: boolean; // For crisis
  isJailbreakAttempt?: boolean;
  isPromptInjection?: boolean;
  isBlocked?: boolean; // For dangerous/inappropriate content
  isAbuse?: boolean; // For abuse indicators
}

// ============================================
// CATEGORY HELPERS
// ============================================
export class CategoryHelpers {
  static isMentalHealth(category: Category): boolean {
    return Object.values(MentalHealthCategory).includes(category as MentalHealthCategory);
  }
  
  static isUtility(category: Category): boolean {
    return Object.values(UtilityCategory).includes(category as UtilityCategory);
  }
  
  static isOutOfScope(category: Category): boolean {
    return Object.values(OutOfScopeCategory).includes(category as OutOfScopeCategory);
  }
  
  static isSpecial(category: Category): boolean {
    return Object.values(SpecialCategory).includes(category as SpecialCategory);
  }
  
  static isInputQuality(category: Category): boolean {
    return Object.values(InputQualityCategory).includes(category as InputQualityCategory);
  }
  
  static isBlocked(category: Category): boolean {
    return Object.values(BlockedCategory).includes(category as BlockedCategory);
  }
  
  static isAbuse(category: Category): boolean {
    return Object.values(AbuseCategory).includes(category as AbuseCategory);
  }
  
  static getCategoryType(category: Category): 'mental_health' | 'utility' | 'out_of_scope' | 'special' | 'input_quality' | 'blocked' | 'abuse' {
    if (this.isMentalHealth(category)) return 'mental_health';
    if (this.isUtility(category)) return 'utility';
    if (this.isOutOfScope(category)) return 'out_of_scope';
    if (this.isSpecial(category)) return 'special';
    if (this.isInputQuality(category)) return 'input_quality';
    if (this.isBlocked(category)) return 'blocked';
    if (this.isAbuse(category)) return 'abuse';
    return 'input_quality'; // Default
  }
  
  static isInScope(category: Category): boolean {
    return this.isMentalHealth(category) || this.isUtility(category);
  }
  
  static requiresRedirect(category: Category): boolean {
    return this.isOutOfScope(category) || this.isSpecial(category);
  }
  
  static requiresBlock(category: Category): boolean {
    return this.isBlocked(category);
  }
  
  static requiresEmergencyResponse(category: Category): boolean {
    return this.isAbuse(category) || 
           (this.isMentalHealth(category) && category === MentalHealthCategory.CRISIS);
  }
}
