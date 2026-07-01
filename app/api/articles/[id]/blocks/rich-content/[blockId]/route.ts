import { NextRequest, NextResponse } from 'next/server';
import { RichContentBlockController } from '@/src/server/content/library/rich-content-block.controller';

// PUT /api/articles/[id]/blocks/rich-content/[blockId] - Update rich content block
export const PUT = RichContentBlockController.updateBlock;

// DELETE /api/articles/[id]/blocks/rich-content/[blockId] - Delete rich content block
export const DELETE = RichContentBlockController.deleteBlock;
