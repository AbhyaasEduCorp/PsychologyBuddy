/**
 * Exercise Recommendation System
 * 
 * Exports for the intelligent exercise recommendation system
 */

export { ConversationStateAnalyzer } from './conversation-state-analyzer';
export type { 
  ConversationState, 
  ConversationStage, 
  EmotionIntensity,
  Message as AnalyzerMessage 
} from './conversation-state-analyzer';

export { ExerciseRecommendationEngine } from './exercise-recommendation-engine';
export type { 
  ExerciseRecommendation, 
  RecommendationContext 
} from './exercise-recommendation-engine';
