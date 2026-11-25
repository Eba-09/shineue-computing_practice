// Data access. Uses Supabase when SUPABASE_URL is set; otherwise a local JSON file
// (.data/db.json) so the site can be tried on a laptop without any setup.
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const useSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

let sb = null;
function supa() {
  if (!sb) {
    sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return sb;
}

async function q(promise) {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return data;
}

/* ---------- local file store ---------- */
const FILE = path.join(process.cwd(), '.data', 'db.json');
const EMPTY = { classes: [], students: [], lesson_links: [], progress: [], attempts: [] };

function load() {
  try {
    return { ...EMPTY, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) };
  } catch {
    return structuredClone(EMPTY);
  }
}
function save(db) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(db, null, 1));
}
const now = () => new Date().toISOString();
const byName = (a, b) => a.name.localeCompare(b.name, 'mn');

/* ---------- classes ---------- */
export async function listClasses() {
  if (useSupabase) return q(supa().from('classes').select('*').order('grade').order('name'));
  return load().classes.sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name));
}

export async function getClass(id) {
  if (useSupabase) return q(supa().from('classes').select('*').eq('id', id).maybeSingle());
  return load().classes.find((c) => c.id === id) || null;
}

export async function createClass({ name, grade }) {
  const row = { name: name.trim(), grade: Number(grade), mode: 'auto', lesson_ids: [], show_answers: false };
  if (useSupabase) return q(supa().from('classes').insert(row).select().single());
  const db = load();
  const r = { id: crypto.randomUUID(), ...row, created_at: now() };
  db.classes.push(r);
  save(db);
  return r;
}

export async function updateClass(id, patch) {
  if (useSupabase) return q(supa().from('classes').update(patch).eq('id', id));
  const db = load();
  const c = db.classes.find((x) => x.id === id);
  if (c) Object.assign(c, patch);
  save(db);
}

export async function deleteClass(id) {
  if (useSupabase) return q(supa().from('classes').delete().eq('id', id));
  const db = load();
  const ids = new Set(db.students.filter((s) => s.class_id === id).map((s) => s.id));
  db.classes = db.classes.filter((c) => c.id !== id);
  db.students = db.students.filter((s) => s.class_id !== id);
  db.progress = db.progress.filter((p) => !ids.has(p.student_id));
  db.attempts = db.attempts.filter((p) => !ids.has(p.student_id));
  save(db);
}

/* ---------- students ---------- */
export async function listStudents(classId) {
  if (useSupabase) return q(supa().from('students').select('*').eq('class_id', classId).order('name'));
  return load().students.filter((s) => s.class_id === classId).sort(byName);
}

export async function getStudent(id) {
  if (useSupabase) return q(supa().from('students').select('*').eq('id', id).maybeSingle());
  return load().students.find((s) => s.id === id) || null;
}

export async function addStudents(rows) {
  if (!rows.length) return [];
  if (useSupabase) return q(supa().from('students').insert(rows).select());
  const db = load();
  const out = rows.map((r) => ({ id: crypto.randomUUID(), created_at: now(), ...r }));
  db.students.push(...out);
  save(db);
  return out;
}

export async function updateStudent(id, patch) {
  if (useSupabase) return q(supa().from('students').update(patch).eq('id', id));
  const db = load();
  const s = db.students.find((x) => x.id === id);
  if (s) Object.assign(s, patch);
  save(db);
}

export async function deleteStudent(id) {
  if (useSupabase) return q(supa().from('students').delete().eq('id', id));
  const db = load();
  db.students = db.students.filter((s) => s.id !== id);
  db.progress = db.progress.filter((p) => p.student_id !== id);
  db.attempts = db.attempts.filter((p) => p.student_id !== id);
  save(db);
}

/* ---------- slide links ---------- */
export async function getLessonLinks() {
  const rows = useSupabase
    ? await q(supa().from('lesson_links').select('*'))
    : load().lesson_links;
  return Object.fromEntries(rows.map((r) => [r.lesson_id, r.slide_url]));
}

export async function setLessonLink(lessonId, url) {
  const clean = (url || '').trim();
  if (useSupabase) {
    if (!clean) return q(supa().from('lesson_links').delete().eq('lesson_id', lessonId));
    return q(supa().from('lesson_links').upsert({ lesson_id: lessonId, slide_url: clean, updated_at: now() }));
  }
  const db = load();
  db.lesson_links = db.lesson_links.filter((r) => r.lesson_id !== lessonId);
  if (clean) db.lesson_links.push({ lesson_id: lessonId, slide_url: clean, updated_at: now() });
  save(db);
}

/* ---------- progress & attempts ---------- */
export async function getProgress(studentId, lessonId) {
  if (useSupabase)
    return q(supa().from('progress').select('*').eq('student_id', studentId).eq('lesson_id', lessonId));
  return load().progress.filter((p) => p.student_id === studentId && p.lesson_id === lessonId);
}

export async function getProgressFor(lessonId, studentIds) {
  if (!studentIds.length) return [];
  if (useSupabase)
    return q(supa().from('progress').select('*').eq('lesson_id', lessonId).in('student_id', studentIds));
  const set = new Set(studentIds);
  return load().progress.filter((p) => p.lesson_id === lessonId && set.has(p.student_id));
}

export async function upsertProgress(row) {
  if (useSupabase)
    return q(supa().from('progress').upsert(row, { onConflict: 'student_id,lesson_id,exercise_id' }));
  const db = load();
  const i = db.progress.findIndex(
    (p) => p.student_id === row.student_id && p.lesson_id === row.lesson_id && p.exercise_id === row.exercise_id
  );
  if (i >= 0) db.progress[i] = { ...db.progress[i], ...row };
  else db.progress.push(row);
  save(db);
}

export async function addAttempt(row) {
  const r = { ...row, created_at: now() };
  if (useSupabase) return q(supa().from('attempts').insert(r));
  const db = load();
  db.attempts.push({ id: db.attempts.length + 1, ...r });
  save(db);
}

export async function getAttemptsFor(lessonId, studentIds) {
  if (!studentIds.length) return [];
  if (useSupabase)
    return q(
      supa()
        .from('attempts')
        .select('*')
        .eq('lesson_id', lessonId)
        .in('student_id', studentIds)
        .order('created_at')
    );
  const set = new Set(studentIds);
  return load().attempts.filter((p) => p.lesson_id === lessonId && set.has(p.student_id));
}

export async function resetProgress(studentId, lessonId) {
  if (useSupabase) {
    await q(supa().from('progress').delete().eq('student_id', studentId).eq('lesson_id', lessonId));
    return q(supa().from('attempts').delete().eq('student_id', studentId).eq('lesson_id', lessonId));
  }
  const db = load();
  db.progress = db.progress.filter((p) => !(p.student_id === studentId && p.lesson_id === lessonId));
  db.attempts = db.attempts.filter((p) => !(p.student_id === studentId && p.lesson_id === lessonId));
  save(db);
}

export const backendName = useSupabase ? 'Supabase' : 'local file (.data/db.json)';
