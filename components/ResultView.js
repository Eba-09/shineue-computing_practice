'use client';

import { useEffect, useState } from 'react';

const TAG = {
  solved1: ['ok', 'Эхний оролдлогоор зөв'],
  solved: ['half', 'Засаж байж зөв'],
  timeout: ['late', 'Хугацаа дууссан'],
  open: ['none', 'Хийж байна'],
  none: ['none', 'Эхлээгүй'],
};

const fmt = (s) => (s == null ? '—' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);

export default function ResultView({ lessonId, hasBonus, onBonus, onBack, showBack }) {
  const [r, setR] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch('/api/ex', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'result', lessonId }),
    })
      .then((x) => x.json())
      .then(setR)
      .catch(() => setErr('Дүнг ачаалж чадсангүй.'));
  }, [lessonId]);

  if (err) return <p className="err">{err}</p>;
  if (!r) return <p className="muted">Ачаалж байна…</p>;

  const mistakes = r.rows.filter((x) => x.wrong.length || x.status === 'timeout');

  return (
    <div>
      <div className="result-top">
        <div>
          <p className="eyebrow">Your result</p>
          <div className="big">
            {r.score}
            <span className="muted" style={{ fontSize: 24 }}> / {r.max}</span>
          </div>
        </div>
        <div className="spacer" />
        {showBack && (
          <button className="btn ghost" onClick={onBack}>
            ← Дасгал руу буцах
          </button>
        )}
        {r.finished && hasBonus && (
          <button className="btn" onClick={onBonus}>
            Нэмэлт дасгал хийх →
          </button>
        )}
      </div>

      <table className="res">
        <thead>
          <tr>
            <th style={{ width: 40 }}>#</th>
            <th>Дасгал</th>
            <th>Үр дүн</th>
            <th>Оролдлого</th>
            <th>Хугацаа</th>
            <th>Оноо</th>
          </tr>
        </thead>
        <tbody>
          {r.rows.map((x, i) => {
            const key = x.status === 'solved' ? (x.attempts <= 1 ? 'solved1' : 'solved') : x.status;
            const [cls, label] = TAG[key];
            if (x.bonus && x.status === 'none') return null;
            return (
              <tr key={x.id}>
                <td className="muted">{x.bonus ? '+' : i + 1}</td>
                <td>
                  <b>{x.title}</b>
                  <div className="tiny muted">{x.label}</div>
                  {x.wrong.length > 0 && (
                    <ul className="wrongs">
                      {x.wrong.map((w, j) => (
                        <li key={j}>{w.length > 160 ? w.slice(0, 160) + '…' : w}</li>
                      ))}
                    </ul>
                  )}
                  {x.solution && x.status !== 'solved' && <pre className="sol">{x.solution}</pre>}
                </td>
                <td>
                  <span className={`tag ${cls}`}>{label}</span>
                </td>
                <td className="mono">{x.attempts || '—'}</td>
                <td className="mono">
                  {fmt(x.used)} <span className="muted tiny">/ {fmt(x.seconds)}</span>
                </td>
                <td className="mono">{x.bonus ? '—' : x.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {mistakes.length > 0 && (
        <div className="panel" style={{ marginTop: 20 }}>
          <p className="eyebrow" style={{ marginBottom: 4 }}>In your notebook</p>
          <p>
            Алдсан эсвэл хугацаа дууссан {mistakes.length} дасгалаа дэвтэртээ зөв болгож засаж бич. Улбар шараар
            харагдаж буй нь чиний буруу хариултууд.
          </p>
        </div>
      )}
    </div>
  );
}
