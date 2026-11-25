'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Exercise from './Exercise';
import ResultView from './ResultView';

const done = (st) => st === 'solved' || st === 'timeout';

export default function LessonView({ lessonId, slide, intro, exercises, bonus, initialProgress }) {
  const [tab, setTab] = useState(slide.embed || !exercises.length ? 'slide' : 'practice');
  const [progress, setProgress] = useState(initialProgress);
  const [view, setView] = useState(null); // exercise id being shown, or 'result'
  const [doingBonus, setDoingBonus] = useState(false);

  const mainDone = exercises.length > 0 && exercises.every((e) => done(progress[e.id]?.status));
  const nothingStarted = exercises.every((e) => !progress[e.id]);
  const nextMain = exercises.find((e) => !done(progress[e.id]?.status));
  const nextBonus = bonus.find((e) => !done(progress[e.id]?.status));

  // what would come next; the exercise on screen stays pinned until the student presses "next"
  const auto = useMemo(() => {
    if (!mainDone) return nothingStarted ? 'intro' : nextMain.id;
    if (doingBonus && nextBonus) return nextBonus.id;
    return 'result';
  }, [mainDone, nothingStarted, nextMain, doingBonus, nextBonus]);
  const current = view ?? auto;

  useEffect(() => {
    if (view === null && auto !== 'intro' && auto !== 'result') setView(auto);
  }, [view, auto]);

  useEffect(() => {
    if (current === 'result') setDoingBonus(false);
  }, [current]);

  const update = (id, patch) => setProgress((p) => ({ ...p, [id]: { ...(p[id] || {}), ...patch } }));

  const goNext = () => setView(null);

  const all = [...exercises, ...bonus];
  const ex = all.find((e) => e.id === current);
  const index = exercises.findIndex((e) => e.id === current);
  const totalMin = Math.round(exercises.reduce((s, e) => s + e.seconds, 0) / 60);

  return (
    <>
      <div className="tabs" role="tablist">
        <button className={`tab ${tab === 'slide' ? 'on' : ''}`} onClick={() => setTab('slide')}>
          Слайд
        </button>
        <button className={`tab ${tab === 'practice' ? 'on' : ''}`} onClick={() => setTab('practice')}>
          Дасгал {exercises.length ? `· ${exercises.length}` : ''}
        </button>
      </div>

      <div style={{ display: tab === 'slide' ? 'block' : 'none' }}>
        {slide.embed ? (
          <>
            <iframe className="slide-frame" src={slide.embed} allowFullScreen title="Lesson slides" />
            <p className="small muted" style={{ marginTop: 8 }}>
              Слайд харагдахгүй бол{' '}
              <a href={slide.url} target="_blank" rel="noreferrer">
                шинэ цонхонд нээ
              </a>
              .
            </p>
          </>
        ) : (
          <div className="empty">Багш энэ хичээлийн слайдыг хараахан оруулаагүй байна.</div>
        )}
        {exercises.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <button className="btn" onClick={() => setTab('practice')}>
              Дасгал руу шилжих →
            </button>
          </div>
        )}
      </div>

      <div style={{ display: tab === 'practice' ? 'block' : 'none' }}>
        {exercises.length === 0 ? (
          <div className="empty">Энэ хичээлд дасгал байхгүй.</div>
        ) : (
          <>
            <div className="ex-bar">
              <div className="steps">
                {exercises.map((e, i) => (
                  <StepBox key={e.id} p={progress[e.id]} cur={current === e.id} onClick={done(progress[e.id]?.status) ? () => setView('result') : null}>
                    {i + 1}
                  </StepBox>
                ))}
                {bonus.map((e) => (
                  <StepBox key={e.id} p={progress[e.id]} cur={current === e.id} bonus>
                    +
                  </StepBox>
                ))}
              </div>
              <span id="timer-slot" className="timer-slot" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {current === 'intro' && (
                  <div className="ex-grid">
                    <div className="stack">
                      <p className="eyebrow">Practice · {exercises.length} exercises</p>
                      <h2>Бэлэн үү?</h2>
                      {intro && <p className="prompt">{intro}</p>}
                      <p className="muted">
                        Дасгал бүр өөрийн хугацаатай. Хариултаа <b>Check my work</b> дарж шалгана. Буруу бол засаад дахин
                        шалгаж болно — хугацаа дуусах хүртэл. Нийт {totalMin} орчим минут.
                      </p>
                      <div>
                        <button className="btn" onClick={() => setView(exercises[0].id)}>
                          1-р дасгалыг эхлэх
                        </button>
                      </div>
                    </div>
                    <div className="side">
                      <div className="panel small">
                        <p className="eyebrow" style={{ marginBottom: 6 }}>How it works</p>
                        <p>Эхний оролдлогоор зөв — 1 оноо.</p>
                        <p>Засаж байж зөв — 0.5 оноо.</p>
                        <p>Хугацаа дууссан — 0 оноо.</p>
                      </div>
                    </div>
                  </div>
                )}

                {ex && (
                  <Exercise
                    key={ex.id}
                    lessonId={lessonId}
                    ex={ex}
                    number={index >= 0 ? index + 1 : null}
                    isBonus={index < 0}
                    progress={progress[ex.id]}
                    onUpdate={(patch) => update(ex.id, patch)}
                    onNext={goNext}
                    isLast={index === exercises.length - 1 || index < 0}
                  />
                )}

                {current === 'result' && (
                  <ResultView
                    lessonId={lessonId}
                    hasBonus={!!nextBonus}
                    onBonus={() => {
                      setDoingBonus(true);
                      setView(null);
                    }}
                    onBack={() => setView(null)}
                    showBack={!mainDone}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </>
  );
}

function StepBox({ p, cur, bonus, children, onClick }) {
  let cls = '';
  if (p?.status === 'solved') cls = p.attempts <= 1 ? 'ok' : 'half';
  else if (p?.status === 'timeout') cls = 'late';
  return (
    <span
      className={`step ${cls} ${cur ? 'cur' : ''} ${bonus ? 'bonus' : ''}`}
      title={bonus ? 'Нэмэлт дасгал' : undefined}
      onClick={onClick || undefined}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {children}
    </span>
  );
}
