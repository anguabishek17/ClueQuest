import React, { useState } from 'react';
import { Cpu, ShieldCheck, User, KeyRound, AlertCircle, ArrowRight, Zap, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { ECEChipMotif } from '../components/layout/ECEChipMotif.js';

interface LoginPageProps {
  initialTab?: 'player' | 'admin';
  onLoginSuccess: (role: 'PLAYER' | 'ADMIN') => void;
  onNavigateHome: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  initialTab = 'player',
  onLoginSuccess,
  onNavigateHome,
}) => {
  const { login, registerTeam } = useAuth();
  const [tab, setTab] = useState<'player' | 'admin'>(initialTab);

  // Participant state (Team Name Only - No password)
  const [teamName, setTeamName] = useState('');

  // Admin state (Username & Password protected)
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTabSwitch = (newTab: 'player' | 'admin') => {
    setTab(newTab);
    setError(null);
  };

  // Participant Team Name Submission (No password required)
  const handleParticipantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTeam = teamName.trim();
    if (!cleanTeam) {
      setError('Please enter your team name.');
      return;
    }
    if (cleanTeam.length < 2) {
      setError('Team name must contain at least 2 characters.');
      return;
    }
    if (cleanTeam.length > 60) {
      setError('Team name must not exceed 60 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await registerTeam(cleanTeam);
    setLoading(false);

    if (res.success && res.user) {
      onLoginSuccess('PLAYER');
    } else {
      setError(res.error || 'Failed to join quest. Please check team name or event status.');
    }
  };

  // Coordinator / Admin Login Submission (Secure Credentials)
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername || !adminPassword) {
      setError('Please enter both admin username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await login(adminUsername.trim(), adminPassword);
    setLoading(false);

    if (result.success && result.user) {
      onLoginSuccess(result.user.role);
    } else {
      setError(result.error || 'Invalid administrator credentials.');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <ECEChipMotif />

      <div className="w-full max-w-md relative z-10">
        {/* Top Institutional Header */}
        <div className="text-center mb-6">
          <div
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 cursor-pointer mb-2 text-cyan-400 hover:text-cyan-300 transition"
          >
            <Cpu className="w-6 h-6" />
            <span className="font-display font-bold text-xl tracking-wider text-white">
              CLUE <span className="text-cyan-400">QUEST</span>
            </span>
          </div>
          <p className="text-xs font-sans font-semibold text-slate-400 tracking-wider uppercase">
            VSB ENGINEERING COLLEGE • ELECTRONICS CLUB
          </p>
        </div>

        {/* Auth Card */}
        <div className="tech-card rounded-xl p-6 sm:p-8 border border-cyan-500/30 shadow-2xl">
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-navy-950 p-1 rounded-lg border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => handleTabSwitch('player')}
              className={`py-2 text-xs font-sans font-bold tracking-wider rounded transition flex items-center justify-center gap-2 ${
                tab === 'player'
                  ? 'bg-cyan-500 text-navy-950 shadow-cyan-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              PARTICIPANT
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('admin')}
              className={`py-2 text-xs font-sans font-bold tracking-wider rounded transition flex items-center justify-center gap-2 ${
                tab === 'admin'
                  ? 'bg-cyan-500 text-navy-950 shadow-cyan-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              COORDINATOR
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-sans flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'player' ? (
            /* ============================================================ */
            /* 1. PARTICIPANT ENTRY (TEAM NAME ONLY — NO PASSWORD) */
            /* ============================================================ */
            <div>
              <div className="mb-5">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block mb-1">
                  ELECTRONICS CLUB • VSB ECE
                </span>
                <h2 className="text-xl font-display font-bold text-white tracking-wide">
                  JOIN THE QUEST
                </h2>
                <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
                  Enter your team name to enter the live arena. No password is required.
                </p>
              </div>

              <form onSubmit={handleParticipantSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-sans font-medium text-slate-300 mb-1.5 tracking-wider uppercase">
                    TEAM NAME
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter your team name (e.g. BYTE BANDITS)"
                      maxLength={60}
                      autoFocus
                      className="w-full bg-navy-950 border border-slate-700 focus:border-cyan-400 rounded px-4 py-2.5 text-sm font-sans text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400 uppercase tracking-wide"
                      required
                    />
                  </div>
                  <p className="text-[10px] font-sans text-slate-500 mt-1.5">
                    2 to 60 characters • Case-insensitive uniqueness enforced
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded font-sans font-bold text-xs uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-navy-950 disabled:text-slate-500 transition shadow-cyan-glow flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'JOINING QUEST...' : 'ENTER QUEST →'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <span className="text-[11px] font-sans text-slate-500 block">
                    No password required. Enter your registered team name to join the event.
                  </span>
                </div>
              </form>
            </div>
          ) : (
            /* ============================================================ */
            /* 2. COORDINATOR / ADMIN LOGIN (AUTHENTICATED) */
            /* ============================================================ */
            <div>
              <div className="mb-5">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block mb-1">
                  ADMINISTRATIVE ACCESS
                </span>
                <h2 className="text-xl font-display font-bold text-white tracking-wide">
                  COORDINATOR LOGIN
                </h2>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Authorized ECE faculty and event coordinators only.
                </p>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-sans font-medium text-slate-300 mb-1 tracking-wider uppercase">
                    ADMIN USERNAME
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="admin"
                      className="w-full bg-navy-950 border border-slate-700 focus:border-cyan-400 rounded px-4 py-2.5 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400 uppercase"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-sans font-medium text-slate-300 mb-1 tracking-wider uppercase">
                    PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoFocus
                      className="w-full bg-navy-950 border border-slate-700 focus:border-cyan-400 rounded px-4 py-2.5 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded font-sans font-bold text-xs uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-navy-950 disabled:text-slate-500 transition shadow-cyan-glow flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'AUTHENTICATING...' : 'ACCESS CONTROL CENTER →'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs font-mono text-slate-500">
          VSB ENGINEERING COLLEGE • DEPARTMENT OF ECE • 2026
        </div>
      </div>
    </div>
  );
};
