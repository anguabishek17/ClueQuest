import React from 'react';
import { CheckCircle, XCircle, ArrowRight, Award, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface ResultModalProps {
  isOpen: boolean;
  isCorrect: boolean;
  earnedPoints: number;
  totalScore: number;
  correctAnswer: string;
  userAnswer: string;
  questionNumber: number;
  isLastQuestion: boolean;
  onNext: () => void;
  isLoading: boolean;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  isOpen,
  isCorrect,
  earnedPoints,
  totalScore,
  correctAnswer,
  userAnswer,
  questionNumber,
  isLastQuestion,
  onNext,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`w-full max-w-md rounded-xl border p-6 text-center shadow-2xl relative overflow-hidden ${
          isCorrect
            ? 'bg-navy-900 border-emerald-500/50 shadow-emerald-glow'
            : 'bg-navy-900 border-rose-500/50 shadow-lg'
        }`}
      >
        {/* Glow Header */}
        <div className="flex justify-center mb-4">
          {isCorrect ? (
            <div className="p-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <CheckCircle className="w-12 h-12 animate-bounce" />
            </div>
          ) : (
            <div className="p-4 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400">
              <XCircle className="w-12 h-12" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className={`text-2xl font-mono font-extrabold tracking-wider mb-1 ${
          isCorrect ? 'text-emerald-400' : 'text-rose-400'
        }`}>
          {isCorrect ? 'CORRECT ANSWER!' : 'INCORRECT'}
        </h3>
        
        <p className="text-xs font-mono text-slate-400 mb-6 uppercase">
          QUESTION {String(questionNumber).padStart(2, '0')} EVALUATION
        </p>

        {/* Score Impact Display */}
        <div className="bg-navy-950/80 rounded-lg p-4 border border-slate-800 mb-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">YOUR SUBMISSION:</span>
            <span className="text-white font-semibold">{userAnswer}</span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">CORRECT ANSWER:</span>
            <span className="text-cyan-300 font-bold uppercase">{correctAnswer}</span>
          </div>

          <div className="h-px bg-slate-800" />

          <div className="flex items-center justify-between font-mono">
            <span className="text-xs text-slate-400">POINTS EARNED:</span>
            <span className={`text-lg font-extrabold ${isCorrect ? 'text-emerald-400' : 'text-slate-500'}`}>
              {isCorrect ? `+${earnedPoints} PTS` : '0 PTS'}
            </span>
          </div>

          <div className="flex items-center justify-between font-mono pt-1">
            <span className="text-xs text-slate-400">NEW TOTAL SCORE:</span>
            <span className="text-xl font-extrabold text-cyan-300">
              {String(totalScore).padStart(4, '0')} <span className="text-xs text-slate-500">/ 2000</span>
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onNext}
          disabled={isLoading}
          className={`w-full py-3.5 px-6 rounded font-mono font-bold text-sm tracking-wider uppercase transition flex items-center justify-center gap-2 ${
            isCorrect
              ? 'bg-emerald-500 hover:bg-emerald-400 text-navy-950 shadow-emerald-glow'
              : 'bg-cyan-500 hover:bg-cyan-400 text-navy-950 shadow-cyan-glow'
          }`}
        >
          <span>{isLastQuestion ? 'VIEW FINAL RESULTS' : 'NEXT QUESTION'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
};
