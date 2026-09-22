import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, Users, FileQuestion, ScrollText, Plus, Download, Upload, Copy, Edit3, Trash2, RefreshCw, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { AdminOverviewResponse, Question } from '../types/index.js';
import { request } from '../utils/api.js';
import { EventController } from '../components/admin/EventController.js';
import { LiveParticipantMatrix } from '../components/admin/LiveParticipantMatrix.js';
import { QuestionEditorModal } from '../components/admin/QuestionEditorModal.js';
import { CsvImportModal } from '../components/admin/CsvImportModal.js';
import { JsonImportExport } from '../components/admin/JsonImportExport.js';
import { ECEChipMotif } from '../components/layout/ECEChipMotif.js';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'questions' | 'logs'>('matrix');
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; details?: string[] } | null>(null);

  // Modal states
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  const fetchOverview = async () => {
    try {
      const data = await request<AdminOverviewResponse>('/admin/overview');
      setOverview(data);
    } catch (err: any) {
      console.error('Failed to fetch admin overview:', err);
    }
  };

  const fetchQuestions = async () => {
    try {
      const data = await request<{ success: boolean; questions: Question[] }>('/admin/questions');
      if (data.success) {
        setQuestions(data.questions);
      }
    } catch (err: any) {
      console.error('Failed to fetch questions:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await request<{ success: boolean; logs: any[] }>('/admin/logs');
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err: any) {
      console.error('Failed to fetch logs:', err);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchOverview(), fetchQuestions(), fetchLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();

    // Auto-poll matrix every 2.5 seconds for live competition monitoring
    const interval = setInterval(() => {
      fetchOverview();
      if (activeTab === 'logs') fetchLogs();
    }, 2500);

    return () => clearInterval(interval);
  }, [activeTab]);

  const handleEventAction = async (action: 'START' | 'START_NOW' | 'PAUSE' | 'RESUME' | 'END' | 'RESET') => {
    try {
      setActionLoading(true);
      setMessage(null);
      const res = await request<{ success: boolean; message: string; details?: string[] }>('/admin/event/control', {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      setMessage({ type: 'success', text: res.message });
      await fetchOverview();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Action failed',
        details: err.data?.details || undefined,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveQuestion = async (formData: any) => {
    try {
      setActionLoading(true);
      await request('/admin/questions/save', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setIsEditorOpen(false);
      setEditingQuestion(null);
      await fetchQuestions();
      await fetchOverview();
      setMessage({ type: 'success', text: 'Question saved successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save question' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      setActionLoading(true);
      await request(`/admin/questions/${id}`, { method: 'DELETE' });
      await fetchQuestions();
      await fetchOverview();
      setMessage({ type: 'success', text: 'Question deleted.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete question' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicateQuestion = (q: Question) => {
    const nextNum = (questions[questions.length - 1]?.question_number || 20) + 1;
    setEditingQuestion({
      ...q,
      id: '',
      question_number: nextNum,
      question_text: `${q.question_text} (Copy)`,
    });
    setIsEditorOpen(true);
  };

  if (loading || !overview) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center font-mono text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <Cpu className="w-10 h-10 animate-spin" />
          <span>INITIALIZING COORDINATOR CONTROL CENTER...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-20">
      <ECEChipMotif />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Top Control Center Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
              <h1 className="text-2xl font-display font-bold text-white tracking-wide">
                CLUE QUEST CONTROL CENTER
              </h1>
            </div>
            <p className="text-xs font-sans font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              VSB ENGINEERING COLLEGE • DEPARTMENT OF ELECTRONICS & COMMUNICATION ENGINEERING
            </p>
          </div>

          <button
            onClick={refreshAll}
            className="px-3.5 py-1.5 rounded bg-navy-900 border border-slate-700 hover:border-cyan-400 text-slate-300 text-xs font-sans font-semibold flex items-center gap-2 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            REFRESH DATA
          </button>
        </div>

        {/* Message / Error Banner */}
        {message && (
          <div
            className={`p-4 rounded-lg text-xs font-mono mb-6 ${
              message.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold">{message.text}</span>
              <button onClick={() => setMessage(null)} className="underline hover:text-white">
                DISMISS
              </button>
            </div>
            {message.details && message.details.length > 0 && (
              <ul className="mt-2 space-y-1 pl-4 list-disc text-rose-300/90 font-sans text-[11px]">
                {message.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Event Lifecycle Controller */}
        <EventController
          event={overview.event}
          onAction={handleEventAction}
          isLoading={actionLoading}
        />

        {/* 3 Nav Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2.5 text-xs font-sans font-bold tracking-wider rounded-t-lg transition flex items-center gap-2 ${
              activeTab === 'matrix'
                ? 'bg-navy-900 border-t-2 border-cyan-400 text-cyan-300'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            PARTICIPANT MONITOR ({overview.participants.length})
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2.5 text-xs font-sans font-bold tracking-wider rounded-t-lg transition flex items-center gap-2 ${
              activeTab === 'questions'
                ? 'bg-navy-900 border-t-2 border-cyan-400 text-cyan-300'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileQuestion className="w-4 h-4" />
            QUESTION BANK ({questions.length} / 20)
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2.5 text-xs font-sans font-bold tracking-wider rounded-t-lg transition flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'bg-navy-900 border-t-2 border-cyan-400 text-cyan-300'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ScrollText className="w-4 h-4" />
            AUDIT LOG
          </button>
        </div>

        {/* TAB 1: LIVE MATRIX */}
        {activeTab === 'matrix' && (
          <LiveParticipantMatrix
            participants={overview.participants}
            stats={overview.stats}
          />
        )}

        {/* TAB 2: QUESTIONS MANAGEMENT */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-navy-900/80 p-4 rounded-lg border border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-mono font-bold text-white uppercase">
                    QUESTION BANK
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border ${
                    questions.length === 20
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {questions.length} / 20 QUESTIONS READY
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  CSV format: <code className="text-cyan-300">serial number,question,clue 1,clue 2,clue 3,clue 4,answer</code>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsCsvModalOpen(true)}
                  className="px-3.5 py-2 rounded bg-cyan-500/15 border border-cyan-500/40 hover:bg-cyan-500/25 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  IMPORT / EXPORT CSV
                </button>
                <button
                  onClick={() => setIsJsonModalOpen(true)}
                  className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  JSON
                </button>
                <button
                  onClick={() => {
                    setEditingQuestion(null);
                    setIsEditorOpen(true);
                  }}
                  className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-cyan-glow transition"
                >
                  <Plus className="w-4 h-4" />
                  ADD QUESTION
                </button>
              </div>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="tech-card p-5 rounded-lg border border-slate-800 hover:border-cyan-500/40 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                          Q{String(q.question_number).padStart(2, '0')}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 uppercase bg-slate-900 px-2 py-0.5 rounded">
                          {q.category}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        4 CLUES ATTACHED
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-white mb-3 leading-snug">
                      {q.question_text}
                    </h4>

                    <div className="bg-navy-950/80 p-3 rounded border border-slate-800 mb-3 space-y-1 text-xs font-mono">
                      <div>
                        <span className="text-slate-400">ANSWER: </span>
                        <span className="text-emerald-400 font-bold uppercase">{q.answer}</span>
                      </div>
                      {q.accepted_aliases && q.accepted_aliases.length > 0 && (
                        <div className="text-[11px] text-slate-500">
                          <span>Aliases: </span>
                          <span className="uppercase">{q.accepted_aliases.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleDuplicateQuestion(q)}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-mono flex items-center gap-1"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingQuestion(q);
                        setIsEditorOpen(true);
                      }}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 text-xs font-mono flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-mono"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="tech-card rounded-lg border border-cyan-500/30 overflow-hidden">
            <div className="p-4 bg-navy-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase">
                SYSTEM AUDIT TRAIL (LAST 60 EVENTS)
              </h3>
              <span className="text-[11px] font-mono text-slate-500">AUTO-REFRESHING</span>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-navy-950/80 border-b border-slate-800 text-slate-400 sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5">TIMESTAMP</th>
                    <th className="px-4 py-2.5">ACTION</th>
                    <th className="px-4 py-2.5">USER ID</th>
                    <th className="px-4 py-2.5">METADATA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/20">
                      <td className="px-4 py-2 text-slate-500 whitespace-nowrap">
                        {new Date(l.created_at).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-2 font-bold text-cyan-400">{l.action}</td>
                      <td className="px-4 py-2 text-slate-300">{l.user_id || 'SYSTEM'}</td>
                      <td className="px-4 py-2 text-slate-400 truncate max-w-xs">
                        {typeof l.metadata === 'object' ? JSON.stringify(l.metadata) : l.metadata}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-500">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <QuestionEditorModal
        isOpen={isEditorOpen}
        question={editingQuestion}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleSaveQuestion}
        isLoading={actionLoading}
      />

      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={() => {
          fetchQuestions();
          fetchOverview();
        }}
      />

      <JsonImportExport
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        onSuccess={() => {
          fetchQuestions();
          fetchOverview();
        }}
      />
    </div>
  );
};
