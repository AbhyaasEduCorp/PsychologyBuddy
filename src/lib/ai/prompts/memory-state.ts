/**
 * Memory State Types and Management
 * 
 * Provides structured conversation state that persists across messages
 * to enable contextual awareness and risk tracking.
 */

export type RiskLevel = 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'IMMINENT';
export type EmotionalTrend = 'improving' | 'stable' | 'declining' | 'unknown';
export type UserNeedPattern = 'venting' | 'validation' | 'advice' | 'problem-solving' | 'unknown';

export interface MoodEntry {
  mood: string;
  timestamp: string;
  intensity?: 'mild' | 'moderate' | 'high' | 'severe';
}

export interface CrisisIndicator {
  statement: string;
  timestamp: string;
  severity: 'self-harm' | 'suicidal-ideation' | 'imminent-crisis' | 'depression';
  resolved: boolean;
}

export interface ConversationState {
  // Risk Tracking
  riskLevel: RiskLevel;
  lastRiskAssessment: string | null;
  crisisIndicators: CrisisIndicator[];
  requiresCrisisFollowUp: boolean;
  
  // Emotional Tracking
  currentMood: string;
  previousMood: string;
  emotionalTrend: EmotionalTrend;
  moodHistory: MoodEntry[];
  
  // Conversation Tracking
  recentTopics: string[];
  conversationSummary: string;
  userNeedsPattern: UserNeedPattern;
  
  // Session Metadata
  messageCount: number;
  lastMessageTime: string;
  sessionStartTime: string;
  
  // Behavior Tracking
  testModeDetected: boolean;
  reassuranceLoopCount: number;
  lastQuestionType: string | null;
  
  // Age/Minor Tracking
  isMinor?: boolean;
  minorAge?: number;
  
  // Active Concerns (influences quick replies, summaries, context recall)
  activeConcerns: string[];
  
  // Violence Risk Tracking (escalation across conversation)
  violenceRisk: 'none' | 'low' | 'moderate' | 'high';
  violenceMentioned: boolean;
}

export interface RiskRecoveryCheck {
  hasUnresolvedCrisis: boolean;
  crisisStatements: string[];
  requiresFollowUp: boolean;
  followUpMessage: string | null;
  allowTopicChange: boolean;
}

export interface CrisisResources {
  country: string;
  emergency: string;
  mentalHealthHotline: string[];
  textLine: string | null;
  additionalResources: string[];
}

/**
 * Default crisis resources by country
 */
export const CRISIS_RESOURCES_BY_COUNTRY: Record<string, CrisisResources> = {
  IN: {
    country: 'India',
    emergency: '112',
    mentalHealthHotline: [
      'Tele-MANAS: 14416 or 1-800-891-4416',
      'iCall: 9152987821',
    ],
    textLine: null,
    additionalResources: [
      'Vandrevala Foundation: 1860-2662-345',
      'AASRA: 91-22-27546669',
    ],
  },
  US: {
    country: 'United States',
    emergency: '911',
    mentalHealthHotline: [
      '988 Suicide & Crisis Lifeline',
    ],
    textLine: 'Text HOME to 741741',
    additionalResources: [
      'Trevor Project (LGBTQ+): 1-866-488-7386',
    ],
  },
  DEFAULT: {
    country: 'International',
    emergency: 'Local emergency services',
    mentalHealthHotline: [
      'International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/',
    ],
    textLine: null,
    additionalResources: [],
  },
};

/**
 * Initialize a new conversation state
 */
export function createInitialConversationState(): ConversationState {
  return {
    riskLevel: 'NONE',
    lastRiskAssessment: null,
    crisisIndicators: [],
    requiresCrisisFollowUp: false,
    
    currentMood: 'unknown',
    previousMood: 'unknown',
    emotionalTrend: 'unknown',
    moodHistory: [],
    
    recentTopics: [],
    conversationSummary: '',
    userNeedsPattern: 'unknown',
    
    messageCount: 0,
    lastMessageTime: new Date().toISOString(),
    sessionStartTime: new Date().toISOString(),
    
    testModeDetected: false,
    reassuranceLoopCount: 0,
    lastQuestionType: null,
    activeConcerns: [],
    violenceRisk: 'none',
    violenceMentioned: false,
  };
}

/**
 * Check if crisis recovery is needed
 */
