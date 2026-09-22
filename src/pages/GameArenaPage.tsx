import React, { useState, useEffect, useRef } from 'react';
import { Cpu, AlertTriangle, CheckCircle2, ChevronRight, Pause, Layers, ShieldAlert, X } from 'lucide-react';
import { useGame } from '../context/GameContext.js';
import { ScoreMeter } from '../components/game/ScoreMeter.js';
import { ClueCard } from '../components/game/ClueCard.js';
import { AnswerForm } from '../components/game/AnswerForm.js';
import { ResultModal } from '../components/game/ResultModal.js';
import { ReconnectBanner } from '../components/game/ReconnectBanner.js';
import { FullscreenGuard } from '../components/game/FullscreenGuard.js';
import { ECEChipMotif } from '../components/layout/ECEChipMotif.js';
import { setupIntegrityMonitor, IntegrityEventType } from '../utils/integrityMonitor.js';

interface GameArenaPageProps {
  onGameComplete: () => void;
}

export const GameArenaPage: React.FC<GameArenaPageProps> = ({ onGameComplete }) => {
  const {
    gameState,
    loading,
    isReconnecting,
    error,
    fetchGameState,
    revealClue,
    submitAnswer,
    nextQuestion,
  } = useGame();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Fullscreen & Integrity Guard State
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const [isFullscreenExitWarning, setIsFullscreenExitWarning] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [latestWarning, setLatestWarning] = useState<string | null>(null);

  const [modalResult, setModalResult] = useState<{
    isOpen: boolean;
    isCorrect: boolean;
    earnedPoints: number;
    totalScore: number;
    correctAnswer: string;
    userAnswer: string;
    questionNumber: number;
  } | null>(null);

  // Check initial fullscreen state and request fullscreen
  const enterFullscreenMode = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreenModalOpen(false);
      setIsFullscreenExitWarning(false);
    } catch (err) {
      console.warn('Fullscreen request blocked, user interaction required:', err);
      setIsFullscreenModalOpen(true);
    }
  };

  useEffect(() => {
    // Check if already in fullscreen
    if (!document.fullscreenElement) {
      // Attempt automatic fullscreen (or show prompt modal if browser requires interaction)
      enterFullscreenMode();
    }

    // Attach integrity & activity monitor
    const cleanup = setupIntegrityMonitor({
      onViolation: (type: IntegrityEventType, message: string) => {
        setViolationCount((prev) => prev + 1);
        setLatestWarning(message);
        // Auto-dismiss notification after 4 seconds
        setTimeout(() => {
          setLatestWarning((current) => (current === message ? null : current));
        }, 4000);
      },
      onFullscreenExit: () => {
        setIsFullscreenExitWarning(true);
        setIsFullscreenModalOpen(true);
      },
    });

    return () => {
      cleanup();
    };
  }, []);

  if (loading || !gameState) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center font-mono text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <Cpu className="w-10 h-10 animate-spin" />
          <span>INITIALIZING AUTHORITATIVE GAME MATRIX...</span>
        </div>
      </div>
    );
  }

  const { session, question, unlocked_clues, already_attempted, event } = gameState;

  // Handle Event Paused
  if (event.status === 'PAUSED') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="tech-card p-8 rounded-xl border border-amber-500/40 text-center max-w-md">
          <Pause className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-mono font-bold text-amber-300 mb-2">EVENT PAUSED</h2>
          <p className="text-xs font-mono text-slate-400">
            The coordinator has temporarily paused the quest. Your progress and remaining time are preserved.
          </p>
        </div>
      </div>
    );
  }

  // Handle Game Completed
  if (session.status === 'COMPLETED' || !question) {
    onGameComplete();
    return null;
  }

  const currentQuestionNumber = session.current_question;
  const currentClueLevel = session.current_clue_level;
  const currentQuestionValue = session.current_question_value;
  const totalScore = session.total_score || 0;

  // Find clue text by level from unlocked clues
  const getClueText = (level: number) => {
    const c = unlocked_clues.find((item) => item.level === level);
    return c ? c.clue_text : undefined;
  };

  const handleRevealNext = async (levelToUnlock: number) => {
    if (levelToUnlock !== currentClueLevel + 1) return;
    try {
      setIsRevealing(true);
      await revealClue();
    } finally {
      setIsRevealing(false);
    }
  };

  const handleSubmit = async (answer: string) => {
    try {
      setIsSubmitting(true);
      const res = await submitAnswer(answer);
      setModalResult({
        isOpen: true,
        isCorrect: res.is_correct,
        earnedPoints: res.earned_points,
        totalScore: res.total_score,
        correctAnswer: res.correct_answer,
        userAnswer: res.user_answer,
        questionNumber: currentQuestionNumber,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    try {
      setIsAdvancing(true);
      const isComplete = await nextQuestion();
      setModalResult(null);
      if (isComplete) {
        onGameComplete();
      }
    } finally {
      setIsAdvancing(false);
    }
  };

  return (
    <div className="relative min-h-screen pb-16">
      <ECEChipMotif />

      {/* Fullscreen Guard Modal */}
      <FullscreenGuard
        isOpen={isFullscreenModalOpen}
        isExitWarning={isFullscreenExitWarning}
        violationCount={violationCount}
        onEnterFullscreen={enterFullscreenMode}
      />

      {/* Non-intrusive Activity Warning Toast */}
      {latestWarning && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-sm p-4 rounded-xl bg-navy-950/95 border border-amber-500/50 shadow-2xl backdrop-blur-md animate-fade-in flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1 text-left">
            <span className="text-[11px] font-mono font-bold uppercase text-amber-400 block mb-0.5">
              ⚠ ACTIVITY RECORDED
            </span>
            <p className="text-xs font-sans text-slate-300 leading-snug">{latestWarning}</p>
          </div>
          <button
            onClick={() => setLatestWarning(null)}
            className="text-slate-500 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isReconnecting && <ReconnectBanner onRetry={fetchGameState} />}

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchGameState()}
              className="underline hover:text-white font-bold"
            >
              SYNC
            </button>
          </div>
        )}

        {/* Dynamic Score & Value Stepper */}
        <ScoreMeter currentValue={currentQuestionValue} totalScore={totalScore} />

        {/* Question Card */}
        <div className="tech-card rounded-xl p-6 sm:p-8 border border-cyan-500/40 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded border border-cyan-500/30">
                QUESTION {String(currentQuestionNumber).padStart(2, '0')} / 20
              </span>
              <span className="text-xs font-mono uppercase bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-700">
                {question.category}
              </span>
            </div>

            <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>CLUES UNLOCKED: {currentClueLevel} / 4</span>
            </div>
          </div>

          <h2 className="text-lg sm:text-2xl font-display font-semibold text-white leading-relaxed">
            {question.question_text}
          </h2>
        </div>

        {/* 4 Clue Cards */}
        <div className="space-y-3.5 mb-6">
          {/* Clue 1 */}
          <ClueCard
            level={1}
            points={100}
            clueText={getClueText(1)}
            isUnlocked={true}
            canUnlock={false}
          />

          {/* Clue 2 */}
          <ClueCard
            level={2}
            points={75}
            clueText={getClueText(2)}
            isUnlocked={currentClueLevel >= 2}
            canUnlock={currentClueLevel === 1 && !already_attempted}
            onUnlock={() => handleRevealNext(2)}
            isLoading={isRevealing}
          />

          {/* Clue 3 */}
          <ClueCard
            level={3}
            points={50}
            clueText={getClueText(3)}
            isUnlocked={currentClueLevel >= 3}
            canUnlock={currentClueLevel === 2 && !already_attempted}
            onUnlock={() => handleRevealNext(3)}
            isLoading={isRevealing}
          />

          {/* Clue 4 */}
          <ClueCard
            level={4}
            points={25}
            clueText={getClueText(4)}
            isUnlocked={currentClueLevel >= 4}
            canUnlock={currentClueLevel === 3 && !already_attempted}
            onUnlock={() => handleRevealNext(4)}
            isLoading={isRevealing}
          />
        </div>

        {/* Answer Submission Form */}
        <AnswerForm
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          disabled={Boolean(already_attempted)}
          currentValue={currentQuestionValue}
        />

        {/* If question was already answered, show quick advance card */}
        {already_attempted && !modalResult?.isOpen && (
          <div className="mt-6 p-4 rounded-lg bg-navy-900 border border-cyan-500/40 flex items-center justify-between">
            <div className="text-xs font-mono">
              <span className="text-slate-400">Answer Submitted: </span>
              <span className="text-white font-bold">{already_attempted.user_answer} </span>
              <span className={already_attempted.is_correct ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                ({already_attempted.is_correct ? `+${already_attempted.earned_points} PTS` : '0 PTS'})
              </span>
            </div>
            <button
              onClick={handleNextQuestion}
              disabled={isAdvancing}
              className="px-4 py-2 text-xs font-mono font-bold bg-cyan-500 text-navy-950 rounded hover:bg-cyan-400 flex items-center gap-1.5"
            >
              <span>{currentQuestionNumber === 20 ? 'FINISH QUEST' : 'NEXT QUESTION'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Result Modal */}
        {modalResult && (
          <ResultModal
            isOpen={modalResult.isOpen}
            isCorrect={modalResult.isCorrect}
            earnedPoints={modalResult.earnedPoints}
            totalScore={modalResult.totalScore}
            correctAnswer={modalResult.correctAnswer}
            userAnswer={modalResult.userAnswer}
            questionNumber={modalResult.questionNumber}
            isLastQuestion={currentQuestionNumber === 20}
            onNext={handleNextQuestion}
            isLoading={isAdvancing}
          />
        )}
      </main>
    </div>
  );
};
