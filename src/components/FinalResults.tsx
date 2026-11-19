import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Award, Home, Medal, RotateCcw, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import type { LeaderboardEntry, PlayerData, RoomData } from '../types/game';
import { playAgainRoom } from '../services/roomManager';
import {
  MAX_LEADERBOARD_ENTRIES,
  sortLeaderboard,
} from '../services/scoreManager';
import { soundManager } from '../services/soundManager';

interface FinalResultsProps {
  room: RoomData;
  players: PlayerData[];
  leaderboard: LeaderboardEntry[];
  isHost: boolean;
  currentUid: string;
  onBackHome: () => void;
}

export function FinalResults({
  room,
  players,
  leaderboard,
  isHost,
  currentUid,
  onBackHome,
}: FinalResultsProps) {
  const [revealStep, setRevealStep] = useState(0);
  const [confirmPlayAgain, setConfirmPlayAgain] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Strictly Top 20 entries from the backend leaderboard collection
  const rankedTop20 = sortLeaderboard(leaderboard).slice(0, MAX_LEADERBOARD_ENTRIES);
  const first = rankedTop20[0] || null;
  const second = rankedTop20[1] || null;
  const third = rankedTop20[2] || null;
  const rank4To20 = rankedTop20.slice(3, MAX_LEADERBOARD_ENTRIES);

  const currentPlayer = players.find((p) => p.uid === currentUid) || null;
  const isInTop20 = rankedTop20.some((e) => e.uid === currentUid);

  useEffect(() => {
    soundManager.stopMusic();
    soundManager.playWinner();

    const t1 = window.setTimeout(() => setRevealStep(1), 250);
    const t2 = window.setTimeout(() => setRevealStep(2), 700);
    const t3 = window.setTimeout(() => {
      setRevealStep(3);
      confetti({
        particleCount: 95,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#F59E0B', '#06B6D4', '#3B82F6', '#8B5CF6', '#FDE68A'],
      });
    }, 1150);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  const handleConfirmPlayAgain = async () => {
    if (!isHost || resetting) return;
    setResetting(true);
    try {
      await playAgainRoom(room.roomCode, room.roundNumber, players);
    } finally {
      setResetting(false);
      setConfirmPlayAgain(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-slate-900 arena-grid-bg relative overflow-x-hidden py-10 px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[620px] h-[360px] rounded-full bg-amber-200/45 blur-[110px]"
      />

      <div className="relative z-10 max-w-5xl mx-auto space-y-10">
        {/* Header + Bright Trophy Emblem */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-100 via-yellow-50 to-white shadow-lg shadow-amber-500/15 flex items-center justify-center">
            <Trophy className="w-12 h-12 text-amber-500" />
          </div>

          <div>
            <p className="text-xs font-mono font-bold tracking-[0.25em] text-amber-600 uppercase">
              FINAL LEADERBOARD TOP 20 · ROOM {room.roomCode}
            </p>
            <h1 className="text-3xl sm:text-5xl font-black font-display text-slate-900 mt-1">
              Podium Juara Arena
            </h1>
          </div>
        </div>

        {/* Podium Top 3 (Gold · Silver · Bronze) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end pt-2">
          {/* Juara 2 — Silver */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={
              revealStep >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }
            }
            transition={{ duration: 0.4 }}
            className="order-2 md:order-1 rounded-2xl bg-gradient-to-b from-slate-100 to-white border-2 border-slate-300 p-6 text-center md:min-h-[235px] shadow-lg shadow-slate-900/5 flex flex-col justify-between"
          >
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-2">
                <Medal className="w-4 h-4 text-slate-500" />
                <span>RANKING 2 · SILVER</span>
              </div>
              {second ? (
                <>
                  <h2 className="text-xl font-bold font-display text-slate-900 truncate">
                    {second.name}
                    {second.uid === currentUid ? ' (Kamu)' : ''}
                  </h2>
                  <p className="text-3xl font-black font-mono tabular-nums text-slate-700 mt-3">
                    {second.score}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 tabular-nums">
                    Level Tertinggi {second.level} · {second.totalCompleted} challenge berhasil
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-400 mt-4">—</p>
              )}
            </div>
          </motion.div>

          {/* Juara 1 — Gold (Tallest Podium) */}
          <motion.div
            initial={{ opacity: 0, y: 36, scale: 0.94 }}
            animate={
              revealStep >= 3
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: 0, y: 36, scale: 0.94 }
            }
            transition={{ duration: 0.45 }}
            className="order-1 md:order-2 rounded-2xl bg-gradient-to-b from-amber-100 via-amber-50 to-white border-2 border-amber-400 p-7 text-center md:min-h-[285px] shadow-xl shadow-amber-500/15 flex flex-col justify-between"
          >
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-700 mb-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>RANKING 1 · GOLD CHAMPION</span>
              </div>
              {first ? (
                <>
                  <h2 className="text-2xl font-black font-display text-slate-900 truncate">
                    {first.name}
                    {first.uid === currentUid ? ' (Kamu)' : ''}
                  </h2>
                  <p className="text-4xl sm:text-5xl font-black font-mono tabular-nums text-amber-600 mt-4">
                    {first.score}
                  </p>
                  <p className="text-xs font-medium text-amber-900/80 mt-2 tabular-nums">
                    Level Tertinggi {first.level} · {first.totalCompleted} challenge berhasil
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-400 mt-4">—</p>
              )}
            </div>
          </motion.div>

          {/* Juara 3 — Bronze */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={
              revealStep >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }
            }
            transition={{ duration: 0.4 }}
            className="order-3 rounded-2xl bg-gradient-to-b from-orange-100 via-orange-50 to-white border-2 border-orange-300 p-6 text-center md:min-h-[205px] shadow-lg shadow-orange-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 mb-2">
                <Award className="w-4 h-4 text-orange-500" />
                <span>RANKING 3 · BRONZE</span>
              </div>
              {third ? (
                <>
                  <h2 className="text-xl font-bold font-display text-slate-900 truncate">
                    {third.name}
                    {third.uid === currentUid ? ' (Kamu)' : ''}
                  </h2>
                  <p className="text-3xl font-black font-mono tabular-nums text-orange-600 mt-3">
                    {third.score}
                  </p>
                  <p className="text-xs text-orange-900/75 mt-1 tabular-nums">
                    Level Tertinggi {third.level} · {third.totalCompleted} challenge berhasil
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-400 mt-4">—</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Non-Top-20 personal summary for students who finished 21+ or scored 0 */}
        {!isHost && currentPlayer && !isInTop20 && (
          <div className="rounded-xl bg-white border border-slate-200 px-5 py-4 flex flex-wrap items-center justify-between gap-3 text-sm shadow-xs">
            <div>
              <span className="font-bold text-slate-900">{currentPlayer.name}</span>
              <span className="text-slate-600">
                {' '}
                — Skormu belum masuk jajaran Top 20 pada sesi ini.
              </span>
            </div>
            <div className="font-mono font-semibold tabular-nums text-xs text-sky-700">
              Skor: {currentPlayer.score} · Level {currentPlayer.level} ·{' '}
              {currentPlayer.totalCompleted} challenge
            </div>
          </div>
        )}

        {/* Ranking 4–20 Table */}
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-md shadow-slate-900/5">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <h2 className="text-base font-bold font-display text-slate-900">
              Peringkat 4–20 Leaderboard
            </h2>
            <span className="text-xs font-mono font-semibold tabular-nums text-slate-500">
              {rankedTop20.length} / {MAX_LEADERBOARD_ENTRIES} Masuk Top 20
            </span>
          </div>

          {rankedTop20.length === 0 ? (
            <div className="py-12 px-6 text-center text-sm text-slate-500">
              Belum ada peserta yang mencetak skor pada sesi ini.
            </div>
          ) : rank4To20.length === 0 ? (
            <div className="py-10 px-6 text-center text-sm text-slate-500">
              Seluruh peserta yang masuk Top 20 sudah ditampilkan pada Podium Top 3 di atas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-500">
                    <th className="py-3.5 px-5">Rank</th>
                    <th className="py-3.5 px-5">Nama Pemain</th>
                    <th className="py-3.5 px-5 text-right">Skor</th>
                    <th className="py-3.5 px-5 text-right">Level Tertinggi</th>
                    <th className="py-3.5 px-5 text-right">Challenge Berhasil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {rank4To20.map((entry, idx) => {
                    const rank = idx + 4;
                    const isMe = entry.uid === currentUid;
                    return (
                      <tr
                        key={entry.uid}
                        className={
                          isMe
                            ? 'bg-sky-50 text-sky-900'
                            : 'text-slate-700 hover:bg-slate-50/70'
                        }
                      >
                        <td className="py-3.5 px-5 font-mono font-bold tabular-nums text-slate-500">
                          #{rank}
                        </td>
                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          {entry.name}
                          {isMe ? ' (Kamu)' : ''}
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

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 pb-6">
          {isHost ? (
            confirmPlayAgain ? (
              <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white border border-sky-200 px-5 py-3 shadow-sm">
                <span className="text-sm font-medium text-slate-700">
                  Mulai ronde baru? Skor dan leaderboard Top 20 akan direset dari kosong.
                </span>
                <button
                  type="button"
                  onClick={handleConfirmPlayAgain}
                  disabled={resetting}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors whitespace-nowrap disabled:opacity-60"
                >
                  {resetting ? 'Mereset...' : 'Ya, Mulai Ulang'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmPlayAgain(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold whitespace-nowrap"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmPlayAgain(true)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white font-bold text-sm shadow-md shadow-sky-500/20 transition-all whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                PLAY AGAIN
              </button>
            )
          ) : (
            <div className="px-5 py-3 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-xs">
              Menunggu konfirmasi Host jika ingin memulai sesi ronde berikutnya.
            </div>
          )}

          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm transition-colors whitespace-nowrap shadow-xs"
          >
            <Home className="w-4 h-4" />
            BACK TO HOME
          </button>
        </div>
      </div>
    </div>
  );
}
