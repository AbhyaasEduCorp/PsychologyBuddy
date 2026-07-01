import { NextRequest, NextResponse } from "next/server";
import {
  getMusicGoalById,
  updateMusicGoal,
  deleteMusicGoal,
} from "@/src/server/controllers/music.admin.controller";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  url.searchParams.set('id', id);
  return await getMusicGoalById(new NextRequest(url.toString(), request));
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  const url = new URL(request.url);
  url.searchParams.set('id', id);
  return await updateMusicGoal(new NextRequest(url.toString(), { method: 'PATCH', body, headers: request.headers }));
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  url.searchParams.set('id', id);
  return await deleteMusicGoal(new NextRequest(url.toString(), request));
}
