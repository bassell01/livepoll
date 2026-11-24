import { useState } from 'react';
import { usePolls } from './usePolls';
import { PollCard } from './PollCard';
import { CreatePoll } from './CreatePoll';

function readVoted(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem('livepoll-votes') || '{}');
  } catch {
    return {};
  }
}

export default function App() {
  const { polls, viewers, connected, vote, createPoll } = usePolls();
  const [votes, setVotes] = useState<Record<string, string>>(readVoted);
  const [showCreate, setShowCreate] = useState(false);

  const handleVote = async (pollId: string, optionId: string) => {
    const ok = await vote(pollId, optionId);
    if (ok) {
      const next = { ...votes, [pollId]: optionId };
      setVotes(next);
      localStorage.setItem('livepoll-votes', JSON.stringify(next));
    }
  };

  const totalVotes = polls.reduce((s, p) => s + p.totalVotes, 0);

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-inner">
          <div className="brand">
            <span className="logo">◉</span> LivePulse
          </div>
          <p className="tagline">Real-time polls. Watch votes land as they happen.</p>
          <div className="hero-stats">
            <div className="stat">
              <strong>{polls.length}</strong>
              <span>open polls</span>
            </div>
            <div className="stat">
              <strong>{totalVotes}</strong>
              <span>votes cast</span>
            </div>
            <div className="stat">
              <strong>
                <span className={`live-dot ${connected ? 'on' : ''}`} />
                {viewers}
              </strong>
              <span>{viewers === 1 ? 'person' : 'people'} here now</span>
            </div>
          </div>
        </div>
      </header>

      <main className="feed">
        {polls.map((poll) => (
          <PollCard key={poll.id} poll={poll} votedOptionId={votes[poll.id] ?? null} onVote={handleVote} />
        ))}
        {polls.length === 0 && <p className="empty">No polls yet. Create the first one!</p>}
      </main>

      <button className="fab" onClick={() => setShowCreate(true)}>
        + New poll
      </button>
      {showCreate && <CreatePoll onCreate={createPoll} onClose={() => setShowCreate(false)} />}
    </div>
  );
}
