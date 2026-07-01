import { NextRequest } from 'next/server';
import { MeditationMoodsController } from '@/src/server/controllers/meditation.moods.controller';

// DELETE /api/admin/meditation/moods/[id] - Delete meditation mood
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return await MeditationMoodsController.deleteMeditationMood(request, { params });
}
