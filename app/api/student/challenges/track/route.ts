import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/src/utils/session-helper";
import { ActivityTracker } from "@/src/services/challenges/activity-tracker";
import { z } from "zod";

const trackActivitySchema = z.object({
  type: z.enum(['meditation', 'music', 'article', 'journaling']),
  itemId: z.string(),
  duration: z.number().optional(),
  journalType: z.enum(['write', 'audio', 'art']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'challenges.view');

    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log('[Challenge Track] Request body:', body);
    
    const { type, itemId, duration, journalType } = trackActivitySchema.parse(body);

    const userId = session.userId;
    console.log('[Challenge Track] Tracking activity:', { type, userId, itemId, duration, journalType });

    // Track the activity based on type
    switch (type) {
      case 'meditation':
        if (!duration) {
          return NextResponse.json({ error: "Duration required for meditation" }, { status: 400 });
        }
        await ActivityTracker.trackMeditationSession(userId, duration, itemId);
        console.log('[Challenge Track] Meditation tracked successfully');
        break;

      case 'music':
        if (!duration) {
          return NextResponse.json({ error: "Duration required for music" }, { status: 400 });
        }
        await ActivityTracker.trackMusicSession(userId, duration, itemId);
        console.log('[Challenge Track] Music tracked successfully');
        break;

      case 'article':
        await ActivityTracker.trackArticleCompletion(userId, itemId);
        console.log('[Challenge Track] Article tracked successfully');
        break;

      case 'journaling':
        if (!journalType) {
          return NextResponse.json({ error: "Journal type required for journaling" }, { status: 400 });
        }
        await ActivityTracker.trackJournalingEntry(userId, journalType);
        console.log('[Challenge Track] Journaling tracked successfully');
        break;

      default:
        return NextResponse.json({ error: "Invalid activity type" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Activity tracked successfully'
    });

  } catch (error) {
    console.error('[Challenge Track] Error tracking activity:', error);
    return NextResponse.json(
      {
        error: 'Failed to track activity',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
