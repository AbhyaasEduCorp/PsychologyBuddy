/**
 * Scope Control Services
 * 
 * Provides control layers before and after LLM to enforce conversation boundaries
 * Critical architectural principle: Never trust the LLM alone
 */

export { ScopeClassifier, type ScopeClassificationResult } from './scope-classifier';
export { RedirectEngine } from './redirect-engine';
export { ResponseValidator, type ValidationResult } from './response-validator';
export { ConversationStateTracker, type ConversationState } from './conversation-state-tracker';

// Enhanced classification system
export { EnhancedClassifier } from './enhanced-classifier';
export {
  MentalHealthCategory,
  UtilityCategory,
  OutOfScopeCategory,
  SpecialCategory,
  InputQualityCategory,
  UserIntent,
  CategoryHelpers,
  type EnhancedClassificationResult,
  type Category
} from './classification-types';
