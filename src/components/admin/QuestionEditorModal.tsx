import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Cpu } from 'lucide-react';
import { Question, Clue } from '../../types/index.js';

interface QuestionEditorModalProps {
  isOpen: boolean;
  question: Question | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  isLoading: boolean;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  question,
  onClose,
  onSave,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    id: '',
    question_number: 1,
    category: 'Analog Circuits',
    question_text: '',
    answer: '',
    aliasesText: '',
    clue1: '',
    clue2: '',
    clue3: '',
    clue4: '',
  });

  useEffect(() => {
    if (question) {
      const clues = question.clues || [];
      const c1 = clues.find(c => c.level === 1)?.clue_text || '';
      const c2 = clues.find(c => c.level === 2)?.clue_text || '';
      const c3 = clues.find(c => c.level === 3)?.clue_text || '';
      const c4 = clues.find(c => c.level === 4)?.clue_text || '';

      setFormData({
        id: question.id,
        question_number: question.question_number,
        category: question.category,
        question_text: question.question_text,
        answer: question.answer || '',
        aliasesText: (question.accepted_aliases || []).join(', '),
        clue1: c1,
        clue2: c2,
        clue3: c3,
        clue4: c4,
      });
    } else {
      setFormData({
        id: '',
        question_number: 1,
        category: 'Analog Circuits',
        question_text: '',
        answer: '',
        aliasesText: '',
        clue1: '',
        clue2: '',
        clue3: '',
        clue4: '',
      });
    }
  }, [question, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const aliases = formData.aliasesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    await onSave({
      id: formData.id || undefined,
      question_number: Number(formData.question_number),
      category: formData.category,
      question_text: formData.question_text,
      answer: formData.answer,
      accepted_aliases: aliases,
      clues: [
        { level: 1, points: 100, text: formData.clue1 },
        { level: 2, points: 75, text: formData.clue2 },
        { level: 3, points: 50, text: formData.clue3 },
        { level: 4, points: 25, text: formData.clue4 },
      ],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-navy-900 border border-cyan-500/40 rounded-xl p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono font-bold text-white text-base">
              {question ? `EDIT QUESTION #${question.question_number}` : 'ADD NEW QUESTION'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">QUESTION NUMBER</label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.question_number}
                onChange={(e) => setFormData({ ...formData, question_number: parseInt(e.target.value, 10) || 1 })}
                className="w-full bg-navy-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">CATEGORY</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-navy-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">QUESTION STATEMENT</label>
            <textarea
              rows={2}
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              placeholder="e.g. Identify this two-terminal passive component..."
              className="w-full bg-navy-950 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-sans"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-cyan-400 mb-1">CANONICAL ANSWER</label>
              <input
                type="text"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="e.g. Transistor"
                className="w-full bg-navy-950 border border-cyan-500/50 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">ACCEPTED ALIASES (COMMA SEPARATED)</label>
              <input
                type="text"
                value={formData.aliasesText}
                onChange={(e) => setFormData({ ...formData, aliasesText: e.target.value })}
                placeholder="e.g. bjt, bipolar junction transistor"
                className="w-full bg-navy-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* 4 Fixed Clues */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-mono text-cyan-400 font-bold uppercase">Progressive Clues (4 Tiers)</h4>

            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span>CLUE 1</span>
                <span className="text-cyan-400 font-bold">100 POINTS (DEFAULT VISIBLE)</span>
              </div>
              <textarea
                rows={2}
                value={formData.clue1}
                onChange={(e) => setFormData({ ...formData, clue1: e.target.value })}
                placeholder="Enter Clue 1 text..."
                className="w-full bg-navy-950 border border-slate-800 rounded p-2 text-xs text-white focus:border-cyan-400 font-sans"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span>CLUE 2</span>
                <span className="text-cyan-400 font-bold">75 POINTS</span>
              </div>
              <textarea
                rows={2}
                value={formData.clue2}
                onChange={(e) => setFormData({ ...formData, clue2: e.target.value })}
                placeholder="Enter Clue 2 text..."
                className="w-full bg-navy-950 border border-slate-800 rounded p-2 text-xs text-white focus:border-cyan-400 font-sans"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span>CLUE 3</span>
                <span className="text-cyan-400 font-bold">50 POINTS</span>
              </div>
              <textarea
                rows={2}
                value={formData.clue3}
                onChange={(e) => setFormData({ ...formData, clue3: e.target.value })}
                placeholder="Enter Clue 3 text..."
                className="w-full bg-navy-950 border border-slate-800 rounded p-2 text-xs text-white focus:border-cyan-400 font-sans"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span>CLUE 4</span>
                <span className="text-cyan-400 font-bold">25 POINTS (FINAL HINT)</span>
              </div>
              <textarea
                rows={2}
                value={formData.clue4}
                onChange={(e) => setFormData({ ...formData, clue4: e.target.value })}
                placeholder="Enter Clue 4 text..."
                className="w-full bg-navy-950 border border-slate-800 rounded p-2 text-xs text-white focus:border-cyan-400 font-sans"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-navy-950 rounded shadow-cyan-glow flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isLoading ? 'SAVING...' : 'SAVE QUESTION'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
