import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/src/middleware/permission.middleware';
import prisma from '@/src/prisma';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  studentName: string;
  studentId: string;
  className: string;
  challengeName: string;
  challengeId: string;
  status: string;
  duration: string;
  timestamp: string;
}

export const GET = withPermission({
  module: 'CHALLENGES',
  action: 'VIEW',
})(async (req: NextRequest, { user }: any) => {
  try {
    console.log('Fetching challenge activity for counselor:', user.id, 'schoolId:', user.schoolId);

    // Get recent challenge activities from the user's school
    const activities = await prisma.userChallenge.findMany({
      where: {
        challenge: {
          schoolId: user.schoolId
        },
        OR: [
          { status: 'COMPLETED' },
          { status: 'EXPIRED' }
        ]
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            studentId: true,
            classRef: {
              select: {
                grade: true,
                section: true
              }
            }
          }
        },
        challenge: {
          select: {
            id: true,
            name: true,
            startsAt: true,
            endsAt: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 50
    });

    const formattedActivities: ActivityItem[] = activities.map(activity => {
      const startDate = new Date(activity.challenge.startsAt);
      const endDate = new Date(activity.challenge.endsAt);
      const completedDate = activity.completedAt || activity.updatedAt;
      
      // Calculate duration from start to completion/expiry
      const startedAtTime = activity.startedAt?.getTime() ?? startDate.getTime();
      const durationMs = completedDate.getTime() - startedAtTime;
      const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));

      return {
        id: activity.id,
        studentName: `${activity.user.firstName} ${activity.user.lastName}`,
        studentId: activity.user.studentId || 'N/A',
        className: activity.user.classRef 
          ? `Class ${activity.user.classRef.grade}-${activity.user.classRef.section}`
          : 'N/A',
        challengeName: activity.challenge.name,
        challengeId: activity.challenge.id,
        status: activity.status,
        duration: `${durationDays} day${durationDays !== 1 ? 's' : ''}`,
        timestamp: completedDate.toISOString()
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedActivities,
      message: 'Challenge activity retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error fetching challenge activity:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch challenge activity' },
      { status: 500 }
    );
  }
});
