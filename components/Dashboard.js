'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { toggleShowAnswers, resetStudentLesson } from '@/app/actions';

const fmt = (s) => (s == null ? '—' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);

function cellOf(row) {
  if (!row || row.status === 'none') return ['none', '·'];
  if (row.status === 'open') return ['open', row.attempts ? `${row.attempts}×` : '…'];
  if (row.status === 'timeout') return ['late', row.attempts ? `${row.attempts}×` : '0'];
  return row.attempts <= 1 ? ['ok', '✓'] : ['half', `${row.attempts}×`];
}

export default function Dashboard({ classes, cls, options, lessonId }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [at, setAt] = useState(null);
  const [err, setErr] = useState(null);
  const [drawer, setDrawer] = useState(null);

  const load = useCallback(async () => {
    if (!lessonId) return;
    try {
      const r = await fetch(`/api/teacher/results?classId=${cls.id}&lessonId=${lessonId}`, { cache: 'no-store' });
      if (!r.ok) throw new Error();
      setData(await r.json());
      setAt(new Date());
      setErr(null);
    } catch {
      setErr('Мэдээлэл ачаалж чадсангүй.');
    }
  }, [cls.id, lessonId]);

  useEffect(() => {
    setData(null);
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  const go = (c, l) => router.push(`/teacher?class=${c}${l ? `&lesson=${l}` : ''}`);

  const exs = data?.perExercise || [];
  const students = data?.perStudent || [];
  const started = students.filter((s) => s.rows.some((r) => r.status !== 'none'));
  const finished = students.filter((s) => s.finished);
  const avg = started.length ? (started.reduce((a, s) => a + s.score, 0) / started.length).toFixed(1) : '—';

  return (
    <>
      <div className="dash-tools">
        <div>
          <label className="f">Анги</label>
          <select value={cls.id} onChange={(e) => go(e.target.value)}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1 1 320px' }}>
          <label className="f">Хичээл</label>
          <select value={lessonId || ''} onChange={(e) => go(cls.id, e.target.value)} style={{ width: '100%' }}>
            {!lessonId && <option value="">— дасгалтай хичээл алга —</option>}
            {options
              .filter((o) => o.hasEx)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.now ? '● ' : ''}
                  {o.label}
                </option>
              ))}
          </select>
        </div>
        <form action={toggleShowAnswers}>
          <input type="hidden" name="classId" value={cls.id} />
          <input type="hidden" name="value" value={cls.show_answers ? '0' : '1'} />
          <button className={`btn ${cls.show_answers ? '' : 'ghost'}`} title="Сурагчдын дүнгийн хуудсанд зөв хариулт харагдана">
            {cls.show_answers ? 'Хариулт нээлттэй' : 'Хариултыг нээх'}
          </button>
        </form>
      </div>

      {!lessonId ? (
        <div className="empty">
          Энэ ангийн хичээлүүдэд дасгал хараахан бэлдээгүй байна. Дасгалтай хичээлүүд энд жагсаалтад гарч ирнэ.
        </div>
      ) : !data ? (
        <p className="muted">{err || 'Ачаалж байна…'}</p>
      ) : (
        <>
          <div className="row small muted" style={{ marginBottom: 10 }}>
            <span>
              Эхэлсэн <b className="mono" style={{ color: 'var(--ink)' }}>{started.length}</b> / {students.length}
            </span>
            <span>
              Дуусгасан <b className="mono" style={{ color: 'var(--ink)' }}>{finished.length}</b>
            </span>
            <span>
              Дундаж оноо <b className="mono" style={{ color: 'var(--ink)' }}>{avg}</b> / {exs.filter((e) => !e.bonus).length}
            </span>
            <span className="spacer" />
            <span>
              {err ? <span className="err">{err}</span> : `Шинэчлэгдсэн ${at?.toLocaleTimeString('mn-MN')} · 10 сек тутам`}
            </span>
          </div>

          <div className="matrix-wrap">
            <table className="matrix">
              <thead>
                <tr>
                  <th className="nm">Сурагч</th>
                  {exs.map((e, i) => (
                    <th key={e.id} className="ex" title={e.title}>
                      <b>{e.bonus ? 'Нэмэлт' : `Ex ${i + 1}`}</b>
                      {e.label.toLowerCase()}
                    </th>
                  ))}
                  <th>Оноо</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="nm">{s.name}</td>
                    {s.rows.map((r) => {
                      const [c, t] = cellOf(r);
                      return (
                        <td key={r.id}>
                          <button
                            className={`cell ${c}`}
                            onClick={c === 'none' ? undefined : () => setDrawer({ student: s, ex: exs.find((e) => e.id === r.id), row: r })}
                          >
                            {t}
                          </button>
                        </td>
                      );
                    })}
                    <td className="mono">
                      <b>{s.score}</b>
                      {s.finished ? '' : <span className="muted tiny"> …</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="legend">
            <span><i style={{ background: 'var(--teal)' }} /> Эхний оролдлогоор зөв (1)</span>
            <span><i style={{ background: 'var(--teal-l)', border: '1px solid var(--teal)' }} /> Засаж байж зөв (0.5) · тоо = оролдлого</span>
            <span><i style={{ background: 'var(--orange-l)', border: '1px solid #f2c79c' }} /> Хугацаа дууссан (0)</span>
            <span><i style={{ border: '1px dashed var(--mute)' }} /> Хийж байна</span>
          </div>

          <h2 style={{ marginTop: 34 }}>Дасгал тус бүрээр</h2>
          <p className="small muted">Хаана хамгийн их алдаж байгааг, ямар буруу хариулт давтагдаж байгааг харуулна.</p>
          <div className="ex-stats">
            {exs.map((e, i) => {
              const n = students.length || 1;
              return (
                <div key={e.id} className="ex-stat">
                  <p className="eyebrow">{e.bonus ? 'Нэмэлт' : `Exercise ${i + 1}`} · {e.label}</p>
                  <h3>{e.title}</h3>
                  <div className="stackbar" title="Эхний оролдлогоор / засаж / хугацаа дууссан / хийж байна">
                    <i style={{ width: `${(e.first / n) * 100}%`, background: 'var(--teal)' }} />
                    <i style={{ width: `${(e.later / n) * 100}%`, background: '#8fcfc5' }} />
                    <i style={{ width: `${(e.timeout / n) * 100}%`, background: 'var(--orange)' }} />
                    <i style={{ width: `${(e.open / n) * 100}%`, background: '#c9d0da' }} />
                  </div>
                  <p className="tiny muted" style={{ marginTop: 6 }}>
                    {e.first} эхний удаад · {e.later} засаж · {e.timeout} хугацаа дууссан · дундаж {fmt(e.avgTime)} / {fmt(e.seconds)}
                  </p>
                  {e.commonWrong.length > 0 ? (
                    <ul>
                      {e.commonWrong.map((w, j) => (
                        <li key={j} title={w.answer}>
                          <span>{w.answer || '(хоосон)'}</span>
                          <span className="muted">{w.n}×</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="tiny muted" style={{ marginTop: 10 }}>Буруу хариулт алга.</p>
                  )}
                  {e.solution && (
                    <details style={{ marginTop: 8 }}>
                      <summary className="tiny muted" style={{ cursor: 'pointer' }}>Зөв хариулт</summary>
                      <pre className="sol">{e.solution}</pre>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div className="drawer-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(null)} />
            <motion.aside
              className="drawer"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className="row">
                <p className="eyebrow">{drawer.ex.label}</p>
                <span className="spacer" />
                <button className="btn ghost sm" onClick={() => setDrawer(null)}>
                  Хаах
                </button>
              </div>
              <h2 style={{ marginTop: 6 }}>{drawer.student.name}</h2>
              <p className="muted">{drawer.ex.title}</p>
              <p className="small" style={{ marginTop: 10 }}>
                Оролдлого: <b className="mono">{drawer.row.attempts}</b> · Хугацаа: <b className="mono">{fmt(drawer.row.used)}</b> / {fmt(drawer.ex.seconds)}
              </p>
              <h3 style={{ marginTop: 18 }}>Илгээсэн хариултууд</h3>
              <ol style={{ paddingLeft: 18 }}>
                {(data?.attempts || [])
                  .filter((a) => a.s === drawer.student.id && a.e === drawer.ex.id)
                  .map((a, i) => (
                    <li key={i} style={{ marginTop: 8 }}>
                      <span className={`tag ${a.ok ? 'ok' : 'late'}`}>{a.ok ? 'зөв' : 'буруу'}</span>{' '}
                      <span className="tiny muted">{new Date(a.t).toLocaleTimeString('mn-MN')}</span>
                      <pre className="sol">{a.a || '(хоосон)'}</pre>
                    </li>
                  ))}
              </ol>
              {drawer.ex.solution && (
                <>
                  <h3 style={{ marginTop: 18 }}>Зөв хариулт</h3>
                  <pre className="sol">{drawer.ex.solution}</pre>
                </>
              )}
              <form
                action={resetStudentLesson}
                style={{ marginTop: 26 }}
                onSubmit={(e) => {
                  if (!confirm('Энэ сурагчийн энэ хичээлийн бүх дасгалыг тэглэх үү?')) e.preventDefault();
                  else setTimeout(() => { setDrawer(null); load(); }, 300);
                }}
              >
                <input type="hidden" name="studentId" value={drawer.student.id} />
                <input type="hidden" name="lessonId" value={lessonId} />
                <button className="btn warn sm">Энэ хичээлийг дахин эхлүүлэх</button>
                <p className="tiny muted" style={{ marginTop: 6 }}>Компьютер гацсан, андуурч орсон үед ашиглана.</p>
              </form>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
