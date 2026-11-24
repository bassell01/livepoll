// In-memory poll store. A real product would swap this for Postgres;
// the API surface stays the same.
let nextId = 1;

function makePoll(question, category, options, votes = []) {
  return {
    id: `poll-${nextId++}`,
    question,
    category,
    options: options.map((text, i) => ({ id: `opt-${nextId}-${i}`, text, votes: votes[i] || 0 })),
    createdAt: new Date().toISOString(),
  };
}

export function createStore({ seed = true } = {}) {
  const polls = [];

  if (seed) {
    const p1 = makePoll('Best framework for a new web app?', 'Tech', ['React', 'Vue', 'Svelte', 'Angular'], [14, 9, 7, 4]);
    const p2 = makePoll('Remote or office?', 'Work', ['Fully remote', 'Hybrid', 'Office'], [21, 15, 3]);
    const p3 = makePoll('Friday team lunch: what should we order?', 'Fun', ['Pizza', 'Burgers', 'Sushi', 'Salads'], [8, 11, 6, 2]);
    polls.push(p1, p2, p3);
  }

  function totals(poll) {
    return poll.options.reduce((sum, o) => sum + o.votes, 0);
  }

  return {
    list() {
      return polls
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((p) => ({ ...p, totalVotes: totals(p) }));
    },
    get(id) {
      const p = polls.find((x) => x.id === id);
      return p ? { ...p, totalVotes: totals(p) } : null;
    },
    create({ question, category, options }) {
      const poll = makePoll(question, category || 'General', options);
      polls.push(poll);
      return { ...poll, totalVotes: 0 };
    },
    vote(id, optionId) {
      const p = polls.find((x) => x.id === id);
      if (!p) return null;
      const opt = p.options.find((o) => o.id === optionId);
      if (!opt) return null;
      opt.votes += 1;
      return { ...p, totalVotes: totals(p) };
    },
  };
}

export function validatePoll({ question, options }) {
  if (typeof question !== 'string' || question.trim().length < 3 || question.trim().length > 160) {
    return 'Question must be 3-160 characters.';
  }
  if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
    return 'A poll needs 2-6 options.';
  }
  if (options.some((o) => typeof o !== 'string' || o.trim().length === 0)) {
    return 'Options cannot be empty.';
  }
  return null;
}
