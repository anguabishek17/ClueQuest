-- =========================================================================
-- CLUE QUEST: Database Schema (PostgreSQL / Neon)
-- Department of Electronics & Communication Engineering, VSB Engineering College
-- =========================================================================

-- Enable UUID extension if supported
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    player_code VARCHAR(32) UNIQUE NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    team_name VARCHAR(60),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(16) NOT NULL DEFAULT 'PLAYER' CHECK (role IN ('PLAYER', 'ADMIN')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_player_code ON users(player_code);
CREATE INDEX IF NOT EXISTS idx_users_team_name ON users(team_name);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'COUNTDOWN', 'LIVE', 'PAUSED', 'ENDED')),
    max_players INTEGER NOT NULL DEFAULT 40,
    countdown_started_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(64) PRIMARY KEY,
    question_number INTEGER NOT NULL UNIQUE,
    question_text TEXT NOT NULL,
    answer VARCHAR(255) NOT NULL,
    accepted_aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
    category VARCHAR(64) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_questions_number ON questions(question_number);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(is_active);

-- Clues Table
CREATE TABLE IF NOT EXISTS clues (
    id VARCHAR(64) PRIMARY KEY,
    question_id VARCHAR(64) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 4),
    clue_text TEXT NOT NULL,
    points INTEGER NOT NULL CHECK (points IN (100, 75, 50, 25)),
    CONSTRAINT unq_question_level UNIQUE (question_id, level)
);

CREATE INDEX IF NOT EXISTS idx_clues_question_id ON clues(question_id);
CREATE INDEX IF NOT EXISTS idx_clues_level ON clues(level);

-- Game Sessions Table
CREATE TABLE IF NOT EXISTS game_sessions (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'DISQUALIFIED')),
    current_question INTEGER NOT NULL DEFAULT 1,
    current_clue_level INTEGER NOT NULL DEFAULT 1 CHECK (current_clue_level BETWEEN 1 AND 4),
    current_question_value INTEGER NOT NULL DEFAULT 100 CHECK (current_question_value IN (100, 75, 50, 25)),
    total_score INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_user_event_session UNIQUE (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_event_id ON game_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_score ON game_sessions(total_score DESC);

-- Question Attempts Table
CREATE TABLE IF NOT EXISTS question_attempts (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(64) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    highest_clue_level INTEGER NOT NULL CHECK (highest_clue_level BETWEEN 1 AND 4),
    final_question_value INTEGER NOT NULL CHECK (final_question_value IN (100, 75, 50, 25)),
    user_answer TEXT NOT NULL,
    correct_answer VARCHAR(255) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    earned_points INTEGER NOT NULL DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_session_question_attempt UNIQUE (session_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_attempts_session_id ON question_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_attempts_question_id ON question_attempts(question_id);

-- Event Logs / Audit Table
CREATE TABLE IF NOT EXISTS event_logs (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) REFERENCES events(id) ON DELETE SET NULL,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logs_event_id ON event_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON event_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_action ON event_logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON event_logs(created_at DESC);
