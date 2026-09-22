import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GameStateResponse } from '../types/index.js';
import { request, ApiError } from '../utils/api.js';
import { useAuth } from './AuthContext.js';

interface GameContextType {
  gameState: GameStateResponse | null;
  loading: boolean;
  isReconnecting: boolean;
  countdown: number | null;
  error: string | null;
  fetchGameState: () => Promise<void>;
  revealClue: (requestedLevel?: number) => Promise<void>;
  submitAnswer: (answer: string) => Promise<{
    is_correct: boolean;
    earned_points: number;
    total_score: number;
    correct_answer: string;
    user_answer: string;
  }>;
  nextQuestion: () => Promise<boolean>; // returns true if game completed
  clearError: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameStateResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchGameState = useCallback(async () => {
    if (!user || user.role !== 'PLAYER') {
      setLoading(false);
      return;
    }

    try {
      const data = await request<GameStateResponse>('/game/state');

      // Server Authoritative Countdown Handling
      if (data.event.status === 'COUNTDOWN' && data.event.countdown_started_at) {
        const elapsedMs = Date.now() - new Date(data.event.countdown_started_at).getTime();
        const elapsedSec = elapsedMs / 1000;
        const remaining = Math.max(0, Math.ceil(5 - elapsedSec));
        setCountdown(remaining);
      } else if (data.event.status === 'LIVE' && countdown !== null && countdown > 0) {
        // Just transitioned to LIVE, flash GO briefly
        setCountdown(0);
        setTimeout(() => setCountdown(null), 800);
      } else {
        setCountdown(null);
      }

      setGameState(data);
      setIsReconnecting(false);
      setError(null);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 0) {
        setIsReconnecting(true);
      } else {
        setError(err.message || 'Unable to synchronize game state');
      }
    } finally {
      setLoading(false);
    }
  }, [user, countdown]);

  // Periodic Polling to detect Coordinator State transitions
  useEffect(() => {
    if (!user || user.role !== 'PLAYER') return;

    fetchGameState();

    const interval = setInterval(() => {
      fetchGameState();
    }, 2000); // 2-second heartbeat

    return () => clearInterval(interval);
  }, [user, fetchGameState]);

  const revealClue = async (requestedLevel?: number) => {
    if (!gameState) return;
    try {
      setError(null);
      const updated = await request<GameStateResponse>('/game/reveal-clue', {
        method: 'POST',
        body: JSON.stringify({ requested_level: requestedLevel }),
      });
      setGameState(updated);
    } catch (err: any) {
      setError(err.message || 'Could not reveal clue');
      throw err;
    }
  };

  const submitAnswer = async (answer: string) => {
    try {
      setError(null);
      const result = await request<{
        is_correct: boolean;
        earned_points: number;
        total_score: number;
        correct_answer: string;
        user_answer: string;
      }>('/game/submit-answer', {
        method: 'POST',
        body: JSON.stringify({ answer: answer.trim().toUpperCase() }),
      });

      // Synchronize latest state
      await fetchGameState();
      return result;
    } catch (err: any) {
      setError(err.message || 'Could not submit answer');
      throw err;
    }
  };

  const nextQuestion = async (): Promise<boolean> => {
    try {
      setError(null);
      const res = await request<{ is_complete: boolean } & GameStateResponse>('/game/next-question', {
        method: 'POST',
      });
      setGameState(res);
      return res.is_complete || false;
    } catch (err: any) {
      setError(err.message || 'Could not advance to next question');
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <GameContext.Provider
      value={{
        gameState,
        loading,
        isReconnecting,
        countdown,
        error,
        fetchGameState,
        revealClue,
        submitAnswer,
        nextQuestion,
        clearError,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
