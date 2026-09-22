import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface AnswerFormProps {
  onSubmit: (answer: string) => Promise<void>;
  isLoading: boolean;
  disabled: boolean;
  currentValue: number;
}

export const AnswerForm: React.FC<AnswerFormProps> = ({
  onSubmit,
  isLoading,
  disabled,
  currentValue,
}) => {
  const [answer, setAnswer] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || disabled || isLoading) return;

    await onSubmit(answer.trim().toUpperCase());
    setAnswer('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Automatically display and maintain in ALL CAPITAL LETTERS
    setAnswer(e.target.value.toUpperCase());
  };

  return (
    <div className="tech-card rounded-lg p-5 sm:p-6 border border-cyan-500/30 mt-6">
      <div className="flex items-center justify-between gap-2 mb-3">
        <label className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
          YOUR ANSWER <span className="text-slate-400 font-normal">({currentValue} PTS AT STAKE)</span>
        </label>
        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
          ONE SUBMISSION ONLY
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={answer}
            onChange={handleInputChange}
            disabled={disabled || isLoading}
            placeholder="TYPE YOUR ANSWER (E.G. TRANSISTOR, OP-AMP, PWM)..."
            style={{ textTransform: 'uppercase' }}
            className="w-full bg-navy-950/90 border border-slate-700 focus:border-cyan-400 rounded px-4 py-3 text-sm sm:text-base text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono uppercase tracking-wider transition disabled:opacity-50"
            autoComplete="off"
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={!answer.trim() || disabled || isLoading}
          className="px-6 py-3 rounded font-mono font-bold text-xs uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-navy-950 disabled:text-slate-500 transition shadow-cyan-glow flex items-center justify-center gap-2 shrink-0 disabled:shadow-none"
        >
          <Send className="w-4 h-4" />
          {isLoading ? 'VERIFYING...' : `SUBMIT FOR ${currentValue} PTS`}
        </button>
      </form>

      <p className="text-[11px] font-mono text-slate-500 mt-2">
        • Input converts automatically to uppercase. Evaluated deterministically against canonical technical answer and aliases.
      </p>
    </div>
  );
};
