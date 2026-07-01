import { NextRequest, NextResponse } from "next/server";
import {
  getMeditationGoalById,
  updateMeditationGoal,
  deleteMeditationGoal,
} from "@/src/server/controllers/meditation.admin.controller";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  url.searchParams.set('id', id);
  return await getMeditationGoalById(new NextRequest(url.toString(), request));
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  const url = new URL(request.url);
  url.searchParams.set('id', id);
  return await updateMeditationGoal(new NextRequest(url.toString(), { method: 'PUT', body, headers: request.headers }));
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  url.searchParams.set('id', id);
  return await deleteMeditationGoal(new NextRequest(url.toString(), request));
}
