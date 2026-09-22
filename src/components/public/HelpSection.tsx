import React from 'react';
import { HelpCircle, Mail, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const HelpSection: React.FC = () => {
  return (
    <div id="help-section" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
          SUPPORT & FAQ
        </span>
        <h2 className="text-3xl font-display font-extrabold text-white">
          Participant Guidelines & Troubleshooting
        </h2>
      </div>

      <div className="space-y-4 mb-10">
        {[
          {
            q: 'How does the 100 → 75 → 50 → 25 point progression work?',
            a: 'Every question starts at 100 points with Clue 1 unlocked. If you submit a correct answer right away, you earn +100 points. If you unlock Clue 2, this question’s potential reward drops to 75 points. Unlocking Clue 3 drops it to 50, and Clue 4 drops it to 25. Your previously accumulated score is NEVER reduced.',
          },
          {
            q: 'What happens if my internet connection drops during the game?',
            a: 'The authoritative game state is continuously preserved on the server database. If your connection drops, a "CONNECTION INTERRUPTED" banner will appear. Simply click "RETRY SYNC" or refresh your page. You will resume right from the current question with all revealed clues intact.',
          },
          {
            q: 'How are answers evaluated?',
            a: 'Answers are evaluated deterministically on the server. Leading/trailing whitespace and punctuation are stripped, and standard electronic acronyms (such as BJT, Op-Amp, PWM, I2C, SPI, ADC, DAC, MOSFET) are recognized as valid aliases.',
          },
          {
            q: 'How many answer attempts do I have per question?',
            a: 'Exactly ONE submission per question. Once you submit, the question is evaluated immediately and the correct answer is revealed before advancing to the next question.',
          },
        ].map((item, idx) => (
          <div key={idx} className="tech-card p-5 rounded-lg border border-slate-800">
            <h4 className="text-sm font-mono font-bold text-cyan-300 mb-2 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              {item.q}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans pl-6">
              {item.a}
            </p>
          </div>
        ))}
      </div>

      <div className="tech-card p-6 rounded-xl border border-cyan-500/30 text-center">
        <h4 className="text-sm font-mono font-bold text-white mb-1">Need Coordinator Assistance?</h4>
        <p className="text-xs text-slate-400 mb-4">
          Contact the ECE Department Event Control Desk in the Microprocessor / VLSI Simulation Laboratory.
        </p>
        <span className="text-xs font-mono text-cyan-400 bg-navy-950 px-3 py-1.5 rounded border border-cyan-500/30 inline-block">
          Email: hod.ece@vsbec.edu.in • VSB ECE Karur
        </span>
      </div>
    </div>
  );
};
