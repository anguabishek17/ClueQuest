import React from 'react';
import { Cpu, ShieldCheck, User as UserIcon, LogOut, Trophy, BookOpen, Radio, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { TestTimer } from '../game/TestTimer.js';

interface HeaderProps {
  isGameMode?: boolean;
  currentQuestion?: number;
  totalQuestions?: number;
  totalScore?: number;
  deadlineAt?: string | null;
  serverNow?: string | null;
  onTimeUp?: () => void;
  onNavigate?: (tab: string) => void;
  activeTab?: string;
}

export const Header: React.FC<HeaderProps> = ({
  isGameMode = false,
  currentQuestion = 1,
  totalQuestions = 20,
  totalScore = 0,
  deadlineAt,
  serverNow,
  onTimeUp,
  onNavigate,
  activeTab = 'home',
}) => {
  const { user, logout } = useAuth();

  if (isGameMode) {
    return (
      <header className="sticky top-0 z-40 bg-navy-950/95 border-b border-cyan-500/30 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Brand & Club */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-5 h-5 animate-pulse-subtle" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg text-white tracking-wider">CLUE QUEST</span>
                <span className="text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded">
                  VSB ECE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">ELECTRONICS CLUB LIVE CHALLENGE</p>
            </div>
          </div>

          {/* Center Progress & 20-Min Authoritative Countdown */}
          <div className="flex items-center gap-4 sm:gap-6 bg-navy-900/90 border border-cyan-500/30 px-5 py-2 rounded shadow-inner">
            <div className="text-center">
              <span className="block text-[10px] font-mono uppercase text-slate-400">QUESTION</span>
              <span className="text-lg font-mono font-bold text-cyan-300">
                {String(currentQuestion).padStart(2, '0')} <span className="text-slate-500 text-sm">/ {totalQuestions}</span>
              </span>
            </div>

            <div className="h-8 w-px bg-cyan-500/20" />

            <TestTimer deadlineAt={deadlineAt} serverNow={serverNow} onTimeUp={onTimeUp} />

            <div className="h-8 w-px bg-cyan-500/20" />

            <div className="text-center">
              <span className="block text-[10px] font-mono uppercase text-slate-400">TOTAL SCORE</span>
              <span className="text-lg font-mono font-bold text-emerald-400">
                {String(totalScore).padStart(4, '0')} <span className="text-slate-500 text-sm">/ 2000</span>
              </span>
            </div>
          </div>

          {/* Player Badge */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-mono font-semibold text-white block">{user?.display_name || 'Participant'}</span>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 inline-block">
                ID: {user?.player_code}
              </span>
            </div>
            <button
              onClick={() => logout()}
              title="Exit Session"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-700/50 hover:border-red-500/30 rounded transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-navy-950/80 border-b border-slate-800/60 backdrop-blur-xl transition-all">
      {/* Top Institutional Header */}
      <div className="bg-navy-950/95 border-b border-slate-800/40 px-4 sm:px-6 lg:px-8 py-1.5 text-[11px] font-sans text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          {/* Left Zone: VSB College Logo & Name */}
          <div className="flex items-center gap-2">
            <img
              src="/assets/vsb-logo.png"
              alt="VSB Engineering College Logo"
              className="w-6 h-6 sm:w-7 sm:h-7 object-contain shrink-0"
            />
            <span className="text-cyan-400 font-semibold tracking-wider uppercase text-[11px] sm:text-xs">
              VSB ENGINEERING COLLEGE
            </span>
          </div>

          {/* Center Zone: Department Info & Accreditation */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400">
            <span className="tracking-wide">DEPARTMENT OF ELECTRONICS & COMMUNICATION ENGINEERING</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-medium tracking-wide">NBA & NAAC ACCREDITED</span>
          </div>

          {/* Right Zone: Electronics Club Logo & Name */}
          <div className="flex items-center gap-2">
            <img
              src="/assets/elc-logo.png"
              alt="Electronics Club Logo"
              className="w-6 h-6 sm:w-7 sm:h-7 object-contain shrink-0"
            />
            <span className="text-cyan-300 font-medium tracking-wider uppercase text-[11px] sm:text-xs">
              ELECTRONICS CLUB
            </span>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div
          onClick={() => onNavigate?.('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 group-hover:border-cyan-400 transition shadow-cyan-glow">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-white tracking-tight">
                CLUE <span className="text-cyan-400">QUEST</span>
              </span>
              <span className="chip-badge hidden sm:inline-block text-[10px]">ECE CLUB</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">DECODE • THINK • ANSWER</p>
          </div>
        </div>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {[
            { id: 'home', label: 'HOME' },
            { id: 'club', label: 'ELECTRONICS CLUB' },
            { id: 'rules', label: 'HOW IT WORKS' },
            { id: 'leaderboard', label: 'LEADERBOARD' },
            { id: 'help', label: 'HELP' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'club') {
                  if (activeTab === 'home' || activeTab === 'club' || activeTab === 'rules') {
                    const el = document.getElementById('electronics-club');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      onNavigate?.('home');
                    }
                  } else {
                    onNavigate?.('home');
                    setTimeout(() => {
                      document.getElementById('electronics-club')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }
                } else if (tab.id === 'rules') {
                  if (activeTab === 'home' || activeTab === 'club' || activeTab === 'rules') {
                    const el = document.getElementById('how-it-works');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      onNavigate?.('rules');
                    }
                  } else {
                    onNavigate?.('home');
                    setTimeout(() => {
                      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }
                } else {
                  onNavigate?.(tab.id);
                }
              }}
              className={`px-3.5 py-1.5 text-xs font-sans font-medium tracking-wider rounded-md transition ${
                activeTab === tab.id
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-cyan-glow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div
                onClick={() => {
                  if (user.role === 'ADMIN') onNavigate?.('admin');
                  else onNavigate?.('game');
                }}
                className="cursor-pointer bg-navy-900 border border-cyan-500/40 px-3 py-1.5 rounded flex items-center gap-2 hover:border-cyan-300 transition"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono text-white font-semibold">{user.player_code}</span>
                <span className="text-[10px] font-mono text-cyan-400 uppercase">({user.role})</span>
              </div>
              <button
                onClick={() => logout()}
                className="text-xs font-mono text-slate-400 hover:text-red-400 p-2"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate?.('login')}
                className="px-4 py-2 text-xs font-sans font-bold tracking-wider rounded bg-cyan-500 text-navy-950 hover:bg-cyan-400 transition shadow-cyan-glow flex items-center gap-1.5"
              >
                <UserIcon className="w-3.5 h-3.5" />
                PLAYER LOGIN
              </button>
              <button
                onClick={() => onNavigate?.('admin_login')}
                className="px-3 py-2 text-xs font-sans font-semibold text-slate-300 hover:text-white bg-slate-900/80 border border-slate-700/60 hover:border-cyan-500/40 rounded transition flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                ADMIN
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
