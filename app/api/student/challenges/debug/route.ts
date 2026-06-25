import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/src/utils/session-helper";
import prisma from "@/src/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'challenges.view');

    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;

    // Get all UserChallenge records for this user
    const userChallenges = await prisma.userChallenge.findMany({
      where: {
        userId
      },
      include: {
        challenge: true
      }
    });

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentId: true,
        schoolId: true
      }
    });

    return NextResponse.json({
      success: true,
      user,
      userChallenges: userChallenges.map(uc => ({
        id: uc.id,
        status: uc.status,
        assignedAt: uc.assignedAt,
        startedAt: uc.startedAt,
        completedAt: uc.completedAt,
        progressPercentage: uc.progressPercentage,
        currentProgress: uc.currentProgress,
        challenge: {
          id: uc.challenge.id,
          name: uc.challenge.name,
          moduleType: uc.challenge.moduleType,
          challengeType: uc.challenge.challengeType,
          isActive: uc.challenge.isActive,
          startsAt: uc.challenge.startsAt,
          endsAt: uc.challenge.endsAt
        }
      })),
      totalCount: userChallenges.length
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch debug info',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
