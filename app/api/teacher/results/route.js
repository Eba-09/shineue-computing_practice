import { NextResponse } from 'next/server';
import { isTeacher } from '@/lib/session';
import { listStudents, getProgressFor, getAttemptsFor } from '@/lib/db';
import { getExerciseSet } from '@/lib/lessons';
import { classResults } from '@/lib/results';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  if (!isTeacher()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('classId');
  const lessonId = searchParams.get('lessonId');
  const set = getExerciseSet(lessonId);
  if (!set) return NextResponse.json({ error: 'no exercises' }, { status: 404 });
  const students = await listStudents(classId);
  const ids = students.map((s) => s.id);
  const [prog, att] = await Promise.all([getProgressFor(lessonId, ids), getAttemptsFor(lessonId, ids)]);
  const res = classResults(set, students, prog, att);
  // attach full attempt history for the drawer
  res.attempts = att.map((a) => ({ s: a.student_id, e: a.exercise_id, a: a.answer, ok: a.correct, t: a.created_at }));
  return NextResponse.json(res);
}