export function checkRiskRecovery(state: ConversationState): RiskRecoveryCheck {
  const unresolvedCrisis = state.crisisIndicators.filter(c => !c.resolved);
  
  if (unresolvedCrisis.length === 0) {
    return {
      hasUnresolvedCrisis: false,
      crisisStatements: [],
      requiresFollowUp: false,
      followUpMessage: null,
      allowTopicChange: true,
    };
  }
  
  // Get the most recent unresolved crisis
  const latestCrisis = unresolvedCrisis[unresolvedCrisis.length - 1];
  const timeSince = Date.now() - new Date(latestCrisis.timestamp).getTime();
  const minutesSince = timeSince / (1000 * 60);
  
  // If crisis was mentioned in last 30 minutes and not resolved
  if (minutesSince < 30) {
    return {
      hasUnresolvedCrisis: true,
      crisisStatements: unresolvedCrisis.map(c => c.statement),
      requiresFollowUp: true,
      followUpMessage: generateCrisisFollowUpMessage(latestCrisis),
      allowTopicChange: false,
    };
  }
  
  return {
    hasUnresolvedCrisis: true,
    crisisStatements: unresolvedCrisis.map(c => c.statement),
    requiresFollowUp: false,
    followUpMessage: null,
    allowTopicChange: true,
  };
}

/**
 * Generate appropriate crisis follow-up message
 */
function generateCrisisFollowUpMessage(crisis: CrisisIndicator): string {
  switch (crisis.severity) {
    case 'imminent-crisis':
      return "Before we talk about anything else, I'm still very concerned about your safety. Earlier you mentioned something that worried me deeply. Are you safe right now?";
    
    case 'suicidal-ideation':
      return "I want to check in—earlier you mentioned thoughts about not wanting to be here. That's really serious. How are you feeling about that now?";
    
    case 'self-harm':
      return "Earlier you talked about wanting to hurt yourself. I'm still concerned about that. Are you safe right now?";
    
    case 'depression':
      return "You mentioned feeling depressed earlier. I'm still thinking about that. How are you doing with those feelings?";
    
    default:
      return "Earlier you shared something that concerned me. How are you feeling about that now?";
  }
}

/**
 * Update conversation state with new message
 */
export function updateConversationState(
  state: ConversationState,
  userMessage: string,
  analysis: {
    mood?: string;
    topics?: string[];
    riskLevel?: RiskLevel;
    crisisIndicator?: CrisisIndicator;
    needPattern?: UserNeedPattern;
  }
): ConversationState {
  const updated: ConversationState = {
    ...state,
    messageCount: state.messageCount + 1,
    lastMessageTime: new Date().toISOString(),
  };
  
  // Update mood tracking
  if (analysis.mood) {
    updated.previousMood = state.currentMood;
    updated.currentMood = analysis.mood;
    updated.moodHistory = [
      ...state.moodHistory.slice(-9), // Keep last 10
      { mood: analysis.mood, timestamp: new Date().toISOString() },
    ];
    
    // Update emotional trend
    updated.emotionalTrend = calculateEmotionalTrend(updated.moodHistory);
  }
  
  // Update risk level
  if (analysis.riskLevel) {
    updated.riskLevel = analysis.riskLevel;
    updated.lastRiskAssessment = new Date().toISOString();
  }
  
  // Add crisis indicator
  if (analysis.crisisIndicator) {
    updated.crisisIndicators = [
      ...state.crisisIndicators,
      analysis.crisisIndicator,
    ];
    updated.requiresCrisisFollowUp = true;
  }
  
  // Update topics
  if (analysis.topics && analysis.topics.length > 0) {
    updated.recentTopics = [
      ...analysis.topics,
      ...state.recentTopics,
    ].slice(0, 5); // Keep last 5 topics
  }
  
  // Update user need pattern
  if (analysis.needPattern) {
    updated.userNeedsPattern = analysis.needPattern;
  }
  
  return updated;
}

/**
 * Calculate emotional trend from mood history
 */
