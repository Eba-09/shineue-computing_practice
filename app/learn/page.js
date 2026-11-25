import Link from 'next/link';
import { redirect } from 'next/navigation';
import StudentBar from '@/components/StudentBar';
import { getStudentSession } from '@/lib/session';
import { getClass, getProgress, getAttemptsFor } from '@/lib/db';
import { currentLessons, getExerciseSet, fmtDate, lessonLabel, weekRange } from '@/lib/lessons';
import { studentResult } from '@/lib/results';

export const dynamic = 'force-dynamic';

export default async function Learn() {
  const s = getStudentSession();
  if (!s) redirect('/');
  const cls = await getClass(s.classId);
  if (!cls) redirect('/');
  const lessons = currentLessons(cls);
  const wk = weekRange();

  const cards = await Promise.all(
    lessons.map(async (l) => {
      const set = getExerciseSet(l.id);
      if (!set) return { l, set: null };
      const r = studentResult(set, await getProgress(s.id, l.id), await getAttemptsFor(l.id, [s.id]));
      const started = r.rows.some((x) => x.status !== 'none');
      return { l, set, r, started };
    })
  );

  return (
    <>
      <StudentBar name={s.name} cls={cls.name} />
      <main className="wrap">
        <p className="eyebrow">{cls.mode === 'manual' ? 'This week · багшийн сонголт' : `This week · ${wk.from.slice(5).replace('-', '.')} – ${wk.to.slice(5).replace('-', '.')}`}</p>
        <h1 style={{ marginTop: 4 }}>Энэ 7 хоногийн хичээл</h1>
        {cards.length === 0 && (
          <div className="empty" style={{ marginTop: 24 }}>
            Энэ 7 хоногт нээлттэй хичээл алга. Багш хичээлээ нээхийг хүлээгээрэй.
          </div>
        )}
        <div className="lessons">
          {cards.map(({ l, set, r, started }) => (
            <Link key={l.id} href={`/learn/${l.id}`} className="lesson-card">
              <div className="no">
                {l.no ? <><b>{l.no}</b>-р хичээл</> : lessonLabel(l)}
              </div>
              <div>
                <h3>{l.title}</h3>
                <p className="meta">
                  {[l.unit, l.date && fmtDate(l.date), set ? `${set.exercises.length} дасгал` : 'Дасгалгүй — зөвхөн слайд']
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <div className="score">
                {r ? (r.finished ? `${r.score} / ${r.max}` : started ? 'Үргэлжлүүлэх →' : 'Эхлэх →') : 'Слайд →'}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
