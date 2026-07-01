import { NextRequest, NextResponse } from 'next/server';
import { RichContentBlockService } from './rich-content-block.service';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';

export class RichContentBlockController {
  // GET /api/articles/[id]/blocks/rich-content - Get rich content blocks
  static getBlocks = withPermission({
    module: 'PSYCHO_EDUCATION',
    action: 'VIEW'
  })(async (req: NextRequest, { params }: any) => {
    try {
      const { id } = await params;
      const result = await RichContentBlockService.getBlocks(id);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Get rich content blocks error:', error);
      const errorResponse = handleError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  });

  // POST /api/articles/[id]/blocks/rich-content - Add rich content block
  static addBlock = withPermission({
    module: 'PSYCHO_EDUCATION',
    action: 'CREATE'
  })(async (req: NextRequest, { params }: any) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const result = await RichContentBlockService.addBlock(id, body);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Add rich content block error:', error);
      const errorResponse = handleError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  });

  // PUT /api/articles/[id]/blocks/rich-content/[blockId] - Update rich content block
  static updateBlock = withPermission({
    module: 'PSYCHO_EDUCATION',
    action: 'UPDATE'
  })(async (req: NextRequest, { params }: any) => {
    try {
      const { blockId } = await params;
      const body = await req.json();
      const result = await RichContentBlockService.updateBlock(blockId, body);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Update rich content block error:', error);
      const errorResponse = handleError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  });

  // DELETE /api/articles/[id]/blocks/rich-content/[blockId] - Delete rich content block
  static deleteBlock = withPermission({
    module: 'PSYCHO_EDUCATION',
    action: 'DELETE'
  })(async (req: NextRequest, { params }: any) => {
    try {
      const { blockId } = await params;
      const result = await RichContentBlockService.deleteBlock(blockId);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Delete rich content block error:', error);
      const errorResponse = handleError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  });
}
