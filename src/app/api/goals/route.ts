import { NextRequest } from 'next/server';
import { getGoals, addGoal, deleteGoal } from '@/lib/db';

export async function GET() {
  const goals = getGoals();
  return Response.json({ goals });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = (body.name as string)?.trim();

  if (!name) {
    return Response.json({ error: 'name is required' }, { status: 400 });
  }

  const id = addGoal(name);
  return Response.json({ goal: { id, name } }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get('id'));

  if (!id) {
    return Response.json({ error: 'id is required' }, { status: 400 });
  }

  deleteGoal(id);
  return Response.json({ ok: true });
}
