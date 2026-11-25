// What the browser is allowed to see of an exercise: no answers, no accepted lists, no solution.
import crypto from 'crypto';

function seededShuffle(arr, seed) {
  const a = arr.map((v, i) => ({ v, k: crypto.createHash('md5').update(seed + ':' + i).digest('hex') }));
  a.sort((x, y) => (x.k < y.k ? -1 : 1));
  return a.map((x) => x.v);
}

export function publicExercise(ex, seed, { withSolution = false } = {}) {
  const pub = {
    id: ex.id,
    type: ex.type,
    label: ex.label,
    title: ex.title,
    prompt: ex.prompt,
    code: ex.code || null,
    before: ex.before || null,
    table: ex.table || null,
    options: ex.type === 'mcq' ? ex.options : null,
    seconds: ex.seconds || 180,
    source: ex.source || null,
    blanks: ex.type === 'fill' ? (ex.code.match(/___/g) || []).length : 0,
  };
  if (ex.type === 'order') {
    let items = ex.lines.map((text, i) => ({ id: i, text }));
    let shuffled = seededShuffle(items, seed + ex.id);
    // never start already solved
    if (shuffled.every((x, i) => x.id === i)) shuffled = [...shuffled.slice(1), shuffled[0]];
    pub.lines = shuffled;
  }
  if (withSolution) pub.solution = ex.solution || null;
  return pub;
}

export function findExercise(set, id) {
  return [...set.exercises, ...(set.bonus || [])].find((e) => e.id === id) || null;
}

export function isBonus(set, id) {
  return (set.bonus || []).some((e) => e.id === id);
}
