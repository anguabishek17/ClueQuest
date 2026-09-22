import React, { useEffect, useState } from 'react';
import { Trophy, CheckCircle, XCircle, Award, Sparkles, RotateCcw, ArrowLeft, Layers, Cpu } from 'lucide-react';
import { GameResultsSummary } from '../types/index.js';
import { request } from '../utils/api.js';
import { ECEChipMotif } from '../components/layout/ECEChipMotif.js';

interface ResultsPageProps {
  onBackToHome: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ onBackToHome }) => {
  const [results, setResults] = useState<GameResultsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      try {
        const data = await request<GameResultsSummary>('/game/results');
        setResults(data);
      } catch (err) {
        console.error('Failed to load results:', err);
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, []);

  if (loading || !results) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center font-mono text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <Cpu className="w-10 h-10 animate-spin" />
          <span>COMPUTING OFFICIAL QUEST METRICS...</span>
        </div>
      </div>
    );
  }

  const {
    total_score,
    max_possible_score,
    total_questions,
    correct_count,
    incorrect_count,
    clues_used,
    answers_100_pt,
    answers_75_pt,
    answers_50_pt,
    answers_25_pt,
    attempts,
    player,
  } = results;

  const percentage = Math.round((total_score / max_possible_score) * 100);

  return (
    <div className="relative min-h-screen pb-20">
      <ECEChipMotif />

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Banner */}
        <div className="tech-card rounded-2xl p-8 sm:p-10 border border-cyan-500/40 text-center shadow-2xl mb-8">
          <div className="inline-flex p-4 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-4 shadow-cyan-glow">
            <Trophy className="w-12 h-12 text-yellow-400 animate-bounce" />
          </div>

          <span className="block text-xs font-sans font-bold text-cyan-400 tracking-widest uppercase mb-1">
            TOURNAMENT RECORD VERIFIED
          </span>

          <h1 className="text-3xl sm:text-5xl font-display font-bold text-white mb-2">
            QUEST COMPLETE
          </h1>

          <p className="text-sm font-sans text-slate-300 mb-2">
            PARTICIPANT: <strong className="text-cyan-300 font-mono">{player?.display_name || player?.player_code}</strong> <span className="font-mono text-slate-400">({player?.player_code})</span>
          </p>
          {player?.team_name && (
            <p className="text-xs font-sans text-emerald-300 mb-6 font-semibold">
              TEAM IDENTITY: <span className="text-white px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 font-mono font-bold">{player.team_name}</span>
            </p>
          )}

          {/* Big Score Box */}
          <div className="bg-navy-950/90 max-w-md mx-auto p-6 rounded-xl border border-cyan-500/40 shadow-inner mb-6">
            <span className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1">
              FINAL AUTHORITATIVE SCORE
            </span>
            <div className="text-5xl sm:text-6xl font-mono font-extrabold text-emerald-400 text-glow-cyan">
              {String(total_score).padStart(4, '0')}
              <span className="text-xl sm:text-2xl text-slate-500 font-normal"> / {max_possible_score}</span>
            </div>
            <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono border border-cyan-500/40">
              ACCURACY RATING: {percentage}%
            </span>
          </div>

          <button
            onClick={onBackToHome}
            className="px-6 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono tracking-wider transition inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            RETURN TO TOURNAMENT PORTAL
          </button>
        </div>

        {/* 8 Stats Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="tech-card p-4 rounded-lg border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">QUESTIONS</span>
            <span className="text-xl sm:text-2xl font-mono font-bold text-white">
              {total_questions} / 20
            </span>
          </div>

          <div className="tech-card p-4 rounded-lg border border-emerald-500/30">
            <span className="text-[10px] font-mono text-emerald-400 uppercase block mb-1">CORRECT</span>
            <span className="text-xl sm:text-2xl font-mono font-bold text-emerald-400">
              {correct_count}
            </span>
          </div>

          <div className="tech-card p-4 rounded-lg border border-rose-500/30">
            <span className="text-[10px] font-mono text-rose-400 uppercase block mb-1">INCORRECT</span>
            <span className="text-xl sm:text-2xl font-mono font-bold text-rose-400">
              {incorrect_count}
            </span>
          </div>

          <div className="tech-card p-4 rounded-lg border border-cyan-500/30">
            <span className="text-[10px] font-mono text-cyan-400 uppercase block mb-1">CLUES USED</span>
            <span className="text-xl sm:text-2xl font-mono font-bold text-cyan-300">
              {clues_used}
            </span>
          </div>

          {/* 4 Point Tiers */}
          <div className="tech-card p-4 rounded-lg border border-cyan-500/30">
            <span className="text-[10px] font-mono text-cyan-400 uppercase block mb-1">100 PT ANSWERS</span>
            <span className="text-xl font-mono font-bold text-cyan-300">{answers_100_pt}</span>
          </div>

          <div className="tech-card p-4 rounded-lg border border-blue-500/30">
            <span className="text-[10px] font-mono text-blue-400 uppercase block mb-1">75 PT ANSWERS</span>
            <span className="text-xl font-mono font-bold text-blue-300">{answers_75_pt}</span>
          </div>

          <div className="tech-card p-4 rounded-lg border border-amber-500/30">
            <span className="text-[10px] font-mono text-amber-400 uppercase block mb-1">50 PT ANSWERS</span>
            <span className="text-xl font-mono font-bold text-amber-300">{answers_50_pt}</span>
          </div>

          <div className="tech-card p-4 rounded-lg border border-emerald-500/30">
            <span className="text-[10px] font-mono text-emerald-400 uppercase block mb-1">25 PT ANSWERS</span>
            <span className="text-xl font-mono font-bold text-emerald-300">{answers_25_pt}</span>
          </div>
        </div>

        {/* Detailed Question Review Table */}
        <div className="tech-card rounded-xl border border-cyan-500/30 overflow-hidden">
          <div className="p-4 bg-navy-950/90 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Question-by-Question Diagnostic Breakdown
            </h3>
            <span className="text-[10px] font-mono text-slate-400">20 CHALLENGES</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-navy-950/60 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">CATEGORY</th>
                  <th className="px-4 py-3 text-center">CLUE USED</th>
                  <th className="px-4 py-3">YOUR ANSWER</th>
                  <th className="px-4 py-3">CANONICAL ANSWER</th>
                  <th className="px-4 py-3 text-center">RESULT</th>
                  <th className="px-4 py-3 text-right">POINTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {attempts.map((att, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-bold text-cyan-400">
                      Q{String(att.question_number || idx + 1).padStart(2, '0')}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{att.category || 'Electronics'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-navy-950 border border-slate-700 text-slate-300 font-bold">
                        C{att.highest_clue_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{att.user_answer}</td>
                    <td className="px-4 py-3 text-cyan-300 font-semibold">{att.correct_answer}</td>
                    <td className="px-4 py-3 text-center">
                      {att.is_correct ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                          CORRECT
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                          INCORRECT
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-sm text-emerald-400">
                      +{att.earned_points} PTS
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
