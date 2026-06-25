/**
 * Activity Tracker Service
 * 
 * This service provides a centralized way to track student activities
 * and automatically update challenge progress across all modules.
 */

import { ChallengeProgressService, ActivityEvent } from './challenge-progress.service';
import { ModuleType } from './types/challenge.types';

export class ActivityTracker {
  /**
   * Track journaling activity
   */
  static async trackJournalingEntry(userId: string, entryType: 'write' | 'audio' | 'art' = 'write'): Promise<void> {
    try {
      await ChallengeProgressService.processActivityEvent({
        userId,
        moduleType: ModuleType.JOURNALING,
        action: 'entry_created',
        value: 1,
        metadata: { entryType },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error tracking journaling activity:', error);
    }
  }

  /**
   * Track meditation session completion
   */
  static async trackMeditationSession(
    userId: string, 
    durationInSeconds: number,
    meditationId?: string
  ): Promise<void> {
    try {
      await ChallengeProgressService.processActivityEvent({
        userId,
        moduleType: ModuleType.MEDITATION,
        action: 'session_completed',
        value: durationInSeconds,
        metadata: { meditationId },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error tracking meditation activity:', error);
    }
  }

  /**
   * Track music therapy session completion
   */
  static async trackMusicSession(
    userId: string, 
    durationInSeconds: number,
    musicId?: string
  ): Promise<void> {
    try {
      await ChallengeProgressService.processActivityEvent({
        userId,
        moduleType: ModuleType.MUSIC,
        action: 'session_completed',
        value: durationInSeconds,
        metadata: { musicId },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error tracking music activity:', error);
    }
  }

  /**
   * Track article reading
   */
  static async trackArticleRead(userId: string, articleId: string): Promise<void> {
    try {
      await ChallengeProgressService.processActivityEvent({
        userId,
        moduleType: ModuleType.ARTICLE,
        action: 'article_read',
        value: 1,
        metadata: { articleId },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error tracking article read activity:', error);
    }
  }

  /**
   * Track article completion
   */
  static async trackArticleCompletion(userId: string, articleId: string): Promise<void> {
    try {
      await ChallengeProgressService.processActivityEvent({
        userId,
        moduleType: ModuleType.ARTICLE,
        action: 'article_completed',
        value: 1,
        metadata: { articleId, completed: true },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error tracking article completion activity:', error);
    }
  }
}
