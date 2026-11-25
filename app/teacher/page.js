import TopBar from '@/components/TopBar';
import TeacherBar from '@/components/TeacherBar';
import TeacherLogin from '@/components/TeacherLogin';
import Dashboard from '@/components/Dashboard';
import { isTeacher } from '@/lib/session';
import { listClasses, backendName } from '@/lib/db';
import { currentLessons, lessonsForGrade, getExerciseSet, lessonLabel } from '@/lib/lessons';

export const dynamic = 'force-dynamic';

export default async function TeacherPage({ searchParams }) {
  if (!isTeacher())
    return (
      <>
        <TopBar />
        <main className="wrap">
          <TeacherLogin />
        </main>
      </>
    );

  const classes = await listClasses();
  const cls = classes.find((c) => c.id === searchParams.class) || classes[0];

  let options = [];
  let lessonId = null;
  if (cls) {
    const now = currentLessons(cls);
    const withEx = lessonsForGrade(cls.grade).filter((l) => getExerciseSet(l.id));
    const seen = new Set();
    options = [...now, ...withEx]
      .filter((l) => !seen.has(l.id) && seen.add(l.id))
      .map((l) => ({
        id: l.id,
        label: `${lessonLabel(l)} · ${l.title}`,
        now: now.some((n) => n.id === l.id),
        hasEx: !!getExerciseSet(l.id),
      }));
    lessonId =
      options.find((o) => o.id === searchParams.lesson)?.id ||
      options.find((o) => o.now && o.hasEx)?.id ||
      options.find((o) => o.hasEx)?.id ||
      null;
  }

  return (
    <>
      <TeacherBar active="/teacher" />
      <main className="wrap">
        <p className="eyebrow">Dashboard · {backendName}</p>
        <h1 style={{ marginTop: 4 }}>Хичээлийн явц</h1>
        {!cls ? (
          <div className="empty" style={{ marginTop: 24 }}>
            Эхлээд <a href="/teacher/setup">Анги ба сурагч</a> хэсгээс анги нэмнэ үү.
          </div>
        ) : (
          <Dashboard
            classes={classes.map((c) => ({ id: c.id, name: c.name, grade: c.grade }))}
            cls={{ id: cls.id, name: cls.name, show_answers: cls.show_answers }}
            options={options}
            lessonId={lessonId}
          />
        )}
      </main>
    </>
  );
}
