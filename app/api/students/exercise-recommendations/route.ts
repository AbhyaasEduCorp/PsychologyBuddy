import { NextRequest, NextResponse } from 'next/server';
import { ExerciseRecommendationEngine } from '@/src/services/exercise-recommendations/exercise-recommendation-engine';
import { ConversationStateAnalyzer } from '@/src/services/exercise-recommendations/conversation-state-analyzer';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Analyze conversation state
    const conversationState = ConversationStateAnalyzer.analyzeState(messages);

    // Check if we should recommend exercises
    const context = {
      conversationState,
      previousExercises: [], // TODO: Track in session/database
      timeInConversation: Math.floor((Date.now() - (messages[0]?.timestamp || Date.now())) / 60000),
      lastExerciseTime: undefined // TODO: Track in session/database
    };

    const shouldRecommend = ExerciseRecommendationEngine.shouldRecommendExercises(context);

    if (!shouldRecommend) {
      return NextResponse.json({
        shouldShowRecommendations: false,
        recommendations: [],
        introductionText: '',
        conversationState
      });
    }

    // Get recommendations from database
    const recommendations = await ExerciseRecommendationEngine.getRecommendations(context);

    // Generate introduction text
    const introductionText = recommendations.length > 0
      ? ExerciseRecommendationEngine.generateIntroduction(conversationState, recommendations)
      : '';

    return NextResponse.json({
      shouldShowRecommendations: recommendations.length > 0,
      recommendations,
      introductionText,
      conversationState
    });

  } catch (error) {
    console.error('[ExerciseRecommendations API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate exercise recommendations' },
      { status: 500 }
    );
  }
}
