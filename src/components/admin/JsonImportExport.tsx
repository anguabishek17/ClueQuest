import React, { useState } from 'react';
import { Download, Upload, FileCode, CheckCircle, AlertCircle, X } from 'lucide-react';
import { request } from '../../utils/api.js';

interface JsonImportExportProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const JsonImportExport: React.FC<JsonImportExportProps> = ({ isOpen, onClose, onSuccess }) => {
  const [jsonText, setJsonText] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setLoading(true);
      const data = await request('/admin/questions/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clue_quest_20_questions_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus({ type: 'success', message: 'Questions JSON exported successfully!' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Export failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      setStatus(null);
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON must be an array of question objects.');
      }

      await request('/admin/questions/import', {
        method: 'POST',
        body: JSON.stringify(parsed),
      });

      setStatus({ type: 'success', message: `Imported ${parsed.length} questions successfully!` });
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Import failed. Check JSON format.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl bg-navy-900 border border-cyan-500/40 rounded-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono font-bold text-white text-base">IMPORT / EXPORT QUESTIONS</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {status && (
          <div
            className={`p-3 rounded text-xs font-mono mb-4 flex items-center gap-2 ${
              status.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {status.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{status.message}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded bg-navy-950 border border-slate-800">
            <div>
              <span className="text-xs font-mono font-bold text-white block">EXPORT QUESTION SUITE</span>
              <span className="text-[11px] text-slate-400">Download active 20 questions with 4-tier clues as JSON</span>
            </div>
            <button
              onClick={handleExport}
              disabled={loading}
              className="px-4 py-2 text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded hover:bg-cyan-500/30 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              EXPORT JSON
            </button>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              PASTE JSON DATA TO IMPORT / UPDATE
            </label>
            <textarea
              rows={8}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Paste JSON array containing question_number, category, question_text, answer, accepted_aliases, clues..."
              className="w-full bg-navy-950 border border-slate-800 rounded p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white">
              CANCEL
            </button>
            <button
              onClick={handleImport}
              disabled={!jsonText.trim() || loading}
              className="px-5 py-2 text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-navy-950 disabled:text-slate-600 rounded shadow-cyan-glow flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              {loading ? 'IMPORTING...' : 'IMPORT & OVERWRITE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
