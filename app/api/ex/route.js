import { NextResponse } from 'next/server';
import { getStudentSession } from '@/lib/session';
import { getClass, getProgress, upsertProgress, addAttempt, getAttemptsFor } from '@/lib/db';
import { getExerciseSet, currentLessons } from '@/lib/lessons';
import { findExercise, isBonus } from '@/lib/exercises';
import { checkAnswer, answerText } from '@/lib/check';
import { effectiveStatus, studentResult } from '@/lib/results';

export const dynamic = 'force-dynamic';

const bad = (msg, status = 400) => NextResponse.json({ error: msg }, { status });

async function context(body) {
  const s = getStudentSession();
  if (!s) return { error: bad('Нэвтрээгүй байна', 401) };
  const cls = await getClass(s.classId);
  if (!cls) return { error: bad('Анги олдсонгүй', 404) };
  const allowed = currentLessons(cls).some((l) => l.id === body.lessonId);
  if (!allowed) return { error: bad('Энэ хичээл одоо нээлттэй биш байна', 403) };
  const set = getExerciseSet(body.lessonId);
  if (!set) return { error: bad('Дасгал олдсонгүй', 404) };
  return { s, cls, set };
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const ctx = await context(body);
  if (ctx.error) return ctx.error;
  const { s, cls, set } = ctx;
  const { lessonId, exerciseId, action } = body;

  if (action === 'result') {
    const prog = await getProgress(s.id, lessonId);
    const att = await getAttemptsFor(lessonId, [s.id]);
    const r = studentResult(set, prog, att);
    if (cls.show_answers) {
      const all = [...set.exercises, ...(set.bonus || [])];
      r.rows.forEach((row) => (row.solution = all.find((e) => e.id === row.id)?.solution || null));
    }
    return NextResponse.json(r);
  }

  const ex = findExercise(set, exerciseId);
  if (!ex) return bad('Дасгал олдсонгүй', 404);
  const prog = await getProgress(s.id, lessonId);
  const p = prog.find((r) => r.exercise_id === ex.id);
  const nowMs = Date.now();

  if (action === 'start') {
    if (isBonus(set, ex.id)) {
      const mainDone = set.exercises.every((m) => {
        const st = effectiveStatus(prog.find((r) => r.exercise_id === m.id), m, nowMs);
        return st === 'solved' || st === 'timeout';
      });
      if (!mainDone) return bad('Эхлээд үндсэн дасгалуудаа дуусга', 403);
    }
    let row = p;
    if (!row) {
      row = { student_id: s.id, lesson_id: lessonId, exercise_id: ex.id, started_at: new Date(nowMs).toISOString(), status: 'open', attempts: 0 };
      await upsertProgress(row);
    }
    return NextResponse.json({
      startedAt: row.started_at,
      serverNow: nowMs,
      status: effectiveStatus(row, ex, nowMs),
      attempts: row.attempts,
    });
  }

  if (!p) return bad('Дасгал эхлээгүй байна');
  const status = effectiveStatus(p, ex, nowMs);

  if (action === 'timeout') {
    if (status === 'open') {
      // the browser timer may run slightly ahead; accept it if we are within the last few seconds
      const deadline = new Date(p.started_at).getTime() + ex.seconds * 1000;
      if (nowMs < deadline - 3000) return NextResponse.json({ status: 'open' });
    }
    if (p.status === 'open') await upsertProgress({ ...p, status: 'timeout', finished_at: new Date(nowMs).toISOString() });
    return NextResponse.json({ status: p.status === 'solved' ? 'solved' : 'timeout' });
  }

  if (action === 'submit') {
    if (status === 'solved') return NextResponse.json({ correct: true, status: 'solved', attempts: p.attempts });
    if (status === 'timeout') {
      if (p.status === 'open') await upsertProgress({ ...p, status: 'timeout', finished_at: new Date(nowMs).toISOString() });
      return NextResponse.json({ correct: false, status: 'timeout', attempts: p.attempts });
    }
    const correct = checkAnswer(ex, body.answer);
    const attempts = (p.attempts || 0) + 1;
    await addAttempt({ student_id: s.id, lesson_id: lessonId, exercise_id: ex.id, answer: answerText(ex, body.answer).slice(0, 2000), correct });
    await upsertProgress({
      ...p,
      attempts,
      status: correct ? 'solved' : 'open',
      finished_at: correct ? new Date(nowMs).toISOString() : null,
    });
    return NextResponse.json({ correct, status: correct ? 'solved' : 'open', attempts, hint: correct ? null : ex.hint || null });
  }

  return bad('Unknown action');
}