function calculateEmotionalTrend(moodHistory: MoodEntry[]): EmotionalTrend {
  if (moodHistory.length < 3) {
    return 'unknown';
  }
  
  const recent = moodHistory.slice(-3);
  const positiveMoods = ['happy', 'content', 'calm', 'relieved', 'hopeful'];
  const negativeMoods = ['sad', 'anxious', 'depressed', 'hopeless', 'overwhelmed', 'angry'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  recent.forEach(entry => {
    const mood = entry.mood.toLowerCase();
    if (positiveMoods.some(p => mood.includes(p))) positiveCount++;
    if (negativeMoods.some(n => mood.includes(n))) negativeCount++;
  });
  
  if (positiveCount > negativeCount) return 'improving';
  if (negativeCount > positiveCount) return 'declining';
  return 'stable';
}

/**
 * Build a ConversationState by scanning conversation history for crisis signals.
 * This enables crisis-awareness to persist across topic changes.
 */
export function buildCrisisStateFromHistory(
  messages: { content: string; senderType: string }[]
): ConversationState {
  const state = createInitialConversationState();

  const SELF_HARM_PATTERNS = [
    /i feel like hurting myself/i,
    /want to (hurt|harm|cut|burn|hit) myself/i,
    /(hurt|harm|cut|burn)ing myself/i,
    /i (cut|hurt|burned|harmed) (my|myself)/i,
    /self.?harm/i,
    /had a (blade|knife|razor)/i,
    /small blade|tiny blade/i,
    /hurting myself/i,
  ];

  const PHYSICAL_INJURY_PATTERNS = [
    /hurt (my|the) (wrist|arm|leg|hand|body)/i,
    /hurt (my|the) (wrist|arm|leg|hand)/i,
    /(it('s| is)|its) (hurting|paining|bleeding)/i,
    /i (cut|burned|hurt) (my|myself)/i,
    /(had|used|have) a (blade|knife|razor|sharp)/i,
    /cut on my/i,
    /i did it.*hurt/i,
  ];

  const SUICIDAL_PATTERNS = [
    /want to (die|kill myself|end my life)/i,
    /suicide|suicidal/i,
    /better off dead|no reason to live/i,
    /don't want to (be here|live|exist)/i,
    /wish i (was|were) dead/i,
    /end it (all|now|tonight)/i,
  ];

  const RISKY_BEHAVIOR_PATTERNS = [
    /jumped (the|a) (campus|school|wall|fence)/i,
    /broke (the|all|some)/i,
    /snuck out|sneak out/i,
    /escape the cctv/i,
    /how to (hide|hide it|escape)/i,
    /beat someone|hurt someone/i,
  ];

  const MINOR_AGE_PATTERNS = [
    /i('m| am) (only |just )?(\d{1,2}) years? old/i,
    /i('m| am) (\d{1,2})(\s|$)/i,
    /my age is (\d{1,2})/i,
    /i('m| am) in (class|grade|std) (\d{1,2}|[ivxlIVXL]{1,5})/i,
    /i('m| am) a (freshman|sophomore|junior|senior|8th|9th|10th|11th|12th) (grader|student)/i,
  ];

  let riskScore = 0;
  let impulsivityScore = 0;
  let selfHarmMentioned = false;
  let physicalInjuryReported = false;
  let suicidalIdeation = false;
  let isMinor: boolean | undefined;
  let minorAge: number | undefined;
  const activeConcernsSet = new Set<string>();
  let violenceRisk: 'none' | 'low' | 'moderate' | 'high' = 'none';
  let violenceMentioned = false;

  const VIOLENCE_PATTERNS = {
    low: [
      /i want to (beat|hit|fight|hurt) (him|her|them|my friend|someone)/i,
      /i'll (beat|hit|fight) (him|her|them)/i,
      /i'm (so )?(angry|mad|furious) at (him|her|them|my friend)/i,
    ],
    moderate: [
      /i will (beat|hit|fight|hurt) (him|her|them|my friend|someone)/i,
      /i'm going to (beat|hit|fight|hurt) (him|her|them)/i,
      /i want to (kill|murder|destroy) (him|her|them|my friend)/i,
    ],
    high: [
      /poison/i,
      /kill (him|her|them|my friend|someone)/i,
      /murder/i,
      /weapon/i,
      /knife/i,
      /gun/i,
      /stab/i,
    ],
  };

  const CONCERN_PATTERNS: Record<string, RegExp> = {
    'homesickness': /miss (my |home|family|mom|dad|parents|sister|brother)|feel (homesick|like going home)|want to go home|hate (hostel|dorm|boarding)/i,
    'loneliness': /feel (so )?alone|feel (so )?lonely|nobody (talks|cares|understands)|no friends|don't have anyone/i,
    'family separation': /away from (home|family)|hostel|boarding school|living (away|alone)/i,
    'exam stress': /exam|test|exams? stress|scared of (exam|test)|failing (exam|test)/i,
    'parental pressure': /parents? (compare|expect|pressure|scold|angry|disappointed)|my (parents?|dad|mom) wants? me to/i,
    'friendship conflict': /fight with (my |a )?(friend|best friend)|best friend (ignored|left|hurt)|falling out with/i,
    'bullying': /bullying|being bullied|making fun of me|teasing|they all laugh/i,
    'self-esteem': /(i am|i'm) (worthless|useless|a failure|not good enough|terrible at everything)/i,
    'anxiety': /anxious|anxiety|panic attack|so (nervous|scared)|heart (racing|beating fast)/i,
    'relationship stress': /(crush|like|feelings for|love) (a |someone|my |this )?(girl|boy|person|classmate|friend)/i,
    'grief': /someone died|passed away|lost (my|a) (grandma|grandpa|parent|friend|relative)/i,
    'physical health': /sick|ill|pain|hurting|hospital|doctor/i,
  };

  for (const msg of messages) {
    if (msg.senderType !== 'STUDENT') continue;
    const content = msg.content;

    if (SUICIDAL_PATTERNS.some(p => p.test(content))) {
      suicidalIdeation = true;
      riskScore += 40;
      state.crisisIndicators.push({
        statement: content.substring(0, 120),
        timestamp: new Date().toISOString(),
        severity: 'suicidal-ideation',
        resolved: false,
      });
    }

    if (PHYSICAL_INJURY_PATTERNS.some(p => p.test(content))) {
      physicalInjuryReported = true;
      selfHarmMentioned = true;
      riskScore += 35;
      state.crisisIndicators.push({
        statement: content.substring(0, 120),
        timestamp: new Date().toISOString(),
        severity: 'self-harm',
        resolved: false,
      });
    } else if (SELF_HARM_PATTERNS.some(p => p.test(content))) {
      selfHarmMentioned = true;
      riskScore += 30;
      if (!state.crisisIndicators.some(c => c.severity === 'self-harm')) {
        state.crisisIndicators.push({
          statement: content.substring(0, 120),
          timestamp: new Date().toISOString(),
          severity: 'self-harm',
          resolved: false,
        });
      }
    }

    if (RISKY_BEHAVIOR_PATTERNS.some(p => p.test(content))) {
      impulsivityScore += 1;
      riskScore += 5;
    }

    // Detect violence risk (escalation tracking)
    if (VIOLENCE_PATTERNS.high.some(p => p.test(content))) {
      violenceRisk = 'high';
      violenceMentioned = true;
      riskScore += 40;
    } else if (VIOLENCE_PATTERNS.moderate.some(p => p.test(content))) {
      violenceRisk = violenceRisk === 'high' ? 'high' : 'moderate';
      violenceMentioned = true;
      riskScore += 25;
    } else if (VIOLENCE_PATTERNS.low.some(p => p.test(content))) {
      if (violenceRisk !== 'high' && violenceRisk !== 'moderate') {
        violenceRisk = 'low';
      }
      violenceMentioned = true;
      riskScore += 15;
    }

    // Detect active concerns
    for (const [concern, pattern] of Object.entries(CONCERN_PATTERNS)) {
      if (pattern.test(content)) {
        activeConcernsSet.add(concern);
      }
    }

    // Detect stated age (minor status)
    for (const pattern of MINOR_AGE_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        // Extract digit group from match
        const ageStr = match.find((g, i) => i > 0 && g && /^\d{1,2}$/.test(g));
        if (ageStr) {
          const age = parseInt(ageStr, 10);
          if (age >= 10 && age <= 18) {
            isMinor = true;
            minorAge = age;
          }
        } else if (
          /freshman|sophomore|8th|9th|10th|11th|12th|class|grade/i.test(content)
        ) {
          isMinor = true;
        }
        break;
      }
    }
  }

  // Determine risk level
  if (suicidalIdeation || riskScore >= 50) {
    state.riskLevel = 'IMMINENT';
  } else if (physicalInjuryReported || riskScore >= 35) {
    state.riskLevel = 'HIGH';
  } else if (selfHarmMentioned || riskScore >= 20) {
    state.riskLevel = 'MODERATE';
  } else if (riskScore >= 5) {
    state.riskLevel = 'LOW';
  } else {
    state.riskLevel = 'NONE';
  }

  state.requiresCrisisFollowUp = selfHarmMentioned || suicidalIdeation || physicalInjuryReported;
  state.messageCount = messages.filter(m => m.senderType === 'STUDENT').length;
  if (isMinor !== undefined) state.isMinor = isMinor;
  if (minorAge !== undefined) state.minorAge = minorAge;
  state.activeConcerns = Array.from(activeConcernsSet);
  state.violenceRisk = violenceRisk;
  state.violenceMentioned = violenceMentioned;

  // Inject impulsivity score into conversation summary for prompt context
  const flags: string[] = [];
  if (selfHarmMentioned) flags.push('self-harm mentioned');
  if (physicalInjuryReported) flags.push('physical injury reported');
  if (suicidalIdeation) flags.push('suicidal ideation detected');
  if (impulsivityScore >= 2) flags.push(`impulsivity signals (${impulsivityScore})`);
  if (isMinor) flags.push(`confirmed minor (age ${minorAge ?? 'stated but unclear'})`);
  if (flags.length > 0) {
    state.conversationSummary = `⚠️ CRISIS CONTEXT: ${flags.join(', ')}`;
  }

  return state;
}

/**
 * Format conversation state for prompt injection
 */
export function formatConversationStateForPrompt(state: ConversationState): string {
  const parts: string[] = [];
  
  parts.push(`**CONVERSATION STATE:**`);
  parts.push(`- Messages: ${state.messageCount}`);
  parts.push(`- Current Mood: ${state.currentMood}`);
  parts.push(`- Emotional Trend: ${state.emotionalTrend}`);
  parts.push(`- Risk Level: ${state.riskLevel}`);
  
  if (state.conversationSummary) {
    parts.push(`\n${state.conversationSummary}`);
  }
  
  if (state.isMinor) {
    const ageLabel = state.minorAge ? `age ${state.minorAge}` : 'under 18';
    parts.push(`\n🔒 **CONFIRMED MINOR: Student has stated they are ${ageLabel}. All relationship guidance MUST be age-appropriate for this age. Do not give adult romantic advice. Refer to school-aged experiences and healthy boundaries only.**`);
  }

  if (state.activeConcerns.length > 0) {
    parts.push(`\n📋 **ACTIVE CONCERNS (inform all responses):** ${state.activeConcerns.join(', ')}`);
  }

  if (state.violenceMentioned) {
    parts.push(`\n⚠️ **VIOLENCE RISK LEVEL: ${state.violenceRisk.toUpperCase()}** — Student has expressed intent to harm others. De-escalate and discourage violence.`);
  }
  
  if (state.recentTopics.length > 0) {
    parts.push(`- Recent Topics: ${state.recentTopics.join(', ')}`);
  }
  
  if (state.crisisIndicators.length > 0) {
    const unresolved = state.crisisIndicators.filter(c => !c.resolved);
    if (unresolved.length > 0) {
      parts.push(`\n⚠️ **UNRESOLVED CRISIS INDICATORS:**`);
      unresolved.forEach(c => {
        parts.push(`  - ${c.severity}: "${c.statement}" (${c.timestamp})`);
      });
    }
  }
  
  const recoveryCheck = checkRiskRecovery(state);
  if (recoveryCheck.requiresFollowUp) {
    parts.push(`\n🛡️ **CRISIS FOLLOW-UP REQUIRED:**`);
    parts.push(`${recoveryCheck.followUpMessage}`);
    if (!recoveryCheck.allowTopicChange) {
      parts.push(`⚠️ DO NOT allow topic changes until crisis is addressed.`);
    }
  }
  
  return parts.join('\n');
}

/**
 * Get crisis resources for user's location
 */
export function getCrisisResources(countryCode: string = 'DEFAULT'): CrisisResources {
  return CRISIS_RESOURCES_BY_COUNTRY[countryCode] || CRISIS_RESOURCES_BY_COUNTRY.DEFAULT;
}

/**
 * Format crisis resources for message
 */
export function formatCrisisResources(countryCode: string = 'IN'): string {
  const resources = getCrisisResources(countryCode);
  
  const parts: string[] = [];
  parts.push(`**Emergency Services:** ${resources.emergency}`);
  
  if (resources.mentalHealthHotline.length > 0) {
    parts.push(`**Mental Health Crisis:**`);
    resources.mentalHealthHotline.forEach(line => {
      parts.push(`  • ${line}`);
    });
  }
  
  if (resources.textLine) {
    parts.push(`**Crisis Text Line:** ${resources.textLine}`);
  }
  
  if (resources.additionalResources.length > 0) {
    parts.push(`**Additional Support:**`);
    resources.additionalResources.forEach(resource => {
      parts.push(`  • ${resource}`);
    });
  }
  
  return parts.join('\n');
}
