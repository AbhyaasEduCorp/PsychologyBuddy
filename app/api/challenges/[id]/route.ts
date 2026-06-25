import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/src/middleware/permission.middleware';
import prisma from '@/src/prisma';

// GET - Get single challenge by ID
export const GET = withPermission({
  module: 'CHALLENGES',
  action: 'VIEW',
})(async (req: NextRequest, context: any) => {
  try {
    const { params } = context;
    const { id } = await params;
    
    console.log('[API] GET /api/challenges/[id] - ID:', id);

    if (!id) {
      console.error('[API] Challenge ID is missing from params');
      return NextResponse.json(
        { success: false, message: 'Challenge ID is required' },
        { status: 400 }
      );
    }

    const { user } = context;
    let challenge;

    console.log('[API] User role:', user.role.name);
    console.log('[API] User schoolId:', user.schoolId);

    // Check user role and schoolId to determine scope
    if (user.role.name === 'SUPER_ADMIN' || user.role.name === 'SUPERADMIN') {
      console.log('[API] Fetching as SUPER_ADMIN/SUPERADMIN - any school');
      // Super Admin can see any challenge from any school
      challenge = await prisma.challenge.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              firstName: true,
              lastName: true,
              role: {
                select: {
                  name: true,
                }
              }
            }
          },
          school: {
            select: {
              name: true,
            }
          },
          userChallenges: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  classRef: {
                    select: {
                      grade: true,
                      section: true,
                    }
                  }
                }
              }
            },
            orderBy: {
              startedAt: 'desc'
            }
          }
        }
      });
    } else if (user.role.name === 'SCHOOL_SUPERADMIN' || user.role.name === 'ADMIN' || user.role.name === 'COUNSELOR') {
      // School Super Admin, Regular Admin, and Counselor can only see challenges from their school
      console.log('[API] Fetching as school-level admin/counselor - schoolId:', user.schoolId);
      challenge = await prisma.challenge.findUnique({
        where: {
          id,
          schoolId: user.schoolId
        },
        include: {
          creator: {
            select: {
              firstName: true,
              lastName: true,
              role: {
                select: {
                  name: true,
                }
              }
            }
          },
          school: {
            select: {
              name: true,
            }
          },
          userChallenges: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  classRef: {
                    select: {
                      grade: true,
                      section: true,
                    }
                  }
                }
              }
            },
            orderBy: {
              startedAt: 'desc'
            }
          }
        }
      });
    } else {
      // Other roles (should not reach here due to permission check)
      console.log('[API] User role not recognized for challenge fetch');
      challenge = null;
    }

    console.log('[API] Challenge found:', !!challenge);
    
    if (!challenge) {
      console.error('[API] Challenge not found for ID:', id, '- Role:', user.role.name, '- SchoolId:', user.schoolId);
      return NextResponse.json(
        { success: false, message: 'Challenge not found' },
        { status: 404 }
      );
    }

    const formattedChallenge = {
      id: challenge.id,
      name: challenge.name,
      description: challenge.description,
      startsAt: challenge.startsAt,
      endsAt: challenge.endsAt,
      instructions: challenge.instructions,
      category: challenge.category,
      isActive: challenge.isActive,
      requiresMeditation: challenge.requiresMeditation,
      requiresMusic: challenge.requiresMusic,
      requiresPsychoeducation: challenge.requiresPsychoeducation,
      requiresJournaling: challenge.requiresJournaling,
      createdBy: `${challenge.creator.firstName} ${challenge.creator.lastName}`,
      creatorRole: challenge.creator.role.name,
      schoolName: challenge.school?.name || 'Unknown School',
      participantCount: challenge.userChallenges.length,
      participants: challenge.userChallenges.map((uc: any) => ({
        id: uc.id,
        userId: uc.userId,
        userName: `${uc.user.firstName} ${uc.user.lastName}`,
        userClass: uc.user.classRef 
          ? `Class ${uc.user.classRef.grade}-${uc.user.classRef.section}`
          : 'N/A',
        status: uc.status,
        startedAt: uc.startedAt,
        completedAt: uc.completedAt,
      })),
      createdAt: challenge.createdAt,
      updatedAt: challenge.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: formattedChallenge,
      message: 'Challenge retrieved successfully',
    });
  } catch (error: any) {
    console.error('Error fetching challenge:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch challenge' },
      { status: 500 }
    );
  }
});

// DELETE - Delete a challenge
export const DELETE = withPermission({
  module: 'CHALLENGES',
  action: 'DELETE',
})(async (req: NextRequest, context: any) => {
  try {
    const { params } = context;
    const { id } = await params;

    console.log('[API] DELETE /api/challenges/[id] - ID:', id);

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Challenge ID is required' },
        { status: 400 }
      );
    }

    const { user } = context;

    // First, check if challenge exists and user has permission
    let challenge;
    
    if (user.role.name === 'SUPER_ADMIN' || user.role.name === 'SUPERADMIN') {
      // Super Admin can delete any challenge
      challenge = await prisma.challenge.findUnique({
        where: { id },
      });
    } else {
      // Other admins/counselors can only delete challenges from their school
      challenge = await prisma.challenge.findUnique({
        where: {
          id,
          schoolId: user.schoolId
        },
      });
    }

    if (!challenge) {
      return NextResponse.json(
        { success: false, message: 'Challenge not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    // Delete related records first (cascade delete)
    await prisma.$transaction([
      // Delete all activity events related to this challenge
      prisma.activityEvent.deleteMany({
        where: { challengeId: id }
      }),
      // Delete all user challenge assignments
      prisma.userChallenge.deleteMany({
        where: { challengeId: id }
      }),
      // Delete all challenge assignments
      prisma.challengeAssignment.deleteMany({
        where: { challengeId: id }
      }),
      // Finally delete the challenge itself
      prisma.challenge.delete({
        where: { id }
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Challenge deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting challenge:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete challenge' },
      { status: 500 }
    );
  }
});
