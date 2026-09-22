import React, { useEffect, useState } from 'react';
import { Trophy, RefreshCw, Medal, Users } from 'lucide-react';
import { request } from '../../utils/api.js';

export const LeaderboardSection: React.FC = () => {
  const [data, setData] = useState<{ event: any; leaderboard: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await request('/event/leaderboard');
      setData(res);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div id="leaderboard-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
            TOURNAMENT STANDINGS
          </span>
          <h2 className="text-3xl font-display font-extrabold text-white">
            Official Live Leaderboard
          </h2>
          <p className="text-xs font-mono text-slate-400">
            {data?.event?.name || 'CLUE QUEST 2026'} • RANKED BY AUTHORITATIVE SCORES
          </p>
        </div>

        <button
          onClick={fetchLeaderboard}
          className="px-4 py-2 rounded bg-navy-900 border border-slate-700 hover:border-cyan-400 text-slate-300 text-xs font-mono flex items-center gap-2 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          REFRESH RANKS
        </button>
      </div>

      <div className="tech-card rounded-xl border border-cyan-500/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-navy-950 border-b border-slate-800 text-slate-400 uppercase">
              <tr>
                <th className="px-5 py-3.5 text-center">RANK</th>
                <th className="px-5 py-3.5">PLAYER</th>
                <th className="px-5 py-3.5">TEAM</th>
                <th className="px-5 py-3.5 text-center">QUESTIONS</th>
                <th className="px-5 py-3.5 text-center">STATUS</th>
                <th className="px-5 py-3.5 text-right">TOTAL SCORE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data?.leaderboard?.map((row) => (
                <tr key={row.player_code} className="hover:bg-cyan-500/5 transition">
                  <td className="px-5 py-3 text-center font-bold">
                    {row.rank === 1 && <span className="text-yellow-400 text-sm">🥇 #1</span>}
                    {row.rank === 2 && <span className="text-slate-300 text-sm">🥈 #2</span>}
                    {row.rank === 3 && <span className="text-amber-600 text-sm">🥉 #3</span>}
                    {row.rank > 3 && <span className="text-slate-500">#{row.rank}</span>}
                  </td>
                  <td className="px-5 py-3 font-bold text-cyan-400">{row.player_code}</td>
                  <td className="px-5 py-3 font-semibold text-emerald-300">
                    {row.team_name || row.display_name}
                  </td>
                  <td className="px-5 py-3 text-center text-slate-300">
                    Q{String(row.questions_reached).padStart(2, '0')} / 20
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-400">
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-extrabold text-emerald-400 text-sm">
                    {String(row.total_score).padStart(4, '0')} <span className="text-slate-600 text-[10px]">PTS</span>
                  </td>
                </tr>
              ))}
              {(!data?.leaderboard || data.leaderboard.length === 0) && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 font-mono">
                    {loading ? 'Loading official tournament leaderboard...' : 'No participant scores recorded yet. Tournament will rank scores as players answer.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
