export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  category: string;
  options: PollOption[];
  createdAt: string;
  totalVotes: number;
}

export type ServerMessage =
  | { type: 'init'; polls: Poll[] }
  | { type: 'poll_created'; poll: Poll }
  | { type: 'poll_updated'; poll: Poll }
  | { type: 'presence'; count: number };

export const CATEGORY_COLORS: Record<string, string> = {
  Tech: '#6366F1',
  Work: '#0EA5E9',
  Fun: '#F59E0B',
  General: '#8B5CF6',
};

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.General;
}
