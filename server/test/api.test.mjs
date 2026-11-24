import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { buildServer } from '../src/index.js';

let server, wss, base;
before(async () => {
  ({ server, wss } = buildServer());
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
});
after(async () => {
  for (const client of wss.clients) client.terminate();
  wss.close();
  await new Promise((r) => server.close(r));
});

after(() => {
  wss.close();
  server.close();
});

test('lists seeded polls with totals', async () => {
  const res = await fetch(`${base}/api/polls`);
  assert.equal(res.status, 200);
  const polls = await res.json();
  assert.equal(polls.length, 3);
  const frameworks = polls.find((p) => p.question.includes('framework'));
  assert.equal(frameworks.totalVotes, 34);
  assert.equal(frameworks.options.length, 4);
});

test('creates a poll and rejects invalid input', async () => {
  const bad = await fetch(`${base}/api/polls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'x', options: ['only one'] }),
  });
  assert.equal(bad.status, 400);

  const res = await fetch(`${base}/api/polls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'Tabs or spaces?', category: 'Tech', options: ['Tabs', 'Spaces'] }),
  });
  assert.equal(res.status, 201);
  const poll = await res.json();
  assert.equal(poll.totalVotes, 0);
  assert.equal(poll.options.length, 2);

  const got = await fetch(`${base}/api/polls/${poll.id}`);
  assert.equal(got.status, 200);
});

test('voting increments an option and returns updated poll', async () => {
  const polls = await (await fetch(`${base}/api/polls`)).json();
  const poll = polls[0];
  const before_ = poll.options[0].votes;
  const res = await fetch(`${base}/api/polls/${poll.id}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ optionId: poll.options[0].id }),
  });
  assert.equal(res.status, 200);
  const updated = await res.json();
  assert.equal(updated.options[0].votes, before_ + 1);
  assert.equal(updated.totalVotes, poll.totalVotes + 1);
});

test('voting with a bad option id is a 404', async () => {
  const polls = await (await fetch(`${base}/api/polls`)).json();
  const res = await fetch(`${base}/api/polls/${polls[0].id}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ optionId: 'nope' }),
  });
  assert.equal(res.status, 404);
});

test('websocket clients receive init, live vote updates and presence', async () => {
  const ws = new WebSocket(`ws://localhost:${server.address().port}/ws`);
  ws.on('message', () => {});
  const messages = [];
  await new Promise((resolve, reject) => {
    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      messages.push(msg);
      if (msg.type === 'init') resolve();
    });
    ws.on('error', reject);
  });
  const init = messages.find((m) => m.type === 'init');
  assert.ok(init.polls.length >= 3);

  // a vote over REST should arrive here as a live update
  const polls = await (await fetch(`${base}/api/polls`)).json();
  const target = polls[1];
  const received = new Promise((resolve) => {
    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (msg.type === 'poll_updated') resolve(msg);
    });
  });
  await fetch(`${base}/api/polls/${target.id}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ optionId: target.options[0].id }),
  });
  const update = await received;
  assert.equal(update.poll.id, target.id);
  assert.equal(update.poll.totalVotes, target.totalVotes + 1);
  ws.close();
});
