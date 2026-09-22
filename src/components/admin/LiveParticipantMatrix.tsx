import React, { useState } from 'react';
import { Search, Trophy, CheckCircle, Clock, Zap, Shield, Users, Eye, X, Activity } from 'lucide-react';
import { ParticipantMatrixItem } from '../../types/index.js';
import { request } from '../../utils/api.js';

interface LiveParticipantMatrixProps {
  participants: ParticipantMatrixItem[];
  stats: {
    total_participants: number;
    waiting_count: number;
    in_progress_count: number;
    completed_count: number;
    avg_score: number;
    max_score: number;
  };
}

export const LiveParticipantMatrix: React.FC<LiveParticipantMatrixProps> = ({
  participants,
  stats,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Selected participant for details modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [participantDetail, setParticipantDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const filtered = participants.filter((p) => {
    const matchesSearch =
      p.player_code.toLowerCase().includes(search.toLowerCase()) ||
      p.display_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.team_name && p.team_name.toLowerCase().includes(search.toLowerCase()));

    if (filterStatus === 'ALL') return matchesSearch;
    return matchesSearch && p.status === filterStatus;
  });

  const handleRowClick = async (userId: string) => {
    setSelectedUserId(userId);
    setDetailLoading(true);
    setParticipantDetail(null);

    try {
      const res = await request<any>(`/admin/participant/${userId}`);
      if (res.success) {
        setParticipantDetail(res);
      }
    } catch (err) {
      console.error('Failed to load participant detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="tech-card p-4 rounded-lg border border-cyan-500/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-cyan-400 uppercase">ACTIVE PLAYERS</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-white">
            {stats.in_progress_count + stats.completed_count} <span className="text-slate-500 text-sm">/ {stats.total_participants}</span>
          </div>
        </div>

        <div className="tech-card p-4 rounded-lg border border-amber-500/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-amber-400 uppercase">WAITING</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-amber-300">
            {stats.waiting_count}
          </div>
        </div>

        <div className="tech-card p-4 rounded-lg border border-emerald-500/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-emerald-400 uppercase">COMPLETED</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-emerald-400">
            {stats.completed_count}
          </div>
        </div>

        <div className="tech-card p-4 rounded-lg border border-blue-500/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-blue-400 uppercase">TOP SCORE</span>
            <Trophy className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-cyan-300">
            {stats.max_score} <span className="text-slate-500 text-sm">/ 2000</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-navy-900/80 p-3 rounded-lg border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search player code or team name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-navy-950 border border-slate-700/80 rounded pl-9 pr-3 py-1.5 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'LIVE', 'WAITING', 'COMPLETED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded text-[11px] font-mono transition ${
                filterStatus === st
                  ? 'bg-cyan-500 text-navy-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table Matrix */}
      <div className="tech-card rounded-lg border border-cyan-500/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-navy-950/90 border-b border-slate-800 text-slate-400 uppercase">
              <tr>
                <th className="px-4 py-3">PLAYER</th>
                <th className="px-4 py-3">TEAM</th>
                <th className="px-4 py-3 text-center">QUESTION</th>
                <th className="px-4 py-3 text-center">CLUE</th>
                <th className="px-4 py-3 text-center">CURRENT VALUE</th>
                <th className="px-4 py-3 text-right">TOTAL SCORE</th>
                <th className="px-4 py-3 text-center">INTEGRITY</th>
                <th className="px-4 py-3 text-center">STATUS</th>
                <th className="px-4 py-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((p) => {
                let statusBadge = (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                    {p.status}
                  </span>
                );
                if (p.status === 'LIVE') {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      LIVE
                    </span>
                  );
                } else if (p.status === 'COMPLETED') {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                      COMPLETED
                    </span>
                  );
                }

                const violationCount = p.integrity_events_count || 0;

                return (
                  <tr
                    key={p.user_id}
                    onClick={() => handleRowClick(p.user_id)}
                    className="hover:bg-cyan-500/10 cursor-pointer transition"
                  >
                    <td className="px-4 py-3 font-bold text-cyan-400">{p.player_code}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-300">
                      {p.team_name ? p.team_name : <span className="text-slate-600 font-normal italic">Unregistered</span>}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-cyan-300">
                      {p.question_display}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-navy-950 border border-slate-700 text-slate-300 font-bold">
                        {p.clue_display}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-amber-400 font-bold">{p.current_value} PTS</span>
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-emerald-400 text-sm">
                      {String(p.total_score).padStart(4, '0')} <span className="text-slate-600 text-[10px]">/ 2000</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {violationCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                          ⚠ {violationCount}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold text-xs">✓</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">{statusBadge}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(p.user_id);
                        }}
                        className="p-1 rounded hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-500 font-mono">
                    No participants matched your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PARTICIPANT DETAILS MODAL */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="tech-card w-full max-w-lg rounded-xl p-6 border border-cyan-500/40 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedUserId(null)}
              className="absolute right-4 top-4 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-mono font-bold text-white uppercase tracking-wider">
                PARTICIPANT DIAGNOSTICS
              </h3>
            </div>

            {detailLoading ? (
              <div className="py-12 text-center text-slate-400 font-mono text-xs animate-pulse">
                Fetching participant diagnostic metrics...
              </div>
            ) : participantDetail?.participant ? (
              <div className="space-y-4">
                {/* Header info */}
                <div className="bg-navy-950 p-4 rounded-lg border border-slate-800 grid grid-cols-2 gap-3 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">PLAYER CODE</span>
                    <span className="text-cyan-300 font-bold text-sm">{participantDetail.participant.player_code}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">TEAM NAME</span>
                    <span className="text-emerald-300 font-bold text-sm">{participantDetail.participant.team_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">STATUS</span>
                    <span className="text-white font-bold">{participantDetail.participant.status}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">TOTAL SCORE</span>
                    <span className="text-emerald-400 font-extrabold text-sm">{participantDetail.participant.total_score} / 2000</span>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
                  <div className="p-2.5 rounded bg-navy-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">QUESTION</span>
                    <span className="text-sm font-bold text-cyan-300">{participantDetail.participant.current_question} / 20</span>
                  </div>
                  <div className="p-2.5 rounded bg-navy-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">CLUE LEVEL</span>
                    <span className="text-sm font-bold text-cyan-300">C{participantDetail.participant.current_clue_level} / 4</span>
                  </div>
                  <div className="p-2.5 rounded bg-navy-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">INTEGRITY</span>
                    <span className={`text-sm font-bold ${participantDetail.participant.integrity_events_count > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {participantDetail.participant.integrity_events_count > 0 ? `⚠ ${participantDetail.participant.integrity_events_count}` : '✓ CLEAN'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-navy-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">CORRECT</span>
                    <span className="text-sm font-bold text-emerald-400">{participantDetail.participant.correct_answers}</span>
                  </div>
                </div>

                {/* Integrity Activity Logs */}
                {participantDetail.integrity_logs && participantDetail.integrity_logs.length > 0 && (
                  <div>
                    <h4 className="text-xs font-mono font-bold text-amber-400 uppercase mb-2 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      <span>INTEGRITY ACTIVITY LOG ({participantDetail.integrity_logs.length})</span>
                    </h4>
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1 bg-navy-950/80 p-2 rounded-lg border border-amber-500/20">
                      {participantDetail.integrity_logs.map((log: any, idx: number) => {
                        const timeStr = new Date(log.created_at).toLocaleTimeString();
                        return (
                          <div key={idx} className="font-mono text-[11px] flex items-center justify-between text-slate-300 py-0.5 border-b border-slate-800/60 last:border-0">
                            <span className="text-amber-400 font-semibold">{log.type}</span>
                            <span className="text-slate-500 text-[10px]">{timeStr}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Attempted Questions List */}
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase mb-2">
                    RECENT ATTEMPTS ({participantDetail.attempts?.length || 0})
                  </h4>
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {participantDetail.attempts?.map((att: any, i: number) => (
                      <div
                        key={i}
                        className={`p-2 rounded font-mono text-xs flex items-center justify-between border ${
                          att.is_correct
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">Q{i + 1}</span>
                          <span className="text-[11px] text-slate-400 font-sans">"{att.user_answer}"</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-950 text-slate-300">
                            C{att.highest_clue_level}
                          </span>
                          <span className="font-extrabold">{att.earned_points} PTS</span>
                        </div>
                      </div>
                    ))}
                    {(!participantDetail.attempts || participantDetail.attempts.length === 0) && (
                      <div className="text-slate-500 font-mono text-xs py-4 text-center">
                        No question submissions recorded yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-right">
                  <button
                    type="button"
                    onClick={() => setSelectedUserId(null)}
                    className="py-1.5 px-4 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono uppercase text-slate-300 transition"
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-rose-400 text-xs font-mono py-6 text-center">
                Could not load participant diagnostic metrics.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

