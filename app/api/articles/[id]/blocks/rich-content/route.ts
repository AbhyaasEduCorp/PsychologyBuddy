import { NextRequest, NextResponse } from 'next/server';
import { RichContentBlockController } from '@/src/server/content/library/rich-content-block.controller';

// GET /api/articles/[id]/blocks/rich-content - Get rich content blocks
export const GET = RichContentBlockController.getBlocks;

// POST /api/articles/[id]/blocks/rich-content - Add rich content block
export const POST = RichContentBlockController.addBlock;
