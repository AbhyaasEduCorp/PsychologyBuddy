import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/src/middleware/permission.middleware';
import prisma from '@/src/prisma';

export const GET = withPermission({
  module: 'USER_MANAGEMENT',
  action: 'VIEW',
})(async (req: NextRequest, { user }: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    console.log('Student search request:', { query, queryLength: query.length });

    if (!query || query.trim().length < 2) {
      console.log('Query too short:', query);
      return NextResponse.json(
        { success: false, error: 'Search query must be at least 2 characters', message: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    console.log('Searching students:', { query, userRole: user.role.name, schoolId: user.schoolId });

    const searchTerm = query.trim();

    // Build where clause - simple and straightforward
    const students = await prisma.user.findMany({
      where: {
        AND: [
          // Must be a student
          {
            role: {
              name: 'STUDENT'
            }
          },
          // Apply school filtering for non-superadmins
          ...(user.role.name !== 'SUPERADMIN' ? [{
            schoolId: user.schoolId
          }] : []),
          // Search by name or student ID
          {
            OR: [
              {
                firstName: {
                  contains: searchTerm,
                  mode: 'insensitive' as any
                }
              },
              {
                lastName: {
                  contains: searchTerm,
                  mode: 'insensitive' as any
                }
              },
              {
                studentId: {
                  contains: searchTerm,
                  mode: 'insensitive' as any
                }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentId: true,
        schoolId: true,
        classRef: {
          select: {
            grade: true,
            section: true
          }
        },
        school: {
          select: {
            name: true
          }
        }
      },
      take: 10,
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    const formattedStudents = students.map(student => ({
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      studentId: student.studentId || 'N/A',
      class: student.classRef?.grade?.toString() || null,
      section: student.classRef?.section || null,
      schoolName: student.school?.name || null
    }));

    console.log('Found students:', formattedStudents.length);

    return NextResponse.json(formattedStudents);
  } catch (error: any) {
    console.error('Error searching students:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search students', 
        message: 'Failed to search students',
        details: error.message 
      },
      { status: 500 }
    );
  }
});
