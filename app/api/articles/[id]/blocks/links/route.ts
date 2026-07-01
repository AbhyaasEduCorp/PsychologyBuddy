import { NextRequest, NextResponse } from 'next/server';
import { LinkBlockService } from '@/src/server/content/library/link-block.service';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';

// GET /api/articles/[id]/blocks/links - Get link blocks (Admin & SuperAdmin)
export const GET = withPermission({
  module: 'PSYCHO_EDUCATION',
  action: 'VIEW'
})(async (req: NextRequest, { params }: any) => {
  try {
    const { id } = await params;
    const result = await LinkBlockService.getLinkBlocks(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Get link blocks error:', error);
    const errorResponse = handleError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});

// POST /api/articles/[id]/blocks/links - Add link block (Admin & SuperAdmin)
export const POST = withPermission({
  module: 'PSYCHO_EDUCATION',
  action: 'CREATE'
})(async (req: NextRequest, { params }: any) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const result = await LinkBlockService.createLinkBlock(id, body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Create link block error:', error);
    const errorResponse = handleError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
