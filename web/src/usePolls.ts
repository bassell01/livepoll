import { useCallback, useEffect, useRef, useState } from 'react';
import type { Poll, ServerMessage } from './types';

// Live poll feed: one WebSocket carries the initial list, new polls,
// vote updates and viewer presence. Falls back to a REST fetch when the
// socket is unavailable (e.g. in tests).
export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [viewers, setViewers] = useState(0);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as ServerMessage;
      if (msg.type === 'init') setPolls(msg.polls);
      if (msg.type === 'poll_created') setPolls((prev) => [msg.poll, ...prev]);
      if (msg.type === 'poll_updated') {
        setPolls((prev) => prev.map((p) => (p.id === msg.poll.id ? msg.poll : p)));
      }
      if (msg.type === 'presence') setViewers(msg.count);
    };

    // REST fallback so the page is never empty
    fetch('/api/polls')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setPolls((prev) => (prev.length ? prev : data));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      ws.close();
    };
  }, []);

  const vote = useCallback(async (pollId: string, optionId: string) => {
    const res = await fetch(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId }),
    });
    if (res.ok) {
      const updated = (await res.json()) as Poll;
      setPolls((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    }
    return res.ok;
  }, []);

  const createPoll = useCallback(async (question: string, category: string, options: string[]) => {
    const res = await fetch('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, category, options }),
    });
    return res.ok;
  }, []);

  return { polls, viewers, connected, vote, createPoll };
}
