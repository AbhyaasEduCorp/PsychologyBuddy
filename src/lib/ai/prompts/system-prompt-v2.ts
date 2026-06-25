/**
 * System Prompt V2 - Modular Architecture
 * 
 * This is the NEW system prompt that assembles focused modules
 * instead of one large monolithic prompt.
 * 
 * Benefits:
 * - Smaller total size (~3500-4000 words vs 15000 words)
 * - No repetition (each concept appears once)
 * - Easy to maintain (edit one module at a time)
 * - Better model compliance (focused attention)
 * - Structured memory state injection
 * - Persistent crisis tracking
 */

import CORE_PROMPT from './core-prompt';
import CRISIS_MODULE_PROMPT from './crisis-module';
import { CONVERSATION_PATTERNS } from './conversation-patterns';
import STUDENT_BOUNDARIES from './student-boundaries';
import STUDENT_SAFETY_POLICY from './student-safety-policy';
import {
  ConversationState,
  formatConversationStateForPrompt,
  formatCrisisResources,
  checkRiskRecovery,
} from './memory-state';

export interface SystemPromptOptions {
  conversationState?: ConversationState;
  includeExamples?: boolean;
  includeCrisisModule?: boolean;
  includeStudentBoundaries?: boolean;
  includeStudentSafetyPolicy?: boolean;
  userCountry?: string;
}

/**
 * Build the complete system prompt with optional modules
 */
export function buildSystemPrompt(options: SystemPromptOptions = {}): string {
  const {
    conversationState,
    includeExamples = false,
    includeCrisisModule = true,
    includeStudentBoundaries = true,
    includeStudentSafetyPolicy = true,
    userCountry = 'IN',
  } = options;

  const sections: string[] = [];

  // 1. Student Safety Policy (HIGHEST PRIORITY - Always first)
  // This prevents identity manipulation and ensures student-safe behavior
  if (includeStudentSafetyPolicy) {
    sections.push(STUDENT_SAFETY_POLICY);
    sections.push('\n---\n');
  }

  // 2. Core Prompt (Identity, style, conversation guidelines)
  sections.push(CORE_PROMPT);

  // 3. Student Boundaries (Age-appropriate scope and guidelines)
  if (includeStudentBoundaries) {
    sections.push('\n---\n');
    sections.push(STUDENT_BOUNDARIES);
  }

  // 4. Crisis Module (Include by default, or when risk level is elevated)
  const shouldIncludeCrisis =
    includeCrisisModule ||
    (conversationState && conversationState.riskLevel !== 'NONE');

  if (shouldIncludeCrisis) {
    // Inject location-specific crisis resources
    const crisisResources = formatCrisisResources(userCountry);
    const crisisPrompt = CRISIS_MODULE_PROMPT
      .replace(/\{\{EMERGENCY_NUMBER\}\}/g, userCountry === 'US' ? '911' : '112')
      .replace(/\{\{CRISIS_HOTLINE\}\}/g, userCountry === 'US' ? '988' : 'Tele-MANAS: 14416')
      .replace(/\{\{CRISIS_RESOURCES\}\}/g, crisisResources);
    
    sections.push('\n---\n');
    sections.push(crisisPrompt);
  }

  // 5. Conversation State (If available)
  if (conversationState) {
    sections.push('\n---\n');
    sections.push(formatConversationStateForPrompt(conversationState));
    
    // Add crisis recovery check
    const recoveryCheck = checkRiskRecovery(conversationState);
    if (recoveryCheck.requiresFollowUp) {
      sections.push('\n⚠️ **IMPORTANT:** Address unresolved crisis before continuing with other topics.');
    }
  }

  // 6. Conversation Examples (Optional, for quality control testing)
  if (includeExamples) {
    sections.push('\n---\n');
    sections.push(CONVERSATION_PATTERNS);
  }

  return sections.join('\n');
}

/**
 * Build a compact system prompt (no examples, no crisis module unless needed)
 * Use this for most conversations to minimize token usage
 */
export function buildCompactSystemPrompt(conversationState?: ConversationState): string {
  return buildSystemPrompt({
    conversationState,
    includeExamples: false,
    includeCrisisModule: conversationState?.riskLevel !== 'NONE',
  });
}

/**
 * Build a full system prompt with all modules
 * Use this for testing, quality assurance, or when you need full context
 */
export function buildFullSystemPrompt(
  conversationState?: ConversationState,
  userCountry?: string
): string {
  return buildSystemPrompt({
    conversationState,
    includeExamples: true,
    includeCrisisModule: true,
    userCountry,
  });
}

/**
 * Get token estimate for the system prompt
 */
export function estimateSystemPromptTokens(prompt: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(prompt.length / 4);
}

/**
 * Main export - this is what should be used in production
 */
export function getSystemPrompt(
  conversationState?: ConversationState,
  userCountry: string = 'IN'
): string {
  // Build appropriate prompt based on conversation state
  const prompt = buildCompactSystemPrompt(conversationState);
  
  // Inject country-specific crisis resources if needed
  const crisisResources = formatCrisisResources(userCountry);
  const finalPrompt = prompt.replace(/\{\{CRISIS_RESOURCES\}\}/g, crisisResources);
  
  return finalPrompt;
}

// For backward compatibility during migration
export const PSYCHOLOGY_BUDDY_SYSTEM_PROMPT_V2 = getSystemPrompt();

export default getSystemPrompt;
