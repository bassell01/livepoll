import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createStore, validatePoll } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function buildServer({ seed = true } = {}) {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });
  const store = createStore({ seed });

  app.use(express.json());

  const broadcast = (msg) => {
    const data = JSON.stringify(msg);
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(data);
    }
  };

  wss.on('connection', (socket) => {
    socket.send(JSON.stringify({ type: 'init', polls: store.list() }));
    broadcast({ type: 'presence', count: wss.clients.size });
    socket.on('close', () => broadcast({ type: 'presence', count: wss.clients.size }));
  });

  app.get('/api/polls', (_req, res) => res.json(store.list()));

  app.get('/api/polls/:id', (req, res) => {
    const poll = store.get(req.params.id);
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    res.json(poll);
  });

  app.post('/api/polls', (req, res) => {
    const error = validatePoll(req.body || {});
    if (error) return res.status(400).json({ error });
    const poll = store.create(req.body);
    broadcast({ type: 'poll_created', poll });
    res.status(201).json(poll);
  });

  app.post('/api/polls/:id/vote', (req, res) => {
    const poll = store.vote(req.params.id, req.body?.optionId);
    if (!poll) return res.status(404).json({ error: 'Poll or option not found' });
    broadcast({ type: 'poll_updated', poll });
    res.json(poll);
  });

  // serve the built frontend when it exists (production mode)
  const dist = path.join(__dirname, '..', '..', 'web', 'dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  return { app, server, wss, store };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const port = process.env.PORT || 4000;
  const { server } = buildServer();
  server.listen(port, () => console.log(`LivePulse server on http://localhost:${port}`));
}
