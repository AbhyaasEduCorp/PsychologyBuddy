/**
 * useExerciseRecommendations Hook
 * 
 * Intelligent exercise recommendations based on conversation state
 * rather than arbitrary message counts.
 * 
 * Updated to use server-side API to avoid bundling Prisma in client code.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ExerciseRecommendation } from '@/src/services/exercise-recommendations/exercise-recommendation-engine';

interface Message {
  id: string;
  sender: 'student' | 'bot';
  content: string;
  timestamp: string;
}

interface UseExerciseRecommendationsOptions {
  messages: Message[];
  enabled?: boolean;
}

interface UseExerciseRecommendationsResult {
  shouldShowRecommendations: boolean;
  recommendations: ExerciseRecommendation[];
  introductionText: string;
  conversationState: any;
  dismiss: () => void;
  markShown: () => void;
  isLoading: boolean;
}

export function useExerciseRecommendations({
  messages,
  enabled = true
}: UseExerciseRecommendationsOptions): UseExerciseRecommendationsResult {
  const [shouldShow, setShouldShow] = useState(false);
  const [recommendations, setRecommendations] = useState<ExerciseRecommendation[]>([]);
  const [introText, setIntroText] = useState('');
  const [conversationState, setConversationState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Track previously suggested exercises and timing
  const previousExercisesRef = useRef<string[]>([]);
  const hasShownRef = useRef(false);

  /**
   * Fetch recommendations from server-side API
   */
  const fetchRecommendations = useCallback(async () => {
    if (!enabled || messages.length === 0) {
      return;
    }

    // Don't re-fetch if already showing
    if (hasShownRef.current) {
      return;
    }

    setIsLoading(true);
    try {
      // Convert messages to API format
      const apiMessages = messages.map(m => ({
        sender: m.sender,
        content: m.content,
        timestamp: m.timestamp
      }));

      const response = await fetch('/api/students/exercise-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: apiMessages })
      });

      if (!response.ok) {
        console.error('[useExerciseRecommendations] API error:', response.statusText);
        return;
      }

      const data = await response.json();
      
      setConversationState(data.conversationState);

      console.log('[ExerciseRec] API Response:', {
        shouldShow: data.shouldShowRecommendations,
        recommendationCount: data.recommendations?.length || 0,
        state: data.conversationState
      });
      
      if (data.shouldShowRecommendations && data.recommendations.length > 0) {
        // Filter out previously shown exercises
        const newRecs = data.recommendations.filter(
          (rec: ExerciseRecommendation) => !previousExercisesRef.current.includes(rec.id)
        );
        
        if (newRecs.length > 0) {
          setRecommendations(newRecs);
          setIntroText(data.introductionText);
          setShouldShow(true);
          hasShownRef.current = true;

          console.log('[ExerciseRec] Showing recommendations:', newRecs.map((r: ExerciseRecommendation) => r.title));
        }
      } else {
        setShouldShow(false);
      }
    } catch (error) {
      console.error('[useExerciseRecommendations] Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [messages, enabled]);

  /**
   * Monitor messages for changes
   */
  useEffect(() => {
    // Only fetch when new messages arrive
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      // Fetch after student messages (not bot messages)
      if (lastMessage.sender === 'student') {
        // If recommendations are currently showing and user sends a new message
        // without clicking any exercise, dismiss them
        if (shouldShow) {
          console.log('[ExerciseRec] User sent message without clicking exercise - dismissing');
          setShouldShow(false);
          // Allow showing new recommendations after 5 minutes
          setTimeout(() => {
            hasShownRef.current = false;
          }, 5 * 60 * 1000);
        } else {
          // No recommendations showing, fetch new ones
          fetchRecommendations();
        }
      }
    }
  }, [messages.length, fetchRecommendations, shouldShow]);

  /**
   * Dismiss recommendations
   */
  const dismiss = useCallback(() => {
    setShouldShow(false);
    // Allow showing again after 5 minutes
    setTimeout(() => {
      hasShownRef.current = false;
    }, 5 * 60 * 1000);
  }, []);

  /**
   * Mark recommendations as shown (when user clicks one)
   */
  const markShown = useCallback(() => {
    if (recommendations.length > 0) {
      // Add to previously suggested exercises
      previousExercisesRef.current.push(...recommendations.map(r => r.id));
      console.log('[ExerciseRec] User clicked exercise - marking as shown');
    }
    // Don't dismiss here - let the navigation happen
    // Component will handle dismissing
  }, [recommendations]);

  return {
    shouldShowRecommendations: shouldShow,
    recommendations,
    introductionText: introText,
    conversationState,
    dismiss,
    markShown,
    isLoading
  };
}
