import Link from 'next/link';
import { redirect } from 'next/navigation';
import TeacherBar from '@/components/TeacherBar';
import PrintButton from '@/components/PrintButton';
import { isTeacher } from '@/lib/session';
import { listClasses, listStudents } from '@/lib/db';
import { createClass, deleteClass, addStudents, deleteStudent, renewPin } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default async function SetupPage({ searchParams }) {
  if (!isTeacher()) redirect('/teacher');
  const classes = await listClasses();
  const cls = classes.find((c) => c.id === searchParams.class) || classes[0];
  const students = cls ? await listStudents(cls.id) : [];

  return (
    <>
      <TeacherBar active="/teacher/setup" />
      <main className="wrap">
        <p className="eyebrow noprint">Classes & students</p>
        <h1 style={{ marginTop: 4 }} className="noprint">Анги ба сурагч</h1>

        <div className="row noprint" style={{ marginTop: 20 }}>
          {classes.map((c) => (
            <Link key={c.id} href={`/teacher/setup?class=${c.id}`} className={`btn sm ${c.id === cls?.id ? '' : 'ghost'}`}>
              {c.name}
            </Link>
          ))}
          <span className="spacer" />
          <form action={createClass} className="row" style={{ gap: 6 }}>
            <input type="text" name="name" placeholder="Ангийн нэр, ж: 6А" required style={{ width: 150 }} />
            <select name="grade" defaultValue="6">
              <option value="6">6-р анги</option>
              <option value="7">7-р анги</option>
              <option value="8">8-р анги</option>
            </select>
            <button className="btn sm">Анги нэмэх</button>
          </form>
        </div>

        {!cls ? (
          <div className="empty" style={{ marginTop: 24 }}>Анги нэмээд эхэл. Зөвхөн таны хичээл ордог ангиудыг нэмнэ.</div>
        ) : (
          <div className="grid2" style={{ marginTop: 24, gridTemplateColumns: '1.4fr 1fr' }}>
            <section className="box">
              <div className="row">
                <h2>{cls.name}</h2>
                <span className="pill">{students.length} сурагч</span>
                <span className="spacer" />
                <PrintButton>PIN жагсаалт хэвлэх</PrintButton>
              </div>
              <table className="plain" style={{ marginTop: 12 }}>
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th>Нэр</th>
                    <th style={{ width: 70 }}>PIN</th>
                    <th className="noprint" style={{ width: 170 }} />
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id}>
                      <td className="muted">{i + 1}</td>
                      <td>{s.name}</td>
                      <td className="mono">
                        <b>{s.pin}</b>
                      </td>
                      <td className="noprint">
                        <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
                          <form action={renewPin}>
                            <input type="hidden" name="studentId" value={s.id} />
                            <button className="btn ghost sm">Шинэ PIN</button>
                          </form>
                          <form action={deleteStudent}>
                            <input type="hidden" name="studentId" value={s.id} />
                            <button className="btn warn sm">Устгах</button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length === 0 && <p className="muted small" style={{ marginTop: 10 }}>Сурагч алга. Баруун талаас нэмнэ.</p>}
            </section>

            <section className="noprint">
              <form action={addStudents} className="box">
                <input type="hidden" name="classId" value={cls.id} />
                <h3>Сурагч нэмэх</h3>
                <p className="small muted" style={{ margin: '4px 0 10px' }}>
                  Нэг мөрөнд нэг сурагч. Excel-ээс нэрсээ хуулж буулгаж болно. PIN-ийг өөрөө өгөх бол нэрийн ард таслалтай
                  бич: <span className="mono">Бат-Эрдэнэ, 4821</span>. Бичээгүй бол 4 оронтой PIN автоматаар үүснэ.
                </p>
                <textarea name="names" rows={10} placeholder={'Анужин\nБат-Эрдэнэ, 4821\nТэмүүлэн'} />
                <button className="btn" style={{ marginTop: 10 }}>Нэмэх</button>
              </form>
              <form action={deleteClass} className="box" style={{ marginTop: 14 }}>
                <input type="hidden" name="classId" value={cls.id} />
                <h3>Анги устгах</h3>
                <p className="small muted" style={{ margin: '4px 0 10px' }}>{cls.name} ангийн бүх сурагч, дүн хамт устна. Буцаах боломжгүй.</p>
                <button className="btn warn sm">{cls.name} ангийг устгах</button>
              </form>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
