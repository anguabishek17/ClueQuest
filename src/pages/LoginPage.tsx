import React, { useState } from 'react';
import { Cpu, ShieldCheck, User, KeyRound, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
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
  const [playerCode, setPlayerCode] = useState('CQ001');
  const [password, setPassword] = useState('VSBece2026!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Secondary Team Identification state (for participants without registered team)
  const [needsTeamName, setNeedsTeamName] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [teamError, setTeamError] = useState<string | null>(null);
  const [registeredPlayerInfo, setRegisteredPlayerInfo] = useState<{ player_code: string; display_name: string } | null>(null);

  const handleTabSwitch = (newTab: 'player' | 'admin') => {
    setTab(newTab);
    setError(null);
    setNeedsTeamName(false);
    if (newTab === 'player') {
      setPlayerCode('CQ001');
      setPassword('VSBece2026!');
    } else {
      setPlayerCode('admin');
      setPassword('VSBadmin2026!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerCode || !password) return;

    setLoading(true);
    setError(null);

    const result = await login(playerCode.trim(), password);
    setLoading(false);

    if (result.success && result.user) {
      if (result.user.role === 'PLAYER' && !result.user.team_name) {
        // Show clean secondary Team Identification step
        setRegisteredPlayerInfo({
          player_code: result.user.player_code,
          display_name: result.user.display_name,
        });
        setNeedsTeamName(true);
      } else {
        onLoginSuccess(result.user.role);
      }
    } else {
      setError(result.error || 'Invalid credentials. Please check your Player ID and password.');
    }
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTeam = teamNameInput.trim();
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

    setLoading(true);
    setTeamError(null);

    const res = await registerTeam(cleanTeam);
    setLoading(false);

    if (res.success && res.user) {
      onLoginSuccess('PLAYER');
    } else {
      setTeamError(res.error || 'Failed to register team name. Please try another name.');
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
            className="inline-flex items-center gap-2 cursor-pointer mb-2 text-cyan-400 hover:text-cyan-300"
          >
            <Cpu className="w-6 h-6" />
            <span className="font-display font-bold text-xl tracking-wider text-white">
              CLUE <span className="text-cyan-400">QUEST</span>
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 tracking-wider uppercase">
            VSB ENGINEERING COLLEGE • ECE DEPARTMENT
          </p>
        </div>

        {/* Login Card or Secondary Team Identification Card */}
        <div className="tech-card rounded-xl p-6 sm:p-8 border border-cyan-500/30 shadow-2xl">
          {needsTeamName ? (
            /* SECONDARY STEP: TEAM IDENTIFICATION */
            <div>
              <div className="mb-5">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                  REGISTRATION CONFIRMED • {registeredPlayerInfo?.player_code}
                </span>
                <h2 className="text-xl font-display font-bold text-white tracking-wide">
                  TEAM IDENTIFICATION
                </h2>
                <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
                  Welcome, <span className="text-cyan-300 font-bold font-mono">{registeredPlayerInfo?.display_name || registeredPlayerInfo?.player_code}</span>. Please enter your team name for event identification and coordinator monitoring.
                </p>
              </div>

              {teamError && (
                <div className="mb-5 p-3 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-sans flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{teamError}</span>
                </div>
              )}

              <form onSubmit={handleTeamSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-sans font-medium text-slate-300 mb-1 tracking-wider uppercase">
                    TEAM NAME
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={teamNameInput}
                      onChange={(e) => setTeamNameInput(e.target.value)}
                      placeholder="e.g. CIRCUIT BREAKERS"
                      maxLength={60}
                      autoFocus
                      className="w-full bg-navy-950 border border-slate-700 focus:border-cyan-400 rounded px-4 py-2.5 text-sm font-sans text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400 uppercase"
                      required
                    />
                  </div>
                  <p className="text-[10px] font-sans text-slate-500 mt-1">
                    2 to 60 characters • Event reference identity
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-3 px-4 rounded font-sans font-bold text-xs uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-navy-950 disabled:text-slate-500 transition shadow-cyan-glow flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'CONFIRMING...' : 'CONFIRM TEAM NAME'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            /* PRIMARY STEP: PARTICIPANT / ADMIN LOGIN */
            <div>
              {/* Tabs */}
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
                  <User className="w-3.5 h-3.5" />
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
                  ADMIN / HOD
                </button>
              </div>

              <div className="mb-5">
                <h2 className="text-xl font-display font-bold text-white tracking-wide">
                  {tab === 'player' ? 'PARTICIPANT LOGIN' : 'CONTROL CENTER LOGIN'}
                </h2>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  {tab === 'player'
                    ? 'Enter your allocated participant code (CQ001 - CQ040)'
                    : 'Authorized ECE faculty and event coordinators only'}
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-sans flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-sans font-medium text-slate-300 mb-1 tracking-wider uppercase">
                    {tab === 'player' ? 'PLAYER ID' : 'ADMIN USERNAME'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={playerCode}
                      onChange={(e) => setPlayerCode(e.target.value)}
                      placeholder={tab === 'player' ? 'e.g. CQ017' : 'admin'}
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
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
                  <span>{loading ? 'AUTHENTICATING...' : tab === 'player' ? 'ENTER QUEST' : 'ACCESS CONTROL CENTER'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Demo Fill Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-500 block mb-2 uppercase">
                  QUICK TEST CREDENTIALS:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTab('player');
                      setPlayerCode('CQ001');
                      setPassword('VSBece2026!');
                    }}
                    className="px-2.5 py-1 rounded bg-navy-950 border border-slate-800 hover:border-cyan-400 text-[11px] font-mono text-cyan-400"
                  >
                    Player CQ001
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('player');
                      setPlayerCode('CQ017');
                      setPassword('VSBece2026!');
                    }}
                    className="px-2.5 py-1 rounded bg-navy-950 border border-slate-800 hover:border-cyan-400 text-[11px] font-mono text-cyan-400"
                  >
                    Player CQ017
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('admin');
                      setPlayerCode('admin');
                      setPassword('VSBadmin2026!');
                    }}
                    className="px-2.5 py-1 rounded bg-navy-950 border border-slate-800 hover:border-cyan-400 text-[11px] font-mono text-emerald-400"
                  >
                    Admin (Coordinator)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs font-mono text-slate-500">
          VSB ENGINEERING COLLEGE • ECE DEPARTMENT • 2026
        </div>
      </div>
    </div>
  );
};
