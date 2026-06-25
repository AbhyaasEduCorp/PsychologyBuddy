/**
 * Exercise Recommendation Engine
 * 
 * Dynamically recommends exercises based on conversation state, emotion, and readiness.
 * Fetches actual resources from the database (articles, music, meditation, journaling).
 * Only shows recommendations if resources are available.
 */

import { ConversationState, EmotionIntensity } from './conversation-state-analyzer';
import prisma from '@/src/prisma';

export interface ExerciseRecommendation {
  id: string;
  type: 'journaling' | 'meditation' | 'music' | 'article';
  title: string;
  description: string;
  url: string;
  icon: string;
  relevanceScore: number; // How relevant to current state (0-100)
  introductionText?: string; // Natural way to introduce this exercise
  resourceId?: string; // ID of the actual resource in the database
  thumbnailUrl?: string; // Thumbnail for the resource
}

export interface RecommendationContext {
  conversationState: ConversationState;
  previousExercises: string[]; // IDs of previously suggested exercises
  timeInConversation: number; // Minutes
  lastExerciseTime?: number; // Timestamp of last suggestion
  studentId?: string; // For checking available resources
}

export class ExerciseRecommendationEngine {
  private static readonly MIN_READINESS_SCORE = 60; // Minimum score to suggest exercises
  private static readonly MIN_TIME_BETWEEN_SUGGESTIONS = 5 * 60 * 1000; // 5 minutes

  /**
   * Determine if we should show exercise recommendations
   */
  static shouldRecommendExercises(context: RecommendationContext): boolean {
    const { conversationState, lastExerciseTime } = context;

    // Never recommend during crisis
    if (conversationState.intensity === 'crisis') {
      return false;
    }

    // Don't recommend too early or during venting
    if (conversationState.stage === 'expression' && !conversationState.ventingComplete) {
      return false;
    }

    // Don't recommend during closure
    if (conversationState.stage === 'closure') {
      return false;
    }

    // Check readiness score
    if (conversationState.readinessScore < this.MIN_READINESS_SCORE) {
      return false;
    }

    // Don't recommend too frequently
    if (lastExerciseTime) {
      const timeSinceLastSuggestion = Date.now() - lastExerciseTime;
      if (timeSinceLastSuggestion < this.MIN_TIME_BETWEEN_SUGGESTIONS) {
        return false;
      }
    }

    // Best moments for recommendations:
    // 1. After insight moments (user just realized something)
    // 2. During reflection stage (user is processing)
    // 3. When conversation reaches moderate depth
    return (
      conversationState.insightMoment ||
      conversationState.stage === 'reflection' ||
      (conversationState.stage === 'understanding' && conversationState.conversationDepth !== 'surface')
    );
  }

