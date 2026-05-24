import { NextRequest } from 'next/server';
import { getGoals, addGoal, deleteGoal } from '@/lib/db';

export async function GET() {
  return Response.json({ goals: getGoals() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = (body.name as string)?.trim();
  if (!name) return Response.json({ error: 'name is required' }, { status: 400 });
  addGoal(name);
  return Response.json({ goals: getGoals() }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get('id'));
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
  deleteGoal(id);
  return Response.json({ goals: getGoals() });
}
