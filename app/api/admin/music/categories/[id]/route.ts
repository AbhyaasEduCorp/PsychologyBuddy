import { NextRequest, NextResponse } from "next/server";
import {
  getMusicCategoryById,
  updateMusicCategory,
  deleteMusicCategory,
} from "@/src/server/controllers/music.admin.controller";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  url.searchParams.set('id', id);
  const newReq = new NextRequest(url.toString(), request);
  return await getMusicCategoryById(newReq);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  const url = new URL(request.url);
  url.searchParams.set('id', id);
  const newReq = new NextRequest(url.toString(), { method: 'PATCH', body, headers: request.headers });
  return await updateMusicCategory(newReq);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  url.searchParams.set('id', id);
  const newReq = new NextRequest(url.toString(), request);
  return await deleteMusicCategory(newReq);
}
