import Link from 'next/link';
import { redirect } from 'next/navigation';
import TeacherBar from '@/components/TeacherBar';
import { isTeacher } from '@/lib/session';
import { listClasses, getLessonLinks } from '@/lib/db';
import { lessonsForGrade, currentLessons, exerciseCount, weekRange, todayStr, fmtShort, lessonLabel } from '@/lib/lessons';
import { setLessonLink, setClassMode } from '@/app/actions';

export const dynamic = 'force-dynamic';
const GRADES = [6, 7, 8];

export default async function LessonsPage({ searchParams }) {
  if (!isTeacher()) redirect('/teacher');
  const grade = GRADES.includes(Number(searchParams.grade)) ? Number(searchParams.grade) : 6;
  const all = lessonsForGrade(grade);
  const wk = weekRange(todayStr());
  const curTerm = all.find((l) => l.date && l.date >= wk.from)?.term || 1;
  const term = Number(searchParams.term) || curTerm;
  const lessons = all.filter((l) => l.term === term);
  const links = await getLessonLinks();
  const classes = (await listClasses()).filter((c) => c.grade === grade);

  return (
    <>
      <TeacherBar active="/teacher/lessons" />
      <main className="wrap">
        <p className="eyebrow">Lessons & slides</p>
        <h1 style={{ marginTop: 4 }}>Хичээл ба слайд</h1>
        <p className="muted small" style={{ marginTop: 6 }}>
          Google Drive дээр слайдаа <b>Anyone with the link · Viewer</b> болгож хуваалцаад, линкийг хичээлийн мөрөнд буулгаад
          Хадгалах дарна. Сурагчид тухайн 7 хоногт хичээлээ автоматаар харна.
        </p>

        <div className="row" style={{ marginTop: 20 }}>
          {GRADES.map((g) => (
            <Link key={g} href={`/teacher/lessons?grade=${g}`} className={`btn sm ${g === grade ? '' : 'ghost'}`}>
              {g}-р анги
            </Link>
          ))}
          <span className="spacer" />
          {[1, 2, 3, 4].map((t) => (
            <Link key={t} href={`/teacher/lessons?grade=${grade}&term=${t}`} className={`btn sm ${t === term ? '' : 'ghost'}`}>
              {t}-р улирал
            </Link>
          ))}
        </div>

        <h2 style={{ marginTop: 28 }}>Ангиудад юу харагдах вэ</h2>
        {classes.length === 0 && <p className="muted small" style={{ marginTop: 6 }}>{grade}-р ангид бүртгэлтэй анги алга.</p>}
        <div className="grid2" style={{ marginTop: 12 }}>
          {classes.map((c) => {
            const visible = currentLessons(c);
            return (
              <form key={c.id} action={setClassMode} className="box">
                <input type="hidden" name="classId" value={c.id} />
                <div className="row">
                  <h3>{c.name}</h3>
                  <span className={`pill ${c.mode === 'manual' ? '' : 'teal'}`}>{c.mode === 'manual' ? 'гараар' : 'огноогоор'}</span>
                </div>
                <p className="tiny muted" style={{ marginTop: 4 }}>
                  Одоо харагдаж буй: {visible.length ? visible.map((l) => lessonLabel(l)).join(', ') : 'алга'}
                </p>
                <div style={{ marginTop: 12 }} className="small">
                  <label style={{ display: 'block' }}>
                    <input type="radio" name="mode" value="auto" defaultChecked={c.mode !== 'manual'} /> Огноогоор — тухайн 7 хоногийн хичээл
                  </label>
                  <label style={{ display: 'block', marginTop: 4 }}>
                    <input type="radio" name="mode" value="manual" defaultChecked={c.mode === 'manual'} /> Гараар — доороос сонгосон хичээл(үүд)
                  </label>
                </div>
                <select name="lessonIds" multiple size={6} defaultValue={c.lesson_ids || []} style={{ width: '100%', marginTop: 10, fontSize: 13 }}>
                  {lessonsForGrade(grade).map((l) => (
                    <option key={l.id} value={l.id}>
                      {lessonLabel(l)} · {l.title}
                      {exerciseCount(l.id) ? ` — ${exerciseCount(l.id)} дасгал` : ''}
                    </option>
                  ))}
                </select>
                <p className="tiny muted" style={{ marginTop: 4 }}>Олныг сонгохдоо Ctrl (Mac дээр ⌘) дарж байгаад сонго.</p>
                <button className="btn sm" style={{ marginTop: 10 }}>Хадгалах</button>
              </form>
            );
          })}
        </div>

        <h2 style={{ marginTop: 34 }}>{grade}-р анги · {term}-р улирал</h2>
        <div className="matrix-wrap" style={{ marginTop: 12 }}>
          <table className="plain">
            <thead>
              <tr>
                <th style={{ width: 54 }}>№</th>
                <th style={{ width: 64 }}>Огноо</th>
                <th>Сэдэв</th>
                <th style={{ width: 90 }}>Дасгал</th>
                <th style={{ width: '38%' }}>Слайдын линк</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((l) => {
                const now = l.date && l.date >= wk.from && l.date <= wk.to;
                return (
                  <tr key={l.id} className={now ? 'now-row' : ''}>
                    <td className="mono">{l.no || '+'}</td>
                    <td className="mono small">{fmtShort(l.date)}</td>
                    <td>
                      {l.title}
                      <div className="tiny muted">{[l.unit, l.pages].filter(Boolean).join(' · ')}</div>
                    </td>
                    <td>{exerciseCount(l.id) ? <span className="pill teal">{exerciseCount(l.id)} + нэмэлт</span> : <span className="tiny muted">—</span>}</td>
                    <td>
                      <form action={setLessonLink} className="link-form">
                        <input type="hidden" name="lessonId" value={l.id} />
                        <input type="url" name="url" defaultValue={links[l.id] || ''} placeholder="https://docs.google.com/presentation/…" />
                        <button className="btn sm ghost">Хадгалах</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
