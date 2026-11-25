'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import * as db from '@/lib/db';
import {
  setStudentSession,
  clearStudentSession,
  setTeacherSession,
  clearTeacherSession,
  isTeacher,
  checkTeacherPassword,
} from '@/lib/session';

/* ---------------- students ---------------- */

const tries = new Map(); // simple brute-force brake per student, per server instance

export async function studentLogin(prev, form) {
  const studentId = form.get('studentId');
  const pin = String(form.get('pin') || '').trim();
  const st = await db.getStudent(studentId);
  if (!st) return { error: 'Сурагч олдсонгүй.' };
  const t = tries.get(studentId) || { n: 0, until: 0 };
  if (Date.now() < t.until) return { error: 'Олон удаа буруу орууллаа. 1 минут хүлээгээд дахин оролд.' };
  if (st.pin !== pin) {
    t.n += 1;
    if (t.n >= 5) Object.assign(t, { n: 0, until: Date.now() + 60_000 });
    tries.set(studentId, t);
    return { error: 'PIN буруу байна.' };
  }
  tries.delete(studentId);
  setStudentSession(st);
  redirect('/learn');
}

export async function studentLogout() {
  clearStudentSession();
  redirect('/');
}

/* ---------------- teacher ---------------- */

export async function teacherLogin(prev, form) {
  if (!checkTeacherPassword(form.get('password'))) return { error: 'Нууц үг буруу.' };
  setTeacherSession();
  redirect('/teacher');
}

export async function teacherLogout() {
  clearTeacherSession();
  redirect('/teacher');
}

function guard() {
  if (!isTeacher()) throw new Error('Not allowed');
}

const randomPin = () => String(crypto.randomInt(0, 10000)).padStart(4, '0');

export async function createClass(form) {
  guard();
  const name = String(form.get('name') || '').trim();
  const grade = Number(form.get('grade'));
  if (!name || !grade) return;
  await db.createClass({ name, grade });
  revalidatePath('/teacher/setup');
}

export async function deleteClass(form) {
  guard();
  await db.deleteClass(form.get('classId'));
  revalidatePath('/teacher/setup');
}

// One student per line. "Name" or "Name, 1234" / "Name<TAB>1234".
export async function addStudents(form) {
  guard();
  const classId = form.get('classId');
  const text = String(form.get('names') || '');
  const existing = new Set((await db.listStudents(classId)).map((s) => s.name.toLowerCase()));
  const rows = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^(.*?)[,;\t]\s*(\d{4})$/);
      return m ? { name: m[1].trim(), pin: m[2] } : { name: l, pin: randomPin() };
    })
    .filter((r) => r.name && !existing.has(r.name.toLowerCase()))
    .map((r) => ({ ...r, class_id: classId }));
  await db.addStudents(rows);
  revalidatePath('/teacher/setup');
}

export async function deleteStudent(form) {
  guard();
  await db.deleteStudent(form.get('studentId'));
  revalidatePath('/teacher/setup');
}

export async function renewPin(form) {
  guard();
  await db.updateStudent(form.get('studentId'), { pin: randomPin() });
  revalidatePath('/teacher/setup');
}

export async function setLessonLink(form) {
  guard();
  await db.setLessonLink(form.get('lessonId'), form.get('url'));
  revalidatePath('/teacher/lessons');
}

export async function setClassMode(form) {
  guard();
  const classId = form.get('classId');
  const mode = form.get('mode') === 'manual' ? 'manual' : 'auto';
  const lessonIds = form.getAll('lessonIds').map(String).filter(Boolean);
  await db.updateClass(classId, { mode, lesson_ids: lessonIds });
  revalidatePath('/teacher/lessons');
  revalidatePath('/teacher');
}

export async function toggleShowAnswers(form) {
  guard();
  await db.updateClass(form.get('classId'), { show_answers: form.get('value') === '1' });
  revalidatePath('/teacher');
}

export async function resetStudentLesson(form) {
  guard();
  await db.resetProgress(form.get('studentId'), form.get('lessonId'));
  revalidatePath('/teacher');
}
