'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { motion, Reorder, useAnimationControls } from 'framer-motion';
import CodeBlock from './CodeBlock';

const CodeEditor = dynamic(() => import('./CodeEditor'), {
  ssr: false,
  loading: () => <pre className="code">Ачаалж байна…</pre>,
});

const KIND = {
  mcq: 'Нэг хариултыг сонго.',
  output: 'Гаралтыг яг хэвлэгдэх шиг нь бич.',
  fill: 'Хоосон нүд бүрийг нөх.',
  fix: 'Кодыг засварлагч дээр шууд зас.',
  order: 'Мөрүүдийг чирж эсвэл сумаар зөөж дараалалд оруул.',
};

async function call(body) {
  const r = await fetch('/api/ex', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Сүлжээний алдаа');
  return data;
}

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function Exercise({ lessonId, ex, number, isBonus, progress, onUpdate, onNext, isLast }) {
  const [deadline, setDeadline] = useState(null);
  const [left, setLeft] = useState(ex.seconds);
  const [status, setStatus] = useState(progress?.status || 'open');
  const [attempts, setAttempts] = useState(progress?.attempts || 0);
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [slot, setSlot] = useState(null);
  const shake = useAnimationControls();
  const timedOut = useRef(false);

  // answers per type
  const [choice, setChoice] = useState(null);
  const [text, setText] = useState('');
  const [blanks, setBlanks] = useState(() => Array(ex.blanks).fill(''));
  const [code, setCode] = useState(ex.code || '');
  const [order, setOrder] = useState(ex.lines || []);

  useEffect(() => setSlot(document.getElementById('timer-slot')), []);

  // start (or resume) the exercise on the server — the server owns the clock
  useEffect(() => {
    let live = true;
    call({ action: 'start', lessonId, exerciseId: ex.id })
      .then((d) => {
        if (!live) return;
        const offset = d.serverNow - Date.now();
        setDeadline(new Date(d.startedAt).getTime() + ex.seconds * 1000 - offset);
        setStatus(d.status);
        setAttempts(d.attempts);
        onUpdate({ status: d.status, attempts: d.attempts });
      })
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex.id]);

  const expire = useCallback(async () => {
    if (timedOut.current) return;
    timedOut.current = true;
    try {
      const d = await call({ action: 'timeout', lessonId, exerciseId: ex.id });
      if (d.status === 'open') {
        timedOut.current = false;
        return;
      }
      setStatus(d.status);
      onUpdate({ status: d.status });
    } catch (e) {
      timedOut.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex.id]);

  useEffect(() => {
    if (!deadline || status !== 'open') return;
    const tick = () => {
      const s = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) expire();
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [deadline, status, expire]);

  const answer = () => {
    switch (ex.type) {
      case 'mcq':
        return choice;
      case 'output':
        return text;
      case 'fill':
        return blanks;
      case 'fix':
        return code;
      case 'order':
        return order.map((l) => l.id);
      default:
        return null;
    }
  };

  const ready =
    (ex.type === 'mcq' && choice !== null) ||
    (ex.type === 'output' && text.trim()) ||
    (ex.type === 'fill' && blanks.every((b) => b.trim())) ||
    ex.type === 'fix' ||
    ex.type === 'order';

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const d = await call({ action: 'submit', lessonId, exerciseId: ex.id, answer: answer() });
      setAttempts(d.attempts);
      setStatus(d.status);
      onUpdate({ status: d.status, attempts: d.attempts });
      if (d.correct) setFeedback({ ok: true });
      else if (d.status === 'open') {
        setFeedback({ ok: false, hint: d.hint, n: d.attempts });
        shake.start({ x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.35 } });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const locked = status !== 'open';
  const pct = deadline ? (left / ex.seconds) * 100 : 100;

  const timer =
    status === 'open' ? (
      <div className={`timer ${left <= 30 ? 'low' : ''}`}>
        <span className="bar">
          <i style={{ width: `${pct}%` }} />
        </span>
        {fmt(left)}
      </div>
    ) : null;

  return (
    <div className="ex-grid">
      {slot && createPortal(timer, slot)}
      <div>
        <p className="eyebrow">
          {isBonus ? 'Extra' : `Exercise ${number}`} · {ex.label}
        </p>
        <h2 className="ex-title">{ex.title}</h2>
        <p className="prompt">{ex.prompt}</p>

        <motion.div animate={shake}>
          {ex.type === 'mcq' && (
            <>
              {ex.code && <CodeBlock code={ex.code} />}
              <div className="opts">
                {ex.options.map((o, i) => (
                  <button key={i} className={`opt ${choice === i ? 'on' : ''}`} disabled={locked} onClick={() => setChoice(i)}>
                    <span className="k">{'ABCD'[i]}</span>
                    <span>{o}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {ex.type === 'output' && (
            <>
              <CodeBlock code={ex.code} />
              <label className="f" style={{ marginTop: 16 }}>Output</label>
              <textarea
                className="answer"
                style={{ marginTop: 0 }}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={locked}
                spellCheck={false}
                placeholder="Програм юу хэвлэх вэ?"
              />
            </>
          )}

          {ex.type === 'fill' && <FillCode code={ex.code} values={blanks} setValues={setBlanks} disabled={locked} />}

          {ex.type === 'fix' && (
            <>
              <div className="editor">
                <CodeEditor value={code} onChange={setCode} readOnly={locked} />
              </div>
              {!locked && (
                <button className="linkbtn small" style={{ marginTop: 8 }} onClick={() => setCode(ex.code)}>
                  Анхны кодыг сэргээх
                </button>
              )}
            </>
          )}

          {ex.type === 'order' && (
            <>
              {ex.before && <CodeBlock code={ex.before} />}
              <Reorder.Group as="ol" axis="y" values={order} onReorder={locked ? () => {} : setOrder} className="order">
                {order.map((l, i) => (
                  <Reorder.Item key={l.id} value={l} dragListener={!locked}>
                    <span className="grip">⋮⋮</span>
                    <span>{l.text}</span>
                    {!locked && (
                      <span className="mv">
                        <button
                          aria-label="Дээш"
                          disabled={i === 0}
                          onClick={() => setOrder((o) => swap(o, i, i - 1))}
                        >
                          ▲
                        </button>
                        <button
                          aria-label="Доош"
                          disabled={i === order.length - 1}
                          onClick={() => setOrder((o) => swap(o, i, i + 1))}
                        >
                          ▼
                        </button>
                      </span>
                    )}
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </>
          )}
        </motion.div>

        {feedback && !feedback.ok && status === 'open' && (
          <motion.div className="feedback no" initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={feedback.n}>
            <b>Буруу байна — дахин оролд. ({feedback.n}-р оролдлого)</b>
            {feedback.hint}
          </motion.div>
        )}
        {status === 'solved' && (
          <motion.div className="feedback yes" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
            <b>Зөв!</b>
            {attempts <= 1 ? 'Эхний оролдлогоор зөв хийлээ.' : `${attempts} оролдлогоор зөв болголоо.`}
          </motion.div>
        )}
        {status === 'timeout' && (
          <div className="feedback no">
            <b>Хугацаа дууслаа.</b>
            Энэ дасгалыг хичээлийн төгсгөлд дүнтэйгээ хамт дахин харна.
          </div>
        )}
        {error && <p className="err" style={{ marginTop: 12 }}>{error}</p>}

        <div className="actions">
          {status === 'open' ? (
            <button className="btn" onClick={submit} disabled={!ready || busy || !deadline}>
              {busy ? 'Шалгаж байна…' : 'Check my work'}
            </button>
          ) : (
            <button className="btn" onClick={onNext}>
              {isLast ? 'Дүнгээ харах →' : 'Дараагийн дасгал →'}
            </button>
          )}
          {attempts > 0 && status === 'open' && <span className="small muted">{attempts} оролдлого</span>}
        </div>
      </div>

      <aside className="side">
        <div className="panel small">
          <p className="eyebrow" style={{ marginBottom: 6 }}>Your task</p>
          <p>{KIND[ex.type]}</p>
          <p className="muted" style={{ marginTop: 6 }}>Хугацаа: {fmt(ex.seconds)}</p>
        </div>
        {ex.table && (
          <div className="panel">
            <table className="io">
              <thead>
                <tr>
                  <th>INPUT</th>
                  <th>OUTPUT</th>
                </tr>
              </thead>
              <tbody>
                {ex.table.map((r, i) => (
                  <tr key={i}>
                    <td>{r[0]}</td>
                    <td>{r[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {ex.source && <p className="tiny muted" style={{ marginTop: 10 }}>{ex.source}</p>}
      </aside>
    </div>
  );
}

function swap(arr, a, b) {
  const o = [...arr];
  [o[a], o[b]] = [o[b], o[a]];
  return o;
}

function FillCode({ code, values, setValues, disabled }) {
  let k = 0;
  const lines = code.split('\n');
  return (
    <pre className="code">
      {lines.map((line, li) => {
        const parts = line.split('___');
        return (
          <div key={li}>
            <span className="ln">{li + 1}</span>
            {parts.map((p, pi) => {
              const idx = pi < parts.length - 1 ? k++ : null;
              return (
                <span key={pi}>
                  {p}
                  {idx !== null && (
                    <input
                      className="fill-input"
                      value={values[idx]}
                      disabled={disabled}
                      spellCheck={false}
                      autoComplete="off"
                      size={Math.max(6, values[idx].length + 1)}
                      onChange={(e) => {
                        const v = [...values];
                        v[idx] = e.target.value;
                        setValues(v);
                      }}
                      aria-label={`Blank ${idx + 1}`}
                    />
                  )}
                </span>
              );
            })}
          </div>
        );
      })}
    </pre>
  );
}
