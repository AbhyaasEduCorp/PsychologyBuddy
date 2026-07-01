import { prisma } from './prisma';
import { AuthError } from '@/src/utils/errors';

export interface RichContentItem {
  id: string;
  type: 'heading' | 'subheading' | 'paragraph' | 'bullets' | 'image' | 'link';
  text?: string;
  bullets?: string[];
  src?: string;
  altText?: string;
  url?: string;
  title?: string;
  description?: string;
}

export interface CreateRichContentBlockData {
  items: RichContentItem[];
  order?: number;
}

export interface UpdateRichContentBlockData {
  items?: RichContentItem[];
  order?: number;
}

export class RichContentBlockService {
  // Get all rich content blocks for an article
  static async getBlocks(articleId: string) {
    try {
      const blocks = await prisma.richContentBlock.findMany({
        where: { articleId },
        orderBy: { order: 'asc' },
      });

      return {
        success: true,
        message: 'Rich content blocks retrieved successfully',
        data: blocks,
      };
    } catch (error) {
      console.error('Get rich content blocks error:', error);
      throw new AuthError('Failed to retrieve rich content blocks', 500);
    }
  }

  // Create a new rich content block
  static async addBlock(articleId: string, data: CreateRichContentBlockData) {
    try {
      const lastBlock = await prisma.richContentBlock.findFirst({
        where: { articleId },
        orderBy: { order: 'desc' },
      });

      const order = data.order ?? (lastBlock ? lastBlock.order + 1 : 0);

      const block = await prisma.richContentBlock.create({
        data: {
          articleId,
          items: (data.items || []) as any,
          order,
        },
      });

      return {
        success: true,
        message: 'Rich content block added successfully',
        data: block,
      };
    } catch (error: any) {
      console.error('Add rich content block error:', error);
      throw new AuthError('Failed to add rich content block', 500);
    }
  }

  // Update a rich content block
  static async updateBlock(blockId: string, data: UpdateRichContentBlockData) {
    try {
      const block = await prisma.richContentBlock.update({
        where: { id: blockId },
        data: {
          ...(data.items !== undefined && { items: data.items as any }),
          ...(data.order !== undefined && { order: data.order }),
        },
      });

      return {
        success: true,
        message: 'Rich content block updated successfully',
        data: block,
      };
    } catch (error) {
      console.error('Update rich content block error:', error);
      throw new AuthError('Failed to update rich content block', 500);
    }
  }

  // Delete a rich content block
  static async deleteBlock(blockId: string) {
    try {
      await prisma.richContentBlock.delete({
        where: { id: blockId },
      });

      return {
        success: true,
        message: 'Rich content block deleted successfully',
        data: null,
      };
    } catch (error) {
      console.error('Delete rich content block error:', error);
      throw new AuthError('Failed to delete rich content block', 500);
    }
  }
}
