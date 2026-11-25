import Link from 'next/link';
import TopBar from '@/components/TopBar';
import { listClasses } from '@/lib/db';
import { getStudentSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const classes = await listClasses();
  const s = getStudentSession();
  const grades = [...new Set(classes.map((c) => c.grade))].sort((a, b) => a - b);

  return (
    <>
      <TopBar>
        {s ? (
          <Link href="/learn" className="btn sm">
            {s.name} — үргэлжлүүлэх
          </Link>
        ) : null}
      </TopBar>
      <main className="wrap">
        <p className="eyebrow">Step 1 of 2</p>
        <h1 style={{ marginTop: 4 }}>Ангиа сонго</h1>
        {classes.length === 0 && (
          <div className="empty" style={{ marginTop: 24 }}>
            Анги хараахан нэмэгдээгүй байна. Багш <Link href="/teacher/setup">тохиргоо</Link> хэсгээс анги нэмнэ.
          </div>
        )}
        {grades.map((g) => (
          <section className="grade" key={g}>
            <h2>{g}-р анги</h2>
            <div className="tiles">
              {classes
                .filter((c) => c.grade === g)
                .map((c) => (
                  <Link key={c.id} href={`/class/${c.id}`} className="tile">
                    {c.name}
                  </Link>
                ))}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
