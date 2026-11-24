import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PollCard } from '../src/PollCard';
import { CreatePoll } from '../src/CreatePoll';
import type { Poll } from '../src/types';

const poll: Poll = {
  id: 'poll-1',
  question: 'Tabs or spaces?',
  category: 'Tech',
  createdAt: '2026-11-25T00:00:00.000Z',
  totalVotes: 4,
  options: [
    { id: 'a', text: 'Tabs', votes: 3 },
    { id: 'b', text: 'Spaces', votes: 1 },
  ],
};

describe('PollCard', () => {
  it('renders question, options, category and total votes', () => {
    render(<PollCard poll={poll} votedOptionId={null} onVote={() => {}} />);
    expect(screen.getByText('Tabs or spaces?')).toBeInTheDocument();
    expect(screen.getByText('Tabs')).toBeInTheDocument();
    expect(screen.getByText('Spaces')).toBeInTheDocument();
    expect(screen.getByText('Tech')).toBeInTheDocument();
    expect(screen.getByText('4 votes')).toBeInTheDocument();
  });

  it('calls onVote with the chosen option', () => {
    const onVote = vi.fn();
    render(<PollCard poll={poll} votedOptionId={null} onVote={onVote} />);
    fireEvent.click(screen.getByText('Spaces'));
    expect(onVote).toHaveBeenCalledWith('poll-1', 'b');
  });

  it('shows percentages and marks your vote after voting', () => {
    render(<PollCard poll={poll} votedOptionId="a" onVote={() => {}} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('· your vote')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tabs' })).not.toBeInTheDocument();
  });
});

describe('CreatePoll', () => {
  it('rejects fewer than 2 options', async () => {
    render(<CreatePoll onCreate={vi.fn()} onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Ask something...'), {
      target: { value: 'Pick one' },
    });
    fireEvent.change(screen.getByPlaceholderText('Option 1'), { target: { value: 'Yes' } });
    fireEvent.click(screen.getByText('Create poll'));
    expect(await screen.findByText('A poll needs at least 2 options.')).toBeInTheDocument();
  });

  it('submits trimmed values and closes on success', async () => {
    const onCreate = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    render(<CreatePoll onCreate={onCreate} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText('Ask something...'), {
      target: { value: '  Coffee or tea?  ' },
    });
    fireEvent.change(screen.getByPlaceholderText('Option 1'), { target: { value: 'Coffee' } });
    fireEvent.change(screen.getByPlaceholderText('Option 2'), { target: { value: 'Tea' } });
    fireEvent.click(screen.getByText('Create poll'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onCreate).toHaveBeenCalledWith('Coffee or tea?', 'General', ['Coffee', 'Tea']);
  });

  it('adds and removes option fields', () => {
    render(<CreatePoll onCreate={vi.fn()} onClose={() => {}} />);
    fireEvent.click(screen.getByText('+ Add option'));
    expect(screen.getByPlaceholderText('Option 3')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Remove option 3'));
    expect(screen.queryByPlaceholderText('Option 3')).not.toBeInTheDocument();
  });
});
