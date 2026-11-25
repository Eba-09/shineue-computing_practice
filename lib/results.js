// Turns progress + attempts rows into per-student and per-exercise results.
const GRACE_MS = 10_000;

export function effectiveStatus(p, ex, now = Date.now()) {
  if (!p) return 'none';
  if (p.status === 'solved' || p.status === 'timeout') return p.status;
  const deadline = new Date(p.started_at).getTime() + (ex.seconds || 180) * 1000 + GRACE_MS;
  return now > deadline ? 'timeout' : 'open';
}

export function points(status, attempts) {
  if (status !== 'solved') return 0;
  return attempts <= 1 ? 1 : 0.5;
}

export function timeUsed(p, ex) {
  if (!p) return null;
  const start = new Date(p.started_at).getTime();
  const end = p.finished_at ? new Date(p.finished_at).getTime() : null;
  if (!end) return null;
  return Math.min(Math.round((end - start) / 1000), ex.seconds || 180);
}

export function studentResult(set, progressRows, attemptRows, now = Date.now()) {
  const all = [...set.exercises.map((e) => ({ ...e, bonus: false })), ...(set.bonus || []).map((e) => ({ ...e, bonus: true }))];
  const rows = all.map((ex) => {
    const p = progressRows.find((r) => r.exercise_id === ex.id);
    const status = effectiveStatus(p, ex, now);
    const attempts = p?.attempts || 0;
    const wrong = attemptRows.filter((a) => a.exercise_id === ex.id && !a.correct).map((a) => a.answer);
    return {
      id: ex.id,
      bonus: ex.bonus,
      label: ex.label,
      title: ex.title,
      type: ex.type,
      status,
      attempts,
      seconds: ex.seconds || 180,
      used: timeUsed(p, ex),
      points: points(status, attempts),
      wrong,
    };
  });
  const main = rows.filter((r) => !r.bonus);
  return {
    rows,
    score: main.reduce((s, r) => s + r.points, 0),
    max: main.length,
    finished: main.every((r) => r.status === 'solved' || r.status === 'timeout'),
  };
}

function normWrong(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

export function classResults(set, students, progressRows, attemptRows, now = Date.now()) {
  const perStudent = students.map((st) => {
    const r = studentResult(
      set,
      progressRows.filter((p) => p.student_id === st.id),
      attemptRows.filter((a) => a.student_id === st.id),
      now
    );
    return { id: st.id, name: st.name, ...r };
  });

  const all = [...set.exercises, ...(set.bonus || [])];
  const perExercise = all.map((ex) => {
    const cells = perStudent.map((s) => s.rows.find((r) => r.id === ex.id));
    const started = cells.filter((c) => c.status !== 'none');
    const first = cells.filter((c) => c.status === 'solved' && c.attempts <= 1).length;
    const later = cells.filter((c) => c.status === 'solved' && c.attempts > 1).length;
    const timeout = cells.filter((c) => c.status === 'timeout').length;
    const open = cells.filter((c) => c.status === 'open').length;
    const counts = {};
    attemptRows
      .filter((a) => a.exercise_id === ex.id && !a.correct)
      .forEach((a) => {
        const k = normWrong(a.answer);
        counts[k] = (counts[k] || 0) + 1;
      });
    const commonWrong = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([answer, n]) => ({ answer, n }));
    const usedTimes = cells.filter((c) => c.status === 'solved' && c.used != null).map((c) => c.used);
    return {
      id: ex.id,
      title: ex.title,
      label: ex.label,
      type: ex.type,
      bonus: (set.bonus || []).some((b) => b.id === ex.id),
      seconds: ex.seconds || 180,
      started: started.length,
      first,
      later,
      timeout,
      open,
      avgTime: usedTimes.length ? Math.round(usedTimes.reduce((a, b) => a + b, 0) / usedTimes.length) : null,
      commonWrong,
      solution: ex.solution || null,
    };
  });

  return { perStudent, perExercise };
}
