import type { Poll } from './types';
import { categoryColor } from './types';

interface Props {
  poll: Poll;
  votedOptionId: string | null;
  onVote: (pollId: string, optionId: string) => void;
}

export function PollCard({ poll, votedOptionId, onVote }: Props) {
  const voted = votedOptionId !== null;
  const leader = Math.max(...poll.options.map((o) => o.votes));

  return (
    <div className="poll-card" data-testid={`poll-${poll.id}`}>
      <div className="poll-card-top">
        <span className="chip" style={{ background: categoryColor(poll.category) }}>
          {poll.category}
        </span>
        <span className="votes-label">{poll.totalVotes} votes</span>
      </div>
      <h3>{poll.question}</h3>
      <div className="options">
        {poll.options.map((opt) => {
          const pct = poll.totalVotes ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
          if (!voted) {
            return (
              <button key={opt.id} className="vote-btn" onClick={() => onVote(poll.id, opt.id)}>
                {opt.text}
              </button>
            );
          }
          return (
            <div key={opt.id} className="result-row" data-testid={`result-${opt.id}`}>
              <div className="result-labels">
                <span>
                  {opt.text}
                  {opt.id === votedOptionId && <span className="you-voted"> · your vote</span>}
                </span>
                <span>{pct}%</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${pct}%`,
                    background:
                      opt.votes === leader && poll.totalVotes > 0
                        ? 'linear-gradient(90deg,#6366F1,#8B5CF6)'
                        : '#2A3350',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
