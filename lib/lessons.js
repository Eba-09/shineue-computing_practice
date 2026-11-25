import lessons from '@/content/lessons';
import exerciseSets from '@/content/exercises';

export const TZ = 'Asia/Ulaanbaatar';

export function todayStr(d = new Date()) {
  // YYYY-MM-DD in Ulaanbaatar time
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

function addDays(str, n) {
  const d = new Date(str + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function weekRange(str = todayStr()) {
  const d = new Date(str + 'T00:00:00Z');
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  const mon = addDays(str, -dow);
  return { from: mon, to: addDays(mon, 6) };
}

export function getLesson(id) {
  return lessons.find((l) => l.id === id) || null;
}

export function lessonsForGrade(grade) {
  return lessons.filter((l) => l.grade === Number(grade));
}

export function getExerciseSet(lessonId) {
  return exerciseSets[lessonId] || null;
}

export function exerciseCount(lessonId) {
  const s = exerciseSets[lessonId];
  return s ? s.exercises.length : 0;
}

// Lessons a class sees right now: the teacher's manual choice, otherwise this week's dated lessons.
export function currentLessons(cls, today = todayStr()) {
  if (cls.mode === 'manual' && cls.lesson_ids?.length) {
    return cls.lesson_ids.map(getLesson).filter(Boolean);
  }
  const { from, to } = weekRange(today);
  return lessonsForGrade(cls.grade).filter((l) => l.date && l.date >= from && l.date <= to);
}

export function lessonLabel(l) {
  return l.no ? `${l.no}-р хичээл` : 'Нэмэлт хичээл';
}

const MN_MONTHS = ['1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар', '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар'];
const MN_DAYS = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];
export function fmtDate(str) {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00Z');
  return `${MN_MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${MN_DAYS[d.getUTCDay()]}`;
}
export function fmtShort(str) {
  if (!str) return '—';
  return `${str.slice(5, 7)}.${str.slice(8, 10)}`;
}
