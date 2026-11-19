import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Clock,
  Home,
  Layers,
  RotateCcw,
  Trophy,
  User,
} from 'lucide-react';
import type { SoloLeaderboardEntry, SoloSessionResult } from '../types/game';
import { subscribeToSoloLeaderboard } from '../services/soloService';
import { soundManager } from '../services/soundManager';
import { formatTimeMMSS } from './PlayerHud';

interface SoloResultsProps {
  result: SoloSessionResult;
  onPlayAgain: () => void;
  onBackHome: () => void;
  onOpenAllLeaderboards: () => void;
}

export function SoloResults({
  result,
  onPlayAgain,
  onBackHome,
  onOpenAllLeaderboards,
}: SoloResultsProps) {
  const [soloEntries, setSoloEntries] = useState<SoloLeaderboardEntry[]>([]);

  useEffect(() => {
    soundManager.stopMusic();
    if (result.score > 0) {
      soundManager.playWinner();
      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#06B6D4', '#3B82F6', '#F59E0B', '#8B5CF6'],
      });
    }
  }, [result.score]);

  useEffect(() => {
    const unsub = subscribeToSoloLeaderboard((entries) => {
      setSoloEntries(entries);
    });
    return () => unsub();
  }, []);

  const myRankIndex = result.entryId
    ? soloEntries.findIndex((e) => e.id === result.entryId)
    : -1;
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : null;

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-slate-900 arena-grid-bg relative overflow-x-hidden py-10 px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[560px] h-[340px] rounded-full bg-sky-200/45 blur-[110px]"
      />

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        {/* Solo Result Hero Card */}
        <div className="rounded-2xl bg-white border border-sky-200 p-8 shadow-xl shadow-sky-900/5 text-center space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-sky-600 uppercase">
              <User className="w-4 h-4" />
              <span>HASIL BERMAIN SOLO</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-display text-slate-900">
              {result.playerName}
            </h1>
            <p className="text-sm text-slate-600">
              {result.endReason === 'eliminated'
                ? 'Sesi latihan selesai karena nyawa habis.'
                : 'Sesi latihan diselesaikan dengan baik.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <span className="text-xs font-semibold text-amber-800">Skor Akhir</span>
              <p className="text-3xl font-black font-mono tabular-nums text-amber-600 mt-1">
                {result.score}
              </p>
            </div>
            <div className="rounded-xl bg-sky-50 border border-sky-200 p-4">
              <span className="text-xs font-semibold text-sky-800 flex items-center justify-center gap-1">
                <Layers className="w-3.5 h-3.5 text-sky-600" />
                Level
              </span>
              <p className="text-3xl font-black font-mono tabular-nums text-slate-900 mt-1">
                {result.level}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <span className="text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Tantangan
              </span>
              <p className="text-3xl font-black font-mono tabular-nums text-slate-900 mt-1">
                {result.totalCompleted}
              </p>
            </div>
            <div className="rounded-xl bg-violet-50 border border-violet-200 p-4">
              <span className="text-xs font-semibold text-violet-800 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-violet-600" />
                Waktu
              </span>
              <p className="text-2xl font-black font-mono tabular-nums text-slate-900 mt-1.5">
                {formatTimeMMSS(result.durationSeconds)}
              </p>
            </div>
          </div>

          {result.savedToLeaderboard ? (
            <p className="text-xs text-emerald-700 font-semibold">
              Skor berhasil disimpan ke Leaderboard Solo
              {myRank !== null ? ` — Peringkat #${myRank}` : ''}.
            </p>
          ) : (
            <p className="text-xs font-medium text-amber-700">
              Selesaikan minimal 1 tantangan agar skormu tercatat di Leaderboard Solo.
            </p>
          )}
        </div>

        {/* Dedicated Solo Leaderboard */}
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-md shadow-slate-900/5">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold font-display text-slate-900">
                Leaderboard Solo
              </h2>
            </div>
            <button
              type="button"
              onClick={onOpenAllLeaderboards}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
            >
              Bandingkan dengan Leaderboard Multiplayer →
            </button>
          </div>

          {soloEntries.length === 0 ? (
            <div className="py-10 px-6 text-center text-sm text-slate-500">
              Belum ada skor Solo tersimpan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-500">
                    <th className="py-3.5 px-5">Rank</th>
                    <th className="py-3.5 px-5">Nama Pemain</th>
                    <th className="py-3.5 px-5 text-right">Skor</th>
                    <th className="py-3.5 px-5 text-right">Level</th>
                    <th className="py-3.5 px-5 text-right">Challenge</th>
                    <th className="py-3.5 px-5 text-right">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {soloEntries.slice(0, 20).map((entry, idx) => {
                    const rank = idx + 1;
                    const isMine = entry.id === result.entryId;
                    const highlight = isMine
                      ? 'bg-sky-50 text-sky-900'
                      : rank === 1
                        ? 'bg-amber-50/70 text-slate-900'
                        : rank === 2
                          ? 'bg-slate-50 text-slate-900'
                          : rank === 3
                            ? 'bg-orange-50/60 text-slate-900'
                            : 'text-slate-700';

                    return (
                      <tr key={entry.id} className={highlight}>
                        <td className="py-3.5 px-5 font-mono font-bold tabular-nums text-slate-500">
                          #{rank}
                        </td>
                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          {entry.name}
                          {isMine ? ' (Sesi Ini)' : ''}
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
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 pb-6">
          <button
            type="button"
            onClick={onPlayAgain}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white font-bold text-sm shadow-md shadow-sky-500/20 transition-all whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            MAIN LAGI (SOLO)
          </button>

          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm transition-colors whitespace-nowrap shadow-xs"
          >
            <Home className="w-4 h-4" />
            KEMBALI KE BERANDA
          </button>
        </div>
      </div>
    </div>
  );
}
