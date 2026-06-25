/**
 * Redirect Engine Service
 * 
 * Purpose: Generate varied redirect responses to prevent repetition
 * Prevents users from seeing "I'm here for mental well-being..." 6+ times
 * 
 * Critical Feature: Rotates through templates to maintain conversation quality
 */

export class RedirectEngine {
  private static redirectTemplates = {
    gibberish: [
      "I'm not sure what that means. Were you testing me, or is something on your mind?",
      "That came through as random characters. If you're trying to say something, you can say it however it comes out.",
      "I didn't quite catch that. What's going on?",
      "Looks like keyboard mashing. Everything okay?",
      "I'm seeing random text. If something's frustrating you or hard to express, you can just tell me that too."
    ],
    fashion: [
      "I'm here to support your emotional well-being rather than give fashion advice. If you're feeling anxious about the event or stressed about how you'll be perceived, we can talk about those feelings.",
      "I focus on mental wellness conversations rather than style choices. Are you feeling nervous or stressed about this event?",
      "I'm designed for emotional support rather than fashion guidance. Is there something about this event that's causing you anxiety?",
      "That's not really my area, but if you're feeling pressure or worried about this event, I'm here to talk about that.",
      "I notice you're asking about what to wear. If you're feeling anxious about how you'll be perceived or judged, we could explore those feelings."
    ],
    food: [
      "I'm here to support your emotional well-being rather than give food or recipe suggestions. If you're feeling stressed about the party or need to talk about how you're doing, I'm here for that.",
      "I focus on mental wellness conversations rather than food planning. Is there something on your mind that's been bothering you?",
      "I'm designed for emotional support rather than party planning. How have you been feeling lately?",
      "That's outside what I help with, but if there's something weighing on you or you'd like to talk about your emotional well-being, I'm here."
    ],
    recipe: [
      "I'm here to support your emotional well-being rather than cooking advice. If you're feeling stressed or overwhelmed about meal planning or food-related concerns, we can talk about those feelings.",
      "I'm focused on mental wellness conversations. If something about cooking or food is connected to stress or emotions you're experiencing, feel free to share that.",
      "I'm designed for emotional support rather than recipes. Is there something on your mind that's been bothering you?",
      "I notice we're talking about food topics. If this is connected to how you're feeling or something you're going through emotionally, I'm here for that conversation.",
      "That's outside what I can help with, but if there's something weighing on you today, I'd be happy to listen."
    ],
    movie: [
      "I'm here for mental wellness conversations rather than entertainment recommendations. If you're looking for ways to relax or cope with stress, we can explore that together.",
      "I focus on emotional well-being rather than movies. Are you feeling stressed or overwhelmed and looking for ways to unwind?",
      "I'm designed to support your mental health rather than suggest entertainment. What's been on your mind lately?",
      "That's not really my area, but if you'd like to talk about what you're going through or how you've been feeling, I'm here.",
      "I notice you're asking about movies. If you're looking for distraction from something that's bothering you, we could talk about that instead."
    ],
    coding: [
      "I'm here to support emotional well-being rather than technical help. If you're feeling frustrated or stressed about a coding project, we can talk about managing those feelings.",
      "I'm focused on mental wellness rather than programming. Is the coding work causing you stress or anxiety?",
      "I'm designed for emotional support rather than technical assistance. How have you been feeling lately?"
    ],
    politics: [
      "I'm here for mental wellness conversations rather than political discussions. If current events are affecting your emotional well-being, we can talk about that.",
      "I focus on emotional support rather than politics. Are you feeling stressed or anxious about what's happening in the world?",
      "I'm designed to support your mental health rather than discuss politics. What's been weighing on you?"
    ],
    general_knowledge: [
      "I'm focused on mental wellness conversations rather than general information. If you'd like to talk about how you're feeling, what's been on your mind, or something you're going through, I'm here to listen.",
      "I'm here to support your emotional well-being rather than answer general questions. Is there something on your mind today?",
      "I'm designed for mental health support rather than general knowledge. How have you been feeling lately?",
      "That's outside my focus, but if something's been weighing on you or you'd like to talk about what you're experiencing, I'm here.",
      "I notice we've shifted topics. If there's something you'd like to share about how you're doing or what you're going through, feel free."
    ],
    general_information: [
      "I'm here specifically for emotional wellness conversations. If there's something about your well-being you'd like to discuss, I'm here for that.",
      "That's not really my area. But if you're going through something or need to talk about how you're feeling, I'm here to listen.",
      "I focus on mental wellness rather than general topics. What's been on your mind emotionally?",
      "I notice we're talking about general topics. If there's something deeper going on or you'd like to discuss how you're feeling, I'm here.",
      "That's outside what I help with, but if you'd like to talk about your emotional well-being or something you're experiencing, feel free to share."
    ],
    homework: [
      "I'm here for emotional support rather than homework help. If you're feeling stressed or anxious about your schoolwork, we can talk about managing those feelings.",
      "I'm focused on mental wellness rather than academic assistance. Is the homework causing you stress or overwhelm?",
      "I'm designed to support your mental health rather than solve assignments. How are you feeling about your workload?"
    ],
    technical_help: [
      "I'm here for mental wellness conversations rather than technical troubleshooting. If technology issues are causing you stress or frustration, we can talk about managing those feelings.",
      "I'm focused on emotional support rather than technical help. Is this technical issue affecting your stress levels?",
      "I'm designed for mental health support rather than tech support. How have you been feeling lately?"
    ],
    // BLOCKED CONTENT (Student Safety)
    sexual_content: [
      "I'm here to support emotional wellbeing and school-related challenges. If you have questions about relationships or feelings, we can talk about those in an age-appropriate way.",
      "I can't help with that topic. If you're feeling confused about relationships or have questions about feelings, I'm here to talk about those things.",
      "That's not something I can discuss. If you're curious or have questions about growing up or relationships, talking to a trusted adult, parent, or school counselor would be better."
    ],
    drugs_crime: [
      "I can't help with that. If you're curious about substances or feeling pressure around drugs, talking to a counselor or trusted adult could help you process those feelings safely.",
      "That's not something I can provide information about. If you're dealing with pressure or curiosity about substances, a school counselor can give you good guidance.",
      "I'm not able to help with that topic. If you're feeling pressured or curious, reaching out to a trusted adult would be a good step."
    ],
    violence_harmful: [
      "I can't help with that. If you're feeling frustrated or angry about something, let's talk about what's really going on.",
      "That's not something I can assist with. If you're feeling really angry or upset, I'm here to talk about those feelings in a healthy way.",
      "I notice you're asking about harmful things. If you're feeling angry, hurt, or frustrated, let's talk about what's behind those feelings."
    ],
    self_harm_instructions: [
      "I can't provide information about self-harm methods. If you're thinking about hurting yourself, please talk to a trusted adult, school counselor, or call a crisis helpline. Your safety matters.",
      "I'm not able to help with that. If you're having thoughts about self-harm, please reach out to someone who can help—a counselor, parent, or trusted adult. You don't have to go through this alone.",
      "I can't discuss methods of self-harm. What you're going through sounds really painful. Please talk to a school counselor or trusted adult today. They can provide the support you need."
    ],
    cheating: [
      "I'm here to support your emotional wellbeing, not to help with cheating. If you're feeling overwhelmed by schoolwork or anxious about exams, let's talk about those feelings and ways to cope.",
      "I can't help with cheating on exams. If you're feeling stressed about school or worried about your grades, we can talk about managing that pressure.",
      "That's not something I can assist with. If the pressure around grades is getting to you, let's talk about what's really going on."
    ],
    career_advice: [
      "I can't make career decisions for you, but if you're feeling uncertain about the future, we can talk about those feelings. What interests you most right now?",
      "I notice you're thinking about your future. Instead of telling you what career to choose, let's explore what you're feeling about these choices. What draws you to different paths?",
      "Career decisions are personal, and I can't make them for you. But if you're feeling anxious or uncertain about your future, we can talk through those feelings."
    ],
    default: [
      "I'm here specifically to support mental well-being and emotional conversations. If there's something affecting your mood, stress level, or emotional health, I'd be happy to talk about that.",
      "I'm focused on mental wellness conversations. If you'd like to talk about how you're feeling or something you're going through, I'm here.",
      "I'm designed for emotional support and mental wellness. What's been on your mind lately?"
    ],
    // Special redirect for potential jailbreak attempts
    boundary_testing: [
      "I notice you've been asking about several different topics. Just to clarify—I'm specifically designed to support emotional well-being and mental wellness conversations. If there's something on your mind about how you're feeling or something you're going through, I'm here to listen.",
      "It seems like you're exploring what I can help with. I'm focused exclusively on mental wellness and emotional support. If you'd like to talk about stress, emotions, relationships, or challenges you're facing, I'm here for that.",
      "I'm noticing we're jumping between different topics. I want to be clear that I'm designed specifically for mental health support and emotional conversations. Is there something about your well-being you'd like to talk about?"
    ]
  };
  
  // Track last redirect index per category to avoid repetition
  private static lastRedirectIndex: Record<string, number> = {};
  
  /**
   * Generate varied redirect response
   * Rotates through templates to prevent seeing the same message repeatedly
   */
  static generate(
    category: string,
    conversationLength: number = 0,
    isJailbreakAttempt: boolean = false
  ): string {
    // Use special template for boundary testing
    if (isJailbreakAttempt) {
      category = 'boundary_testing';
    }
    
    const templates = this.redirectTemplates[category as keyof typeof this.redirectTemplates] || this.redirectTemplates.default;
    
    // Rotate through templates to avoid repetition
    const lastIndex = this.lastRedirectIndex[category] || 0;
    const nextIndex = (lastIndex + 1) % templates.length;
    this.lastRedirectIndex[category] = nextIndex;
    
    return templates[nextIndex];
  }
  
  /**
   * Reset redirect tracking (useful for testing or new sessions)
   */
  static reset(): void {
    this.lastRedirectIndex = {};
  }
  
  /**
   * Get all available redirect categories
   */
  static getCategories(): string[] {
    return Object.keys(this.redirectTemplates);
  }
}
