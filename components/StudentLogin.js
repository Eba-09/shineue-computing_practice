'use client';

import { useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { studentLogin } from '@/app/actions';

function Submit({ ready }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn" disabled={!ready || pending}>
      {pending ? 'Шалгаж байна…' : 'Нэвтрэх'}
    </button>
  );
}

export default function StudentLogin({ students }) {
  const [picked, setPicked] = useState(null);
  const [pin, setPin] = useState(['', '', '', '']);
  const [state, action] = useFormState(studentLogin, null);
  const refs = [useRef(), useRef(), useRef(), useRef()];

  const pick = (s) => {
    setPicked(s);
    setPin(['', '', '', '']);
    setTimeout(() => refs[0].current?.focus(), 50);
  };

  const type = (i, v) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const next = [...pin];
    next[i] = d;
    setPin(next);
    if (d && i < 3) refs[i + 1].current?.focus();
  };

  const key = (i, e) => {
    if (e.key === 'Backspace' && !pin[i] && i > 0) refs[i - 1].current?.focus();
  };

  if (!students.length)
    return <div className="empty" style={{ marginTop: 24 }}>Энэ ангид сурагч нэмэгдээгүй байна.</div>;

  return (
    <div className="row" style={{ alignItems: 'flex-start', gap: 28, marginTop: 8 }}>
      <div style={{ flex: '1 1 520px' }}>
        <div className="names">
          {students.map((s) => (
            <button key={s.id} type="button" className={`name ${picked?.id === s.id ? 'on' : ''}`} onClick={() => pick(s)}>
              {s.name}
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {picked && (
          <motion.form
            key="pin"
            action={action}
            className="panel"
            style={{ flex: '0 0 280px', marginTop: 16, position: 'sticky', top: 76 }}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <input type="hidden" name="studentId" value={picked.id} />
            <input type="hidden" name="pin" value={pin.join('')} />
            <p className="small muted">Сурагч</p>
            <h3 style={{ marginBottom: 14 }}>{picked.name}</h3>
            <label className="f">PIN код</label>
            <div className="pin">
              {pin.map((d, i) => (
                <input
                  key={i}
                  ref={refs[i]}
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={d}
                  onChange={(e) => type(i, e.target.value)}
                  onKeyDown={(e) => key(i, e)}
                  aria-label={`PIN ${i + 1}`}
                />
              ))}
            </div>
            {state?.error && <p className="err" style={{ marginTop: 10 }}>{state.error}</p>}
            <div style={{ marginTop: 16 }}>
              <Submit ready={pin.every(Boolean)} />
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
