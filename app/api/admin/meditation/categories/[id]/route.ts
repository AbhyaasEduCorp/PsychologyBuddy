import { NextRequest, NextResponse } from "next/server";
import {
  getMeditationCategoryById,
  updateMeditationCategory,
  deleteMeditationCategory,
} from "@/src/server/controllers/meditation.admin.controller";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  url.searchParams.set('id', id);
  const newReq = new NextRequest(url.toString(), request);
  return await getMeditationCategoryById(newReq);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  const url = new URL(request.url);
  url.searchParams.set('id', id);
  const newReq = new NextRequest(url.toString(), { method: 'PUT', body, headers: request.headers });
  return await updateMeditationCategory(newReq);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  url.searchParams.set('id', id);
  const newReq = new NextRequest(url.toString(), request);
  return await deleteMeditationCategory(newReq);
}
