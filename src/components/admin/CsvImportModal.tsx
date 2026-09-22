import React, { useState } from 'react';
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Eye } from 'lucide-react';
import { request } from '../../utils/api.js';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedPreviewRow {
  serial: number;
  question: string;
  clue1: string;
  clue2: string;
  clue3: string;
  clue4: string;
  answer: string;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [csvText, setCsvText] = useState('');
  const [previewRows, setPreviewRows] = useState<ParsedPreviewRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Simple CSV line parser
  const parseAndPreview = (text: string) => {
    setCsvText(text);
    setStatus(null);
    setValidationErrors([]);

    if (!text.trim()) {
      setPreviewRows([]);
      return;
    }

    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      setPreviewRows([]);
      return;
    }

    const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const snIdx = header.findIndex(h => h.includes('serial') || h === 'sn' || h === 'no' || h === '#');
    const qIdx = header.findIndex(h => h.includes('question') && !h.includes('clue'));
    const c1Idx = header.findIndex(h => h.includes('clue 1') || h === 'clue1' || h === 'clue 01');
    const c2Idx = header.findIndex(h => h.includes('clue 2') || h === 'clue2' || h === 'clue 02');
    const c3Idx = header.findIndex(h => h.includes('clue 3') || h === 'clue3' || h === 'clue 03');
    const c4Idx = header.findIndex(h => h.includes('clue 4') || h === 'clue4' || h === 'clue 04');
    const aIdx = header.findIndex(h => h.includes('answer'));

    const errors: string[] = [];
    if (snIdx === -1 || qIdx === -1 || c1Idx === -1 || c2Idx === -1 || c3Idx === -1 || c4Idx === -1 || aIdx === -1) {
      errors.push('Missing required column header. Expected: serial number, question, clue 1, clue 2, clue 3, clue 4, answer');
      setValidationErrors(errors);
      setPreviewRows([]);
      return;
    }

    const parsed: ParsedPreviewRow[] = [];
    const dataLines = lines.slice(1).filter(l => l.trim().length > 0);

    for (let i = 0; i < dataLines.length; i++) {
      // Split preserving quotes
      const row = dataLines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || dataLines[i].split(',');
      const cleanRow = row.map(cell => cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

      const serial = parseInt(cleanRow[snIdx] || '', 10);
      const q = cleanRow[qIdx] || '';
      const c1 = cleanRow[c1Idx] || '';
      const c2 = cleanRow[c2Idx] || '';
      const c3 = cleanRow[c3Idx] || '';
      const c4 = cleanRow[c4Idx] || '';
      const ans = (cleanRow[aIdx] || '').toUpperCase();

      parsed.push({ serial, question: q, clue1: c1, clue2: c2, clue3: c3, clue4: c4, answer: ans });

      if (isNaN(serial)) errors.push(`Row ${i + 1}: Invalid serial number.`);
      if (!q) errors.push(`Row ${i + 1}: Missing question text.`);
      if (!c1) errors.push(`Row ${i + 1}: Missing Clue 1.`);
      if (!c2) errors.push(`Row ${i + 1}: Missing Clue 2.`);
      if (!c3) errors.push(`Row ${i + 1}: Missing Clue 3.`);
      if (!c4) errors.push(`Row ${i + 1}: Missing Clue 4.`);
      if (!ans) errors.push(`Row ${i + 1}: Missing answer.`);
    }

    if (parsed.length !== 20) {
      errors.unshift(`QUESTION BANK INVALID: Exactly 20 questions are required. (${parsed.length} found)`);
    }

    setPreviewRows(parsed);
    setValidationErrors(errors);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseAndPreview(text);
    };
    reader.readAsText(file);
  };

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/questions/export-csv', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cq_token') || ''}`,
        },
      });
      if (!res.ok) throw new Error('Failed to export CSV');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clue_quest_20_questions_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus({ type: 'success', message: 'CSV exported successfully!' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Export error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCommitImport = async () => {
    try {
      setLoading(true);
      setStatus(null);
      const res = await request('/admin/questions/import-csv', {
        method: 'POST',
        body: JSON.stringify({ csvText }),
      });

      setStatus({ type: 'success', message: res.message || 'Successfully imported 20 questions!' });
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'CSV Import failed. Check format.' });
    } finally {
      setLoading(false);
    }
  };

  const isValid = previewRows.length === 20 && validationErrors.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-navy-900 border border-cyan-500/40 rounded-xl p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono font-bold text-white text-base uppercase">
              QUESTION BANK CSV IMPORT / EXPORT
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {status && (
          <div
            className={`p-3.5 rounded text-xs font-mono mb-4 flex items-center gap-2 ${
              status.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{status.message}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Header Requirements Spec Box */}
          <div className="bg-navy-950 p-3.5 rounded-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-mono font-bold text-cyan-400 block mb-1">
                REQUIRED CSV HEADER FORMAT:
              </span>
              <code className="text-[11px] font-mono text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                serial number,question,clue 1,clue 2,clue 3,clue 4,answer
              </code>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={loading}
              className="shrink-0 px-3.5 py-1.5 rounded bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 text-xs font-mono flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              EXPORT CURRENT CSV
            </button>
          </div>

          {/* Upload and Paste inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 p-4 rounded-lg bg-navy-950/80 border border-slate-800 flex flex-col justify-center text-center">
              <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <span className="text-xs font-mono text-slate-300 font-bold mb-1">CHOOSE CSV FILE</span>
              <p className="text-[10px] text-slate-500 mb-3">Upload .csv with 20 questions</p>
              <label className="cursor-pointer px-3 py-2 rounded bg-cyan-500 text-navy-950 text-xs font-mono font-bold hover:bg-cyan-400 transition shadow-cyan-glow">
                SELECT FILE
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-mono text-slate-400 mb-1 uppercase">
                OR PASTE CSV TEXT DIRECTLY:
              </label>
              <textarea
                rows={4}
                value={csvText}
                onChange={(e) => parseAndPreview(e.target.value)}
                placeholder="serial number,question,clue 1,clue 2,clue 3,clue 4,answer&#10;1,Which electronic component opposes current flow?,It is measured in ohms,It commonly uses colored bands,It limits current in circuits,It is a passive component,RESISTOR"
                className="w-full bg-navy-950 border border-slate-800 rounded p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Validation Warnings */}
          {validationErrors.length > 0 && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono max-h-32 overflow-y-auto space-y-1">
              {validationErrors.map((err, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          {/* Preview Table */}
          {previewRows.length > 0 && (
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <div className="p-2.5 bg-navy-950 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  PARSED CSV PREVIEW ({previewRows.length} / 20 QUESTIONS)
                </span>
                {isValid ? (
                  <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                    ✓ 20 QUESTIONS VALID
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold">
                    INVALID ({previewRows.length}/20)
                  </span>
                )}
              </div>

              <div className="max-h-52 overflow-y-auto overflow-x-auto text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="bg-navy-950/70 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="p-2 text-center">#</th>
                      <th className="p-2">QUESTION</th>
                      <th className="p-2">CLUE 1</th>
                      <th className="p-2">CLUE 2</th>
                      <th className="p-2">CLUE 3</th>
                      <th className="p-2">CLUE 4</th>
                      <th className="p-2">ANSWER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="p-2 text-center font-bold text-cyan-400">{row.serial}</td>
                        <td className="p-2 text-slate-200 truncate max-w-[180px]">{row.question}</td>
                        <td className="p-2 text-slate-400 truncate max-w-[120px]">{row.clue1}</td>
                        <td className="p-2 text-slate-400 truncate max-w-[120px]">{row.clue2}</td>
                        <td className="p-2 text-slate-400 truncate max-w-[120px]">{row.clue3}</td>
                        <td className="p-2 text-slate-400 truncate max-w-[120px]">{row.clue4}</td>
                        <td className="p-2 text-emerald-400 font-bold uppercase">{row.answer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleCommitImport}
              disabled={!isValid || loading}
              className="px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-navy-950 disabled:text-slate-600 shadow-cyan-glow flex items-center gap-1.5 transition disabled:shadow-none"
            >
              <Upload className="w-3.5 h-3.5" />
              {loading ? 'IMPORTING...' : 'IMPORT QUESTIONS (ATOMIC)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
