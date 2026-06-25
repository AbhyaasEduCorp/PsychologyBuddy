import { NextResponse } from "next/server";
import prisma from "@/src/prisma";

/**
 * Admin API: Cleanup Stale Chat Sessions
 * 
 * Marks sessions as inactive if:
 * - They are still marked as active
 * - They started more than 6 hours ago
 * - They have no end time set
 */
export async function POST(req: Request) {
  try {
    console.log('[SessionCleanup] Starting stale session cleanup');
    
    // Calculate cutoff time (6 hours ago)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    
    // Find all stale sessions
    const staleSessions = await prisma.chatSession.findMany({
      where: {
        isActive: true,
        startedAt: {
          lt: sixHoursAgo
        }
      },
      select: {
        id: true,
        startedAt: true,
        userId: true
      }
    });
    
    console.log(`[SessionCleanup] Found ${staleSessions.length} stale sessions`);
    
    if (staleSessions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stale sessions found',
        cleaned: 0
      });
    }
    
    // Mark all stale sessions as inactive
    const updateResult = await prisma.chatSession.updateMany({
      where: {
        id: {
          in: staleSessions.map(s => s.id)
        }
      },
      data: {
        isActive: false,
        endedAt: new Date()
      }
    });
    
    console.log(`[SessionCleanup] Updated ${updateResult.count} sessions`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${updateResult.count} stale sessions`,
      cleaned: updateResult.count,
      sessions: staleSessions.map(s => ({
        id: s.id,
        startedAt: s.startedAt,
        userId: s.userId
      }))
    });
    
  } catch (error) {
    console.error('[SessionCleanup] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to cleanup stale sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint - Check for stale sessions without cleaning them
 */
export async function GET(req: Request) {
  try {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    
    const staleSessions = await prisma.chatSession.findMany({
      where: {
        isActive: true,
        startedAt: {
          lt: sixHoursAgo
        }
      },
      select: {
        id: true,
        startedAt: true,
        userId: true,
        mood: true
      }
    });
    
    return NextResponse.json({
      success: true,
      count: staleSessions.length,
      sessions: staleSessions.map(s => ({
        id: s.id,
        startedAt: s.startedAt,
        age: Math.round((Date.now() - new Date(s.startedAt).getTime()) / 1000 / 60), // age in minutes
        userId: s.userId,
        mood: s.mood
      }))
    });
    
  } catch (error) {
    console.error('[SessionCleanup] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check stale sessions'
      },
      { status: 500 }
    );
  }
}
