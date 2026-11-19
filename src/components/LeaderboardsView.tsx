import { useEffect, useState } from 'react';
import { ArrowLeft, Trophy, User, Users } from 'lucide-react';
import type {
  MultiplayerLeaderboardEntry,
  SoloLeaderboardEntry,
} from '../types/game';
import {
  subscribeToGlobalMultiplayerLeaderboard,
  subscribeToSoloLeaderboard,
} from '../services/soloService';
import { formatTimeMMSS } from './PlayerHud';

interface LeaderboardsViewProps {
  initialTab?: 'solo' | 'multiplayer';
  currentUid: string;
  onBack: () => void;
  onStartSolo: () => void;
  onJoinMultiplayer: () => void;
}

export function LeaderboardsView({
  initialTab = 'solo',
  currentUid,
  onBack,
  onStartSolo,
  onJoinMultiplayer,
}: LeaderboardsViewProps) {
  const [activeTab, setActiveTab] = useState<'solo' | 'multiplayer'>(initialTab);
  const [soloEntries, setSoloEntries] = useState<SoloLeaderboardEntry[]>([]);
  const [mpEntries, setMpEntries] = useState<MultiplayerLeaderboardEntry[]>([]);
  const [loadingSolo, setLoadingSolo] = useState(true);
  const [loadingMp, setLoadingMp] = useState(true);

  useEffect(() => {
    const unsubSolo = subscribeToSoloLeaderboard((entries) => {
      setSoloEntries(entries);
      setLoadingSolo(false);
    });
    const unsubMp = subscribeToGlobalMultiplayerLeaderboard((entries) => {
      setMpEntries(entries);
      setLoadingMp(false);
    });
    return () => {
      unsubSolo();
      unsubMp();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-slate-900 arena-grid-bg relative overflow-x-hidden py-8 px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[560px] h-[340px] rounded-full bg-sky-200/45 blur-[110px]"
      />

      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onStartSolo}
              className="px-4 py-2 rounded-xl bg-white hover:bg-sky-50 border border-sky-200 text-xs font-bold text-sky-700 transition-colors whitespace-nowrap shadow-xs"
            >
              Main Solo
            </button>
            <button
              type="button"
              onClick={onJoinMultiplayer}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-105 text-xs font-bold text-white transition-all whitespace-nowrap shadow-sm"
            >
              Gabung Multiplayer
            </button>
          </div>
        </div>

        {/* Title & Segmented Mode Switcher */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>PAPAN PERINGKAT TERPISAH</span>
            </div>
            <h1 className="text-3xl font-black font-display text-slate-900 mt-1">
              {activeTab === 'solo'
                ? 'Leaderboard Mode Solo'
                : 'Leaderboard Mode Multiplayer'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {activeTab === 'solo'
                ? 'Peringkat pemain latihan mandiri. Skor Solo terpisah sepenuhnya dari sesi Multiplayer.'
                : 'Peringkat terbaik pemain dari berbagai sesi pertandingan room Multiplayer.'}
            </p>
          </div>

          {/* Interactive Segmented Tabs */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-200/75 border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('solo')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'solo'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Leaderboard Solo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('multiplayer')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'multiplayer'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Leaderboard Multiplayer
            </button>
          </div>
        </div>

        {/* Separated Table Content */}
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-md shadow-slate-900/5">
          {activeTab === 'solo' ? (
            loadingSolo ? (
              <div className="py-16 text-center text-sm text-slate-500">
                Memuat Leaderboard Solo...
              </div>
            ) : soloEntries.length === 0 ? (
              <div className="py-16 px-6 text-center space-y-3">
                <User className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-800 font-bold text-sm">
                  Belum ada catatan skor di Leaderboard Solo.
                </p>
                <p className="text-xs text-slate-500">
                  Jadilah pemain pertama yang mencetak skor di Mode Solo!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-500">
                      <th className="py-3.5 px-5">Rank</th>
                      <th className="py-3.5 px-5">Nama Pemain</th>
                      <th className="py-3.5 px-5 text-right">Skor</th>
                      <th className="py-3.5 px-5 text-right">Level</th>
                      <th className="py-3.5 px-5 text-right">Challenge</th>
                      <th className="py-3.5 px-5 text-right">Durasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {soloEntries.map((entry, idx) => {
                      const rank = idx + 1;
                      const isMe = entry.uid === currentUid;
                      const rowStyle =
                        rank === 1
                          ? 'bg-amber-50/80 text-slate-900'
                          : rank === 2
                            ? 'bg-slate-50 text-slate-900'
                            : rank === 3
                              ? 'bg-orange-50/70 text-slate-900'
                              : isMe
                                ? 'bg-sky-50 text-sky-900'
                                : 'text-slate-700 hover:bg-slate-50/60';

                      return (
                        <tr key={entry.id} className={rowStyle}>
                          <td className="py-3.5 px-5 font-mono font-bold tabular-nums text-slate-500">
                            #{rank}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-xs"
                                style={{ backgroundColor: entry.avatarColor }}
                              >
                                {entry.name.slice(0, 2).toUpperCase()}
                              </span>
                              <span>
                                {entry.name}
                                {isMe ? ' (Kamu)' : ''}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono font-bold tabular-nums text-amber-600">
                            {entry.score}
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono tabular-nums">
                            {entry.level}
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono tabular-nums">
                            {entry.totalCompleted}
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono tabular-nums text-slate-500">
                            {formatTimeMMSS(entry.durationSeconds)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : loadingMp ? (
            <div className="py-16 text-center text-sm text-slate-500">
              Memuat Leaderboard Multiplayer...
            </div>
          ) : mpEntries.length === 0 ? (
            <div className="py-16 px-6 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-slate-800 font-bold text-sm">
                Belum ada catatan skor di Leaderboard Multiplayer.
              </p>
              <p className="text-xs text-slate-500">
                Buat room atau bergabung ke kelas Multiplayer untuk bersaing bersama teman!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-500">
                    <th className="py-3.5 px-5">Rank</th>
                    <th className="py-3.5 px-5">Nama Pemain</th>
                    <th className="py-3.5 px-5">Room</th>
                    <th className="py-3.5 px-5 text-right">Skor</th>
                    <th className="py-3.5 px-5 text-right">Level</th>
                    <th className="py-3.5 px-5 text-right">Challenge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {mpEntries.map((entry, idx) => {
                    const rank = idx + 1;
                    const isMe = entry.uid === currentUid;
                    const rowStyle =
                      rank === 1
                        ? 'bg-amber-50/80 text-slate-900'
                        : rank === 2
                          ? 'bg-slate-50 text-slate-900'
                          : rank === 3
                            ? 'bg-orange-50/70 text-slate-900'
                            : isMe
                              ? 'bg-sky-50 text-sky-900'
                              : 'text-slate-700 hover:bg-slate-50/60';

                    return (
                      <tr key={entry.id} className={rowStyle}>
                        <td className="py-3.5 px-5 font-mono font-bold tabular-nums text-slate-500">
                          #{rank}
                        </td>
                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-xs"
                              style={{ backgroundColor: entry.avatarColor }}
                            >
                              {entry.name.slice(0, 2).toUpperCase()}
                            </span>
                            <span>
                              {entry.name}
                              {isMe ? ' (Kamu)' : ''}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 font-mono text-xs font-semibold text-violet-700">
                          {entry.roomCode} · R{entry.roundNumber}
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold tabular-nums text-amber-600">
                          {entry.score}
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono tabular-nums">
                          {entry.level}
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono tabular-nums">
                          {entry.totalCompleted}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