  /**
   * Get exercise recommendations based on conversation state
   * Fetches actual resources from database
   */
  static async getRecommendations(context: RecommendationContext): Promise<ExerciseRecommendation[]> {
    const { conversationState, previousExercises } = context;
    const recommendations: ExerciseRecommendation[] = [];

    try {
      // 1. Check for journaling availability
      const journalingAvailable = await this.isJournalingAvailable();
      if (journalingAvailable && this.shouldRecommendJournaling(conversationState)) {
        recommendations.push({
          id: 'journaling',
          type: 'journaling',
          title: 'Journaling',
          description: 'Express your thoughts and feelings through writing',
          url: '/students/selfhelptools/journaling',
          icon: '📝',
          relevanceScore: this.calculateJournalingRelevance(conversationState),
          introductionText: this.getJournalingIntro(conversationState)
        });
      }

      // 2. Fetch mood-matched meditation resources
      const meditations = await this.fetchMeditationResources(conversationState.emotion);
      for (const meditation of meditations) {
        if (!previousExercises.includes(meditation.id)) {
          recommendations.push({
            id: meditation.id,
            type: 'meditation',
            title: meditation.title,
            description: meditation.description || 'Guided meditation to help you find calm',
            url: `/students/selfhelptools/meditation/${meditation.id}`,
            icon: '🧘',
            relevanceScore: this.calculateRelevanceScore('meditation', conversationState),
            resourceId: meditation.id,
            thumbnailUrl: meditation.thumbnailUrl || undefined,
            introductionText: 'Meditation can help calm your mind and ease tension'
          });
        }
      }

      // 3. Fetch mood-matched music resources
      const musicResources = await this.fetchMusicResources(conversationState.emotion);
      for (const music of musicResources) {
        if (!previousExercises.includes(music.id)) {
          recommendations.push({
            id: music.id,
            type: 'music',
            title: music.title,
            description: music.subtitle || 'Music to support your emotional well-being',
            url: `/students/selfhelptools/music/${music.id}`,
            icon: '🎵',
            relevanceScore: this.calculateRelevanceScore('music', conversationState),
            resourceId: music.id,
            thumbnailUrl: music.thumbnailUrl || undefined,
            introductionText: 'Music can be healing and help shift your mood'
          });
        }
      }

      // 4. Fetch mood-matched articles
      const articles = await this.fetchArticleResources(conversationState.emotion);
      for (const article of articles) {
        if (!previousExercises.includes(article.id)) {
          recommendations.push({
            id: article.id,
            type: 'article',
            title: article.title,
            description: article.description,
            url: `/students/library/${article.id}`,
            icon: '📚',
            relevanceScore: this.calculateRelevanceScore('article', conversationState),
            resourceId: article.id,
            thumbnailUrl: article.thumbnailUrl || undefined,
            introductionText: 'This article might help you understand what you\'re going through'
          });
        }
      }

      // Sort by relevance and return top 3-4
      return recommendations
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 4);

    } catch (error) {
      console.error('[ExerciseRecommendation] Error fetching resources:', error);
      // Return empty array if fetching fails - don't show broken recommendations
      return [];
    }
  }

  /**
   * Check if journaling is available/enabled
   */
  private static async isJournalingAvailable(): Promise<boolean> {
    try {
      // Check if journaling tool config exists and is enabled
      const config = await prisma.journalingToolConfig.findFirst({
        where: {
          OR: [
            { enableWriting: true },
            { enableAudio: true },
            { enableArt: true }
          ]
        }
      });
      return !!config;
    } catch (error) {
      console.error('[ExerciseRecommendation] Error checking journaling availability:', error);
      return true; // Default to available if check fails
    }
  }

  /**
   * Fetch meditation resources matching emotion/mood
   */
  private static async fetchMeditationResources(emotion: string): Promise<any[]> {
    try {
      // Map emotion to mood labels
      const moodKeywords = this.emotionToMoodKeywords(emotion);
      
      const meditations = await prisma.meditation.findMany({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          moods: {
            some: {
              mood: {
                name: {
                  in: moodKeywords,
                  mode: 'insensitive'
                }
              }
            }
          }
        },
        take: 2,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          durationSec: true
        }
      });

      return meditations;
    } catch (error) {
      console.error('[ExerciseRecommendation] Error fetching meditations:', error);
      return [];
    }
  }

  /**
   * Fetch music resources matching emotion/mood
   */
  private static async fetchMusicResources(emotion: string): Promise<any[]> {
    try {
      const moodKeywords = this.emotionToMoodKeywords(emotion);
      
      const music = await prisma.musicTherapy.findMany({
        where: {
          status: 'PUBLISHED',
          supportedMoods: {
            hasSome: moodKeywords
          }
        },
        take: 2,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          title: true,
          subtitle: true,
          thumbnailUrl: true,
          durationSec: true,
          supportedMoods: true
        }
      });

      return music;
    } catch (error) {
      console.error('[ExerciseRecommendation] Error fetching music:', error);
      return [];
    }
  }

  /**
   * Fetch articles matching emotion/mood
   */
  private static async fetchArticleResources(emotion: string): Promise<any[]> {
    try {
      const moodKeywords = this.emotionToMoodKeywords(emotion);
      
      const articles = await prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          moods: {
            some: {
              mood: {
                name: {
                  in: moodKeywords,
                  mode: 'insensitive'
                }
              }
            }
          }
        },
        take: 2,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          readTime: true
        }
      });

      return articles;
    } catch (error) {
      console.error('[ExerciseRecommendation] Error fetching articles:', error);
      return [];
    }
  }

  /**
   * Map conversation emotion to database mood keywords
   */
  private static emotionToMoodKeywords(emotion: string): string[] {
    const moodMap: Record<string, string[]> = {
      'anxiety': ['Anxious', 'Worried', 'Nervous', 'Stressed'],
      'sadness': ['Sad', 'Down', 'Depressed', 'Low'],
      'stress': ['Stressed', 'Overwhelmed', 'Tense'],
      'anger': ['Angry', 'Frustrated', 'Irritated'],
      'confusion': ['Confused', 'Uncertain', 'Lost'],
      'loneliness': ['Lonely', 'Isolated', 'Alone'],
      'fear': ['Fearful', 'Scared', 'Afraid'],
      'neutral': ['Calm', 'Neutral', 'Peaceful'],
      'happy': ['Happy', 'Joyful', 'Content']
    };

    return moodMap[emotion.toLowerCase()] || ['Calm', 'Neutral'];
  }

  /**
   * Determine if journaling should be recommended for current state
   */
  private static shouldRecommendJournaling(state: ConversationState): boolean {
    // Journaling is good for:
    // - Processing emotions (any stage except closure)
    // - After insight moments
    // - Moderate to high emotional intensity
    return (
      state.stage === 'reflection' ||
      state.stage === 'understanding' ||
      state.insightMoment ||
      state.intensity === 'moderate' ||
      state.intensity === 'high'
    );
  }

  /**
   * Calculate relevance score for journaling
   */
  private static calculateJournalingRelevance(state: ConversationState): number {
    let score = 50;

    if (state.stage === 'reflection') score += 30;
    if (state.insightMoment) score += 20;
    if (state.intensity === 'moderate') score += 15;
    if (state.intensity === 'high') score += 10;

    return Math.min(100, score);
  }

  /**
   * Get introduction text for journaling
   */
  private static getJournalingIntro(state: ConversationState): string {
    if (state.insightMoment) {
      return 'Writing can help you explore this insight further';
    }
    if (state.stage === 'reflection') {
      return 'Journaling might help you process these thoughts';
    }
    if (state.intensity === 'high') {
      return 'Sometimes writing helps release intense emotions';
    }
    return 'Writing can help you make sense of what you\'re feeling';
  }

  /**
   * Calculate relevance score for resource type
   */
  private static calculateRelevanceScore(
    type: 'meditation' | 'music' | 'article',
    state: ConversationState
  ): number {
    let score = 50;

    // Meditation is better for anxiety and stress
    if (type === 'meditation') {
      if (state.emotion === 'anxiety') score += 25;
      if (state.emotion === 'stress') score += 20;
      if (state.intensity === 'high') score += 15;
    }

    // Music is better for sadness and mood shifts
    if (type === 'music') {
      if (state.emotion === 'sadness') score += 25;
      if (state.emotion === 'loneliness') score += 20;
      if (state.intensity === 'moderate') score += 15;
    }

    // Articles are better for understanding and reflection
    if (type === 'article') {
      if (state.stage === 'understanding') score += 25;
      if (state.stage === 'reflection') score += 20;
      if (state.conversationDepth === 'deep') score += 15;
    }

    return Math.min(100, score);
  }

  /**
   * Generate natural introduction text for exercise suggestions
   */
  static generateIntroduction(
    conversationState: ConversationState,
    recommendations: ExerciseRecommendation[]
  ): string {
    const { emotion, stage, insightMoment } = conversationState;

    // Insight-based introductions (best moment)
    if (insightMoment) {
      return "I notice you're gaining some clarity. Sometimes when we reach these realizations, it helps to explore them further. Would you like to try one of these?";
    }

    // Reflection stage introductions
    if (stage === 'reflection') {
      return "You've shared a lot, and it sounds like you're really thinking this through. Would it help to try an activity that might give you some space to process these feelings?";
    }

    // Understanding stage introductions
    if (stage === 'understanding') {
      return "It sounds like you're starting to understand what's been going on. Sometimes people find it helpful to work through these thoughts with an activity. Would you like to try something?";
    }

    // Emotion-specific introductions
    switch (emotion) {
      case 'anxiety':
        return "I hear that you're feeling anxious. When thoughts start racing, some people find it helpful to slow things down with a calming activity. Would you like to try one?";
      
      case 'sadness':
        return "It sounds like you're carrying a lot right now. Sometimes expressing these feelings in different ways can help. Would you be open to trying an activity?";
      
      case 'stress':
        return "You mentioned feeling overwhelmed. When stress builds up, it can help to step back and reset. Would you like to try an activity that might help with that?";
      
      case 'anger':
        return "I can hear your frustration. When emotions are running high, it can help to channel them constructively. Would you like to try an activity?";
      
      default:
        return "Based on what you've shared, I think these activities might be helpful for you right now. Would you like to try one?";
    }
  }
}
