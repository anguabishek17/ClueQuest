import React from 'react';
import { Cpu, ArrowRight, Zap, Sparkles, Activity, Layers, Users, ChevronDown, Award, Radio } from 'lucide-react';
import { ECEChipMotif } from '../components/layout/ECEChipMotif.js';
import { useAuth } from '../context/AuthContext.js';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen bg-[#03070D] text-slate-100 overflow-hidden selection:bg-cyan-500 selection:text-navy-950">
      {/* ATMOSPHERIC AMBIENT GLOW SYSTEM */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Left deep blue glow */}
        <div 
          className="absolute -top-[10%] -left-[15%] w-[650px] h-[650px] rounded-full blur-[140px] opacity-25"
          style={{ background: 'radial-gradient(circle, #00BFFF 0%, #0044FF 60%, transparent 80%)' }}
        />
        {/* Right electric cyan glow */}
        <div 
          className="absolute top-[15%] -right-[15%] w-[600px] h-[600px] rounded-full blur-[140px] opacity-20"
          style={{ background: 'radial-gradient(circle, #00F2FE 0%, #0680CD 60%, transparent 80%)' }}
        />
        {/* Center subtle top ambient glow */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] rounded-full blur-[160px] opacity-15"
          style={{ background: 'radial-gradient(circle, #00F2FE 0%, transparent 70%)' }}
        />
        {/* Very faint technical grid */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 191, 255, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 191, 255, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      <ECEChipMotif className="opacity-40" />

      {/* HERO SECTION — PREMIUM CINEMATIC LAYOUT */}
      <section id="hero" className="relative z-10 min-h-[calc(100vh-80px)] flex flex-col justify-center items-center pt-8 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        
        {/* LEFT FLOATING TECHNICAL HUD (Subtle, non-intrusive) */}
        <div className="hidden xl:flex flex-col absolute left-4 2xl:-left-16 top-1/3 p-4 rounded-xl bg-navy-950/40 border border-slate-800/60 backdrop-blur-md text-left shadow-2xl pointer-events-none opacity-60 hover:opacity-100 transition duration-500 max-w-[210px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-slate-400">MULTIPLAYER ARENA</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-white">37 / 40 ONLINE</span>
          </div>
          <p className="text-[10px] font-sans text-slate-400 leading-tight">
            Synchronized coordinator-controlled live competition
          </p>
        </div>

        {/* RIGHT FLOATING TECHNICAL HUD (Live Question Mechanics) */}
        <div className="hidden xl:flex flex-col absolute right-4 2xl:-right-16 top-1/3 p-4 rounded-xl bg-navy-950/40 border border-slate-800/60 backdrop-blur-md text-left shadow-2xl pointer-events-none opacity-60 hover:opacity-100 transition duration-500 max-w-[210px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">SACRIFICE MODEL</span>
            <span className="text-[9px] font-mono bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/20">LIVE</span>
          </div>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-lg font-mono font-extrabold text-emerald-400">100 → 25</span>
            <span className="text-[10px] font-mono text-slate-400">PTS</span>
          </div>
          <p className="text-[10px] font-sans text-slate-400 leading-tight">
            Sequential clue reveals reduce reward per challenge
          </p>
        </div>

        {/* 1. TOP BADGE PILL */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-900/80 border border-cyan-500/30 text-xs font-mono text-cyan-300 mb-8 shadow-cyan-glow backdrop-blur-md">
          <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
          <span className="tracking-wider uppercase text-[11px] sm:text-xs">ELECTRONICS CLUB • VSB ECE</span>
        </div>

        {/* 2. HUGE CINEMATIC HERO HEADING */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.25rem] font-display font-bold text-white tracking-[-0.04em] leading-[1.08] max-w-5xl mx-auto mb-6">
          Every clue costs.<br />
          Every answer counts.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 text-glow-cyan">
            CLUE QUEST.
          </span>
        </h1>

        {/* 3. SUPPORTING DESCRIPTION */}
        <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 font-sans font-normal leading-relaxed">
          Decode progressive technical clues, decide when to reveal, and maximize your score across 20 elite electronics challenges.
        </p>

        {/* 4. PREMIUM CTA BUTTONS */}
        <div className="flex items-center justify-center w-full max-w-md sm:max-w-none mb-12">
          {user ? (
            <button
              onClick={() => onNavigate(user.role === 'ADMIN' ? 'admin' : 'game')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-navy-950 font-sans font-bold text-sm tracking-wide shadow-cyan-glow hover:shadow-cyan-glow-lg flex items-center justify-center gap-2.5 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{user.role === 'ADMIN' ? 'ACCESS CONTROL CENTER' : 'RESUME CLUE QUEST ARENA'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-navy-950 font-sans font-bold text-sm tracking-wide shadow-cyan-glow hover:shadow-cyan-glow-lg flex items-center justify-center gap-2.5 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>ENTER QUEST</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 5. MINIMAL GAME METADATA & MECHANIC ROW */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/50 max-w-xl mx-auto">
          <span className="flex items-center gap-1.5">
            <strong className="text-white font-bold">20</strong> QUESTIONS
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1.5">
            <strong className="text-cyan-300 font-bold">4</strong> CLUES / QUESTION
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1.5">
            <strong className="text-emerald-400 font-bold">2000</strong> MAX PTS
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-[11px] text-slate-500 w-full sm:w-auto mt-1 sm:mt-0">
            CLUE VALUE SYSTEM: <strong className="text-cyan-400">100 → 75 → 50 → 25 PTS</strong>
          </span>
        </div>

        {/* Subtle Scroll Down Indicator */}
        <div className="mt-14 text-slate-600 flex flex-col items-center gap-1 text-[11px] font-mono tracking-widest uppercase">
          <span>EXPLORE</span>
          <ChevronDown className="w-4 h-4 animate-bounce text-slate-500" />
        </div>
      </section>

      {/* HOW IT WORKS / SCORING PROGRESSION */}
      <section id="how-it-works" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="text-center mb-12">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-2">
            CORE GAMEPLAY MECHANICS
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
            The Clue Value Sacrifice Model
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mt-2 font-sans">
            Every question starts at 100 points with Clue 1 unlocked. Need more technical insights? Reveal clues sequentially at the cost of the question's reward.
          </p>
        </div>

        {/* 4 Tier Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            {
              level: 'CLUE 01',
              points: '100 PTS',
              title: 'First-Glance Solve',
              desc: 'High-level physics or circuit behavioral hint. Answer right now to lock maximum 100 points!',
              color: 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10',
            },
            {
              level: 'CLUE 02',
              points: '75 PTS',
              title: 'Structural Hint',
              desc: 'Reveals mathematical formulas, characteristic curves, or structural semiconductor topology.',
              color: 'border-blue-500/50 text-blue-400 bg-blue-500/10',
            },
            {
              level: 'CLUE 03',
              points: '50 PTS',
              title: 'Domain Specifics',
              desc: 'Exposes IC packaging (e.g. 741, 555), standard pinouts, or common industrial topologies.',
              color: 'border-amber-500/50 text-amber-400 bg-amber-500/10',
            },
            {
              level: 'CLUE 04',
              points: '25 PTS',
              title: 'Definitive Acronym',
              desc: 'Gives the definitive hallmark acronym or textbook inventor clue for a safe 25 point score.',
              color: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10',
            },
          ].map((item, i) => (
            <div key={i} className="tech-card p-6 rounded-xl border border-slate-800 hover:border-cyan-500/40 transition">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs text-slate-400 font-bold">{item.level}</span>
                <span className={`font-mono text-xs font-extrabold px-2.5 py-1 rounded border ${item.color}`}>
                  {item.points}
                </span>
              </div>
              <h3 className="font-display font-bold text-white text-base mb-2">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Critical Rule Callout Box */}
        <div className="tech-card rounded-xl p-6 border border-emerald-500/40 bg-gradient-to-r from-emerald-950/20 to-navy-900/60 max-w-4xl mx-auto flex items-start gap-4">
          <Sparkles className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
          <div>
            <h4 className="text-sm font-mono font-bold text-emerald-300 uppercase tracking-wide mb-1">
              Zero Score Deduction Guarantee
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              You <strong>never lose already-earned total score</strong> by revealing clues. You are only choosing how much potential reward to risk on the active question. 
              Example: If you have 400 pts and unlock Clue 2, your total remains 400 pts while this question's payoff becomes 75 pts!
            </p>
          </div>
        </div>
      </section>

      {/* DEPARTMENT & ELECTRONICS CLUB INFO SECTION */}
      <section id="electronics-club" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div id="department-overview" className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-2">
              VSB ECE EXCELLENCE
            </span>
            <h2 className="text-3xl font-display font-extrabold text-white mb-4">
              Shaping Tomorrow with ECE Innovations
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Established in 2002, the Department of Electronics and Communication Engineering at VSB Engineering College provides state-of-the-art laboratory infrastructure in VLSI Design, Embedded Systems, Communication Networks, and Digital Signal Processing.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              The Electronics Club organizes competitive hackathons, circuit debugging challenges, Wokwi simulations, and annual technical symposiums to empower engineering students to excel in core industry domains.
            </p>

            <div className="grid grid-cols-2 gap-4 font-mono text-xs">
              <div className="p-3 rounded bg-navy-900 border border-slate-800">
                <span className="text-cyan-400 block font-bold">240 INTAKE</span>
                <span className="text-slate-400 text-[11px]">B.E. ECE Program</span>
              </div>
              <div className="p-3 rounded bg-navy-900 border border-slate-800">
                <span className="text-emerald-400 block font-bold">10+ LABS</span>
                <span className="text-slate-400 text-[11px]">Specialized Centers</span>
              </div>
            </div>
          </div>

          {/* Technical Blueprint Card */}
          <div className="tech-card p-6 rounded-xl border border-cyan-500/30">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <span className="font-mono text-xs text-cyan-400 font-bold">TOURNAMENT TOPICS (20 DOMAINS)</span>
              <span className="chip-badge">OFFICIAL CURRICULUM</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-300">
              {[
                'Resistors', 'Capacitors', 'Inductors', 'Diodes',
                'Transistors (BJT)', 'MOSFET', 'Op-Amps (741)', 'Logic Gates',
                'Flip-Flops', 'Microcontrollers', 'Sensors', 'ADC Modules',
                'DAC Networks', 'PWM Control', 'UART Serial', 'I2C Bus',
                'SPI Interface', 'Antennas', 'Modulation', 'Oscillators'
              ].map((topic, idx) => (
                <div key={idx} className="p-2 rounded bg-navy-950/70 border border-slate-800/80 flex items-center gap-1.5">
                  <span className="text-cyan-400 text-[10px]">{String(idx + 1).padStart(2, '0')}.</span>
                  <span className="truncate">{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
