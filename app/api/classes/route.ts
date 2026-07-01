import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/src/middleware/permission.middleware';
import prisma from '@/src/prisma';

export const GET = withPermission({
  module: 'USER_MANAGEMENT',
  action: 'VIEW',
})(async (req: NextRequest, { user }: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get('grade');
    const section = searchParams.get('section');

    let whereClause: any = {};

    // Apply school filtering for non-superadmins
    if (user.role.name !== 'SUPERADMIN') {
      whereClause.schoolId = user.schoolId;
    }

    // Add grade and section filters if provided
    if (grade) {
      whereClause.grade = parseInt(grade);
    }
    if (section) {
      whereClause.section = section;
    }

    const classes = await prisma.class.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        grade: true,
        section: true,
        schoolId: true
      },
      orderBy: [
        { grade: 'asc' },
        { section: 'asc' }
      ]
    });

    return NextResponse.json(classes);
  } catch (error: any) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch classes', details: error.message },
      { status: 500 }
    );
  }
});

export const POST = withPermission({
  module: 'USER_MANAGEMENT',
  action: 'CREATE',
})(async (req: NextRequest, { user }: any) => {
  try {
    const body = await req.json();
    const { name, grade, section, schoolId } = body;

    if (!name || grade === undefined || !schoolId) {
      return NextResponse.json(
        { success: false, message: 'name, grade, and schoolId are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.class.findFirst({
      where: { name, grade: parseInt(grade), section: section ?? null, schoolId },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Class already exists',
        data: existing,
      });
    }

    const created = await prisma.class.create({
      data: { name, grade: parseInt(grade), section: section ?? null, schoolId },
    });

    return NextResponse.json({
      success: true,
      message: 'Class created',
      data: created,
    });
  } catch (error: any) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create class', details: error.message },
      { status: 500 }
    );
  }
});
