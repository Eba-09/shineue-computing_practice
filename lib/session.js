import crypto from 'crypto';
import { cookies } from 'next/headers';

const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const STUDENT = 'cp_s';
const TEACHER = 'cp_t';

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${mac}`;
}

function verify(token) {
  if (!token || !token.includes('.')) return null;
  const [body, mac] = token.split('.');
  const expect = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (mac.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expect))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (data.exp && Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

const opts = (maxAge) => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false',
  path: '/',
  maxAge,
});

export function setStudentSession(student) {
  const hours = 10;
  cookies().set(
    STUDENT,
    sign({ id: student.id, classId: student.class_id, name: student.name, exp: Date.now() + hours * 3600e3 }),
    opts(hours * 3600)
  );
}

export function getStudentSession() {
  return verify(cookies().get(STUDENT)?.value);
}

export function clearStudentSession() {
  cookies().delete(STUDENT);
}

export function setTeacherSession() {
  const days = 14;
  cookies().set(TEACHER, sign({ t: 1, exp: Date.now() + days * 86400e3 }), opts(days * 86400));
}

export function isTeacher() {
  return !!verify(cookies().get(TEACHER)?.value);
}

export function clearTeacherSession() {
  cookies().delete(TEACHER);
}

export function checkTeacherPassword(pw) {
  const real = process.env.TEACHER_PASSWORD || 'teacher';
  const a = Buffer.from(String(pw || ''));
  const b = Buffer.from(real);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
