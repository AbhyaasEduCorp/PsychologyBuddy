import { NextRequest, NextResponse } from 'next/server';
import { LinkBlockService } from '@/src/server/content/library/link-block.service';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';

// PUT /api/articles/[id]/blocks/links/[blockId] - Update link block
export const PUT = withPermission({
  module: 'PSYCHO_EDUCATION',
  action: 'UPDATE'
})(async (req: NextRequest, { params }: any) => {
  try {
    const { blockId } = await params;
    const body = await req.json();
    const result = await LinkBlockService.updateLinkBlock(blockId, body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Update link block error:', error);
    const errorResponse = handleError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});

// DELETE /api/articles/[id]/blocks/links/[blockId] - Delete link block
export const DELETE = withPermission({
  module: 'PSYCHO_EDUCATION',
  action: 'DELETE'
})(async (req: NextRequest, { params }: any) => {
  try {
    const { blockId } = await params;
    const result = await LinkBlockService.deleteLinkBlock(blockId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Delete link block error:', error);
    const errorResponse = handleError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
