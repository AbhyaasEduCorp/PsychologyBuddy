import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/src/lib/database/database-service";
import { getSession } from "@/src/utils/session-helper";
import { handleError } from "@/src/utils/errors";

export async function GET(req: NextRequest) {
  try {
    // Get session without requiring specific permission - students can always check their own status
    const session = await getSession(req);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const userId = session.userId;
    
    // Get today's mood checkin for the user
    const moodCheckin = await DatabaseService.getTodayMoodCheckin(userId);

    return NextResponse.json({
      success: true,
      data: {
        hasCheckin: !!moodCheckin,
        moodCheckin: moodCheckin ? {
          id: moodCheckin.id,
          mood: moodCheckin.mood,
          notes: moodCheckin.notes,
          createdAt: moodCheckin.createdAt
        } : null
      }
    });
  } catch (err) {
    const errorResponse = handleError(err);
    return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
}

