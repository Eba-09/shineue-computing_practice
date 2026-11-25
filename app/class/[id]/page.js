import Link from 'next/link';
import { notFound } from 'next/navigation';
import TopBar from '@/components/TopBar';
import StudentLogin from '@/components/StudentLogin';
import { getClass, listStudents } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ClassPage({ params }) {
  const cls = await getClass(params.id);
  if (!cls) notFound();
  const students = (await listStudents(cls.id)).map((s) => ({ id: s.id, name: s.name }));
  return (
    <>
      <TopBar />
      <main className="wrap">
        <Link href="/" className="small">← Анги солих</Link>
        <p className="eyebrow" style={{ marginTop: 18 }}>Step 2 of 2 · {cls.name}</p>
        <h1 style={{ marginTop: 4 }}>Нэрээ сонгоод PIN кодоо оруул</h1>
        <StudentLogin students={students} />
      </main>
    </>
  );
}
