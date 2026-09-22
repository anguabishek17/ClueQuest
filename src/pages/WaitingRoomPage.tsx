import React, { useState } from 'react';
import { Cpu, Users, Clock, Shield, Sparkles, Radio, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.js';
import { useGame } from '../context/GameContext.js';
import { ECEChipMotif } from '../components/layout/ECEChipMotif.js';

interface WaitingRoomPageProps {
  onlineCount?: number;
  totalRegistered?: number;
}

export const WaitingRoomPage: React.FC<WaitingRoomPageProps> = ({
  onlineCount = 37,
  totalRegistered = 40,
}) => {
  const { user, updateTeam } = useAuth();
  const { countdown, gameState } = useGame();

  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [teamInput, setTeamInput] = useState(user?.team_name || '');
  const [teamError, setTeamError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const isCountdown = gameState?.event?.status === 'COUNTDOWN' || (countdown !== null && countdown > 0);
  const isWaiting = gameState?.event?.status === 'WAITING' || !gameState?.event;

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTeam = teamInput.trim();
    if (!cleanTeam) {
      setTeamError('Please enter your team name.');
      return;
    }
    if (cleanTeam.length < 2) {
      setTeamError('Team name must contain at least 2 characters.');
      return;
    }
    if (cleanTeam.length > 60) {
      setTeamError('Team name must not exceed 60 characters.');
      return;
    }

    setUpdating(true);
    setTeamError(null);

    const res = await updateTeam(cleanTeam);
    setUpdating(false);

    if (res.success) {
      setIsEditingTeam(false);
    } else {
      setTeamError(res.error || 'Failed to update team name.');
    }
  };

  return (
    <div className="min-h-[85vh] relative flex items-center justify-center p-4">
      <ECEChipMotif />

      {/* SYNCHRONIZED SERVER COUNTDOWN OVERLAY */}
      <AnimatePresence>
        {isCountdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-navy-950/95 flex flex-col items-center justify-center text-center p-4"
          >
            <div className="inline-flex items-center gap-2 text-cyan-400 font-mono text-sm tracking-widest uppercase mb-4 animate-pulse">
              <Radio className="w-4 h-4" />
              <span>SYNCHRONIZED COORDINATOR BROADCAST</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white mb-6">
              QUEST STARTING
            </h2>

            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-cyan-400 bg-cyan-500/10 flex items-center justify-center shadow-cyan-glow-lg">
              <span className="text-6xl sm:text-8xl font-mono font-extrabold text-cyan-300">
                {countdown === 0 ? 'GO!' : String(countdown ?? 5).padStart(2, '0')}
              </span>
            </div>

            <p className="mt-8 text-xs font-mono text-slate-400 uppercase tracking-wider">
              SERVER TIMESTAMP SYNCHRONIZED • QUESTION 01 INITIALIZING FOR {user?.player_code}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-xl relative z-10 text-center">
        {/* Waiting Card */}
        <div className="tech-card rounded-2xl p-8 sm:p-10 border border-cyan-500/30 shadow-2xl">
          <div className="inline-flex p-3.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-4">
            <Cpu className="w-8 h-8 animate-pulse" />
          </div>

          <span className="block text-xs font-mono text-emerald-400 tracking-widest uppercase mb-1 font-bold flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            REGISTRATION CONFIRMED
          </span>

          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white mb-1">
            WELCOME, {user?.team_name || user?.display_name || 'PARTICIPANT'}
          </h1>

          {/* Team Identity Badge */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {user?.team_name && (
              <span className="text-xs font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 rounded flex items-center gap-1.5 font-bold">
                TEAM: {user.team_name}
              </span>
            )}
            {isWaiting && (
              <button
                type="button"
                onClick={() => {
                  setTeamInput(user?.team_name || '');
                  setTeamError(null);
                  setIsEditingTeam(true);
                }}
                className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 bg-navy-950 border border-slate-700 hover:border-cyan-500/50 px-2.5 py-1 rounded transition"
              >
                EDIT TEAM NAME
              </button>
            )}
          </div>

          {/* Edit Team Name Inline Modal */}
          {isEditingTeam && isWaiting && (
            <div className="mb-6 p-4 rounded-xl bg-navy-950 border border-cyan-500/40 text-left">
              <span className="text-xs font-display font-bold text-white uppercase block mb-1">
                EDIT TEAM IDENTITY
              </span>
              <p className="text-[11px] text-slate-400 font-sans mb-3">
                You can change your team name before the competition begins. Once LIVE, it is permanently locked.
              </p>

              {teamError && (
                <div className="mb-3 p-2 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-sans flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{teamError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateTeam} className="space-y-3">
                <input
                  type="text"
                  value={teamInput}
                  onChange={(e) => setTeamInput(e.target.value)}
                  placeholder="e.g. CIRCUIT BREAKERS"
                  maxLength={60}
                  className="w-full bg-navy-900 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-xs font-sans text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400 uppercase"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={updating}
                    className="py-1.5 px-3 rounded font-sans font-bold text-xs uppercase bg-cyan-500 hover:bg-cyan-400 text-navy-950 transition"
                  >
                    {updating ? 'SAVING...' : 'SAVE TEAM NAME'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingTeam(false)}
                    className="py-1.5 px-3 rounded font-sans font-medium text-xs uppercase bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-navy-950/90 rounded-xl p-5 border border-slate-800 text-left space-y-3.5 mb-6">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-400 uppercase">EVENT STATUS:</span>
              <span className="text-amber-400 font-bold flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/30">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                WAITING FOR COORDINATOR
              </span>
            </div>

            <div className="flex items-center justify-between font-mono">
              <span className="text-xs text-slate-400 uppercase">TEAMS ONLINE:</span>
              <span className="text-base font-bold text-cyan-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" />
                {onlineCount} <span className="text-xs text-slate-500 font-normal">/ {totalRegistered}</span>
              </span>
            </div>

            <div className="h-px bg-slate-800" />

            <div className="pt-1">
              <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider block mb-1">
                EVENT NOT STARTED
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                The coordinator has not started the event yet. Please wait here until you are notified.
              </p>
              <p className="text-[11px] font-mono text-emerald-400 mt-2">
                ✓ You are successfully registered. Your session is ready.
              </p>
            </div>
          </div>

          {/* Tournament Briefing Box */}
          <div className="text-left bg-cyan-950/20 border border-cyan-500/20 rounded-lg p-4 mb-2">
            <h4 className="text-xs font-mono font-bold text-cyan-300 uppercase mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              TOURNAMENT BRIEFING
            </h4>
            <ul className="text-xs text-slate-400 space-y-1.5 font-sans leading-relaxed">
              <li>• The event has not been started by the coordinator.</li>
              <li>• Please remain on this page until you are notified.</li>
              <li>• Once the coordinator starts the event, a synchronized countdown will begin.</li>
              <li>• Clue 1 will be revealed automatically when the competition starts.</li>
              <li>• You may submit an answer immediately or reveal additional clues.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
