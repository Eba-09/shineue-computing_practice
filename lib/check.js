// Answer checking. Runs on the server only — answers never reach the browser.

// Split a line into code and string literals so spaces inside strings are kept.
function tokens(line) {
  const out = [];
  let i = 0;
  let buf = '';
  while (i < line.length) {
    const ch = line[i];
    if (ch === '"' || ch === "'") {
      if (buf) out.push({ code: buf }), (buf = '');
      let j = i + 1;
      while (j < line.length && line[j] !== ch) j += line[j] === '\\' ? 2 : 1;
      out.push({ str: line.slice(i + 1, j), closed: j < line.length });
      i = j + 1;
      continue;
    }
    if (ch === '#') break; // comment
    buf += ch;
    i++;
  }
  if (buf) out.push({ code: buf });
  return out;
}

// One line of code without its indentation: spaces outside strings removed, one quote style.
export function normLine(line) {
  return tokens(String(line).replace(/[“”]/g, '"').replace(/[‘’]/g, "'"))
    .map((t) => (t.code !== undefined ? t.code.replace(/\s+/g, '') : `"${t.str}${t.closed ? '"' : ''}`))
    .join('');
}

// Whole program: indentation turned into levels (2 or 4 spaces both work), blank lines dropped.
export function normCode(src) {
  const lines = String(src || '')
    .replace(/\r/g, '')
    .replace(/\t/g, '    ')
    .split('\n')
    .map((l) => ({ ind: l.match(/^ */)[0].length, body: normLine(l) }))
    .filter((l) => l.body !== '');
  const widths = [...new Set(lines.map((l) => l.ind))].sort((a, b) => a - b);
  return lines.map((l) => `${widths.indexOf(l.ind)}|${l.body}`).join('\n');
}

function normOutput(s, ci) {
  let t = String(s || '').replace(/\r/g, '').trim();
  if (/^".*"$/s.test(t) || /^'.*'$/s.test(t)) t = t.slice(1, -1);
  t = t.replace(/\s+/g, ' ').trim();
  return ci ? t.toLowerCase() : t;
}

function matches(value, accepted, norm) {
  const v = norm(value);
  return accepted.some((a) => {
    if (typeof a === 'string' && a.startsWith('re:')) return new RegExp(a.slice(3)).test(v);
    return norm(a) === v;
  });
}

// Returns true / false for a submitted answer.
export function checkAnswer(ex, answer) {
  switch (ex.type) {
    case 'mcq':
      return Number(answer) === ex.answer;
    case 'output':
      return matches(answer, ex.accept, (s) => normOutput(s, ex.ci));
    case 'fill': {
      const vals = Array.isArray(answer) ? answer : [];
      return ex.accept.every((acc, i) => matches(vals[i] ?? '', acc, normLine));
    }
    case 'fix':
    case 'write':
      return matches(answer, ex.accept, normCode);
    case 'order': {
      const order = Array.isArray(answer) ? answer.map(Number) : [];
      const valid = ex.orders || [ex.lines.map((_, i) => i)];
      return valid.some((o) => o.length === order.length && o.every((x, i) => x === order[i]));
    }
    default:
      return false;
  }
}

// Text stored in the attempts log, readable on the teacher dashboard.
export function answerText(ex, answer) {
  if (ex.type === 'mcq') return ex.options[Number(answer)] ?? String(answer);
  if (ex.type === 'fill') return (Array.isArray(answer) ? answer : []).map((v) => v || '∅').join('  |  ');
  if (ex.type === 'order')
    return (Array.isArray(answer) ? answer : []).map((i) => ex.lines[Number(i)]?.trim()).join(' / ');
  return String(answer ?? '');
}
