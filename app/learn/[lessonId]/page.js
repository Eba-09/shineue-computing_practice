import Link from 'next/link';
import { redirect } from 'next/navigation';
import StudentBar from '@/components/StudentBar';
import LessonView from '@/components/LessonView';
import { getStudentSession } from '@/lib/session';
import { getClass, getProgress, getLessonLinks } from '@/lib/db';
import { currentLessons, getExerciseSet, getLesson, fmtDate } from '@/lib/lessons';
import { publicExercise } from '@/lib/exercises';
import { effectiveStatus } from '@/lib/results';
import { embedUrl } from '@/lib/slides';

export const dynamic = 'force-dynamic';

export default async function LessonPage({ params }) {
  const s = getStudentSession();
  if (!s) redirect('/');
  const cls = await getClass(s.classId);
  if (!cls) redirect('/');
  const lesson = getLesson(params.lessonId);
  const open = lesson && currentLessons(cls).some((l) => l.id === lesson.id);

  if (!open) {
    return (
      <>
        <StudentBar name={s.name} cls={cls.name} />
        <main className="wrap">
          <div className="empty">Энэ хичээл одоо нээлттэй биш байна. <Link href="/learn">Буцах</Link></div>
        </main>
      </>
    );
  }

  const links = await getLessonLinks();
  const set = getExerciseSet(lesson.id);
  const prog = set ? await getProgress(s.id, lesson.id) : [];
  const now = Date.now();
  const progress = {};
  if (set) {
    [...set.exercises, ...(set.bonus || [])].forEach((ex) => {
      const p = prog.find((r) => r.exercise_id === ex.id);
      if (p) progress[ex.id] = { status: effectiveStatus(p, ex, now), attempts: p.attempts };
    });
  }

  return (
    <>
      <StudentBar name={s.name} cls={cls.name} />
      <main className="wrap">
        <Link href="/learn" className="small">← Хичээлүүд</Link>
        <div className="lesson-head" style={{ marginTop: 14 }}>
          <div>
            <p className="eyebrow">
              {[lesson.no ? `Lesson ${lesson.no}` : 'Lesson', lesson.unit, lesson.date && fmtDate(lesson.date)].filter(Boolean).join(' · ')}
            </p>
            <h1 style={{ marginTop: 4 }}>{lesson.title}</h1>
          </div>
        </div>
        <LessonView
          lessonId={lesson.id}
          slide={{ embed: embedUrl(links[lesson.id]), url: links[lesson.id] || null }}
          intro={set?.intro || null}
          exercises={set ? set.exercises.map((e) => publicExercise(e, s.id)) : []}
          bonus={set ? (set.bonus || []).map((e) => publicExercise(e, s.id)) : []}
          initialProgress={progress}
        />
      </main>
    </>
  );
}
