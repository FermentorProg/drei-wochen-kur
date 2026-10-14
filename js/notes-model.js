import { guitarPieces } from './goals-model.js';

// Sammelt alle Notizen aus Gewohnheiten und Aufgaben. filter: all | guitar | guitar:<stück> | sport | tasks
export function collectNotes(state, filter = 'all') {
  const out = [];
  const pieces = guitarPieces(state);
  for (const habit of ['guitar', 'sport']) {
    for (const [date, e] of Object.entries(state.habits[habit] || {})) {
      if (!e.note) continue;
      out.push({
        date, kind: habit, text: e.note, piece: e.piece || null, types: e.types || [],
        title: habit === 'guitar' ? (pieces[e.piece] || 'Gitarre') : 'Sport',
      });
    }
  }
  for (const t of state.tasks) {
    for (const n of t.notes || []) out.push({ date: n.date, kind: 'task', text: n.text, title: t.title, taskId: t.id, category: t.category });
  }
  const keep = (n) => {
    if (filter === 'all') return true;
    if (filter === 'tasks') return n.kind === 'task';
    if (filter.startsWith('guitar:')) return n.kind === 'guitar' && n.piece === filter.slice(7);
    return n.kind === filter;
  };
  return out.filter(keep).sort((a, b) => b.date.localeCompare(a.date));
}
