export type UserRole = 'PLAYER' | 'ADMIN';

export interface User {
  id: string;
  player_code: string;
  display_name: string;
  team_name?: string | null;
  role: UserRole;
}

export type EventStatus = 'WAITING' | 'COUNTDOWN' | 'LIVE' | 'PAUSED' | 'ENDED';

export interface EventInfo {
  id: string;
  name: string;
  status: EventStatus;
  max_players: number;
  countdown_started_at: string | null;
  countdown_remaining_seconds?: number | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface Clue {
  id: string;
  level: number;
  clue_text: string;
  points: number;
}

export interface Question {
  id: string;
  question_number: number;
  question_text: string;
  category: string;
  answer?: string; // only present in admin or review
  accepted_aliases?: string[];
  is_active: boolean;
  clues?: Clue[];
}

export interface GameSession {
  id: string;
  event_id: string;
  user_id: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'DISQUALIFIED';
  current_question: number;
  current_clue_level: number;
  current_question_value: number;
  total_score: number;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
}

export interface QuestionAttempt {
  id: string;
  session_id: string;
  question_id: string;
  highest_clue_level: number;
  final_question_value: number;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  earned_points: number;
  submitted_at: string;
  question_number?: number;
  question_text?: string;
  category?: string;
}

export interface GameStateResponse {
  event: EventInfo;
  session: GameSession;
  question: Question | null;
  unlocked_clues: Clue[];
  already_attempted: QuestionAttempt | null;
  total_questions: number;
  deadline_at?: string | null;
  server_now?: string;
  is_expired?: boolean;
}

export interface ParticipantMatrixItem {
  user_id: string;
  player_code: string;
  display_name: string;
  team_name?: string | null;
  question_display: string;
  question_number: number;
  clue_display: string;
  clue_level: number;
  current_value: number;
  total_score: number;
  integrity_events_count?: number;
  status: 'WAITING' | 'READY' | 'LIVE' | 'PAUSED' | 'COMPLETED';
  last_updated: string | null;
}

export interface IntegrityLogItem {
  id: string;
  type: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AdminOverviewResponse {
  event: EventInfo;
  stats: {
    total_participants: number;
    waiting_count: number;
    in_progress_count: number;
    completed_count: number;
    total_questions: number;
    avg_score: number;
    max_score: number;
  };
  participants: ParticipantMatrixItem[];
}

export interface LeaderboardItem {
  rank: number;
  player_code: string;
  display_name: string;
  team_name?: string | null;
  total_score: number;
  questions_reached: number;
  status: string;
  completed_at: string | null;
}

export interface GameResultsSummary {
  session: GameSession;
  total_score: number;
  max_possible_score: number;
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  clues_used: number;
  answers_100_pt: number;
  answers_75_pt: number;
  answers_50_pt: number;
  answers_25_pt: number;
  attempts: QuestionAttempt[];
  player?: User;
}

