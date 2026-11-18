import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  Home,
  Medal,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { PlayerData, RoomData } from '../types/game';
import { playAgainRoom } from '../services/roomManager';
import { sortLeaderboard } from '../services/scoreManager';
import { soundManager } from '../services/soundManager';

interface FinalResultsProps {
  room: RoomData;
  players: PlayerData[];
  isHost: boolean;
  currentUid: string;
  onBackHome: () => void;
}

export function FinalResults({
  room,
  players,
  isHost,
  currentUid,
  onBackHome,
}: FinalResultsProps) {
  const [revealStep, setRevealStep] = useState(0);
  const [confirmPlayAgain, setConfirmPlayAgain] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [trophyImgError, setTrophyImgError] = useState(false);

  const ranked = sortLeaderboard(players);
  const first = ranked[0] || null;
  const second = ranked[1] || null;
  const third = ranked[2] || null;

  useEffect(() => {
    soundManager.stopMusic();
    soundManager.playWinner();

    const t1 = window.setTimeout(() => setRevealStep(1), 250); // 3rd
    const t2 = window.setTimeout(() => setRevealStep(2), 700); // 2nd
    const t3 = window.setTimeout(() => {
      setRevealStep(3); // 1st
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
    <div className="min-h-screen bg-[#060A17] text-slate-100 arena-grid-bg relative overflow-x-hidden py-10 px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[620px] h-[380px] rounded-full bg-amber-500/15 blur-[140px]"
      />

      <div className="relative z-10 max-w-5xl mx-auto space-y-10">
        {/* Header + Trophy Emblem */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden border border-amber-400/40 bg-slate-900 shadow-2xl shadow-amber-950/50">
            {!trophyImgError ? (
              <img
                src="/src/assets/images/champion_trophy_gold_1795003070102.jpg"
                alt="Piala Juara BLOK, COPY & PASTE"
                referrerPolicy="no-referrer"
                onError={() => setTrophyImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-slate-900">
                <Trophy className="w-11 h-11 text-amber-400" />
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-mono tracking-[0.25em] text-amber-300 uppercase">
              FINAL RESULTS · ROOM {room.roomCode}
            </p>
            <h1 className="text-3xl sm:text-5xl font-black font-display text-white mt-1">
              Podium Juara Arena
            </h1>
          </div>
        </div>

        {/* Podium Juara (2nd · 1st · 3rd) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end pt-2">
          {/* Juara 2 */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={
              revealStep >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }
            }
            transition={{ duration: 0.4 }}
            className="order-2 md:order-1 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-400/40 p-6 text-center md:min-h-[235px] flex flex-col justify-between"
          >
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-2">
                <Medal className="w-4 h-4 text-slate-300" />
                <span>JUARA 2 · SILVER</span>
              </div>
              {second ? (
                <>
                  <h2 className="text-xl font-bold font-display text-white truncate">
                    {second.name}
                  </h2>
                  <p className="text-3xl font-black font-mono tabular-nums text-slate-200 mt-3">
                    {second.score}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 tabular-nums">
                    Level {second.level} · {second.totalCompleted} tantangan
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500 mt-4">—</p>
              )}
            </div>
          </motion.div>

          {/* Juara 1 (Tallest Gold Podium) */}
          <motion.div
            initial={{ opacity: 0, y: 36, scale: 0.94 }}
            animate={
              revealStep >= 3
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: 0, y: 36, scale: 0.94 }
            }
            transition={{ duration: 0.45 }}
            className="order-1 md:order-2 rounded-2xl bg-gradient-to-b from-amber-500/20 via-slate-900/90 to-slate-950/90 backdrop-blur-xl border border-amber-400/60 p-7 text-center md:min-h-[285px] shadow-2xl shadow-amber-950/40 flex flex-col justify-between"
          >
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-300 mb-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>JUARA 1 · GOLD CHAMPION</span>
              </div>
              {first ? (
                <>
                  <h2 className="text-2xl font-black font-display text-white truncate">
                    {first.name}
                  </h2>
                  <p className="text-4xl sm:text-5xl font-black font-mono tabular-nums text-amber-300 mt-4">
                    {first.score}
                  </p>
                  <p className="text-xs text-amber-100/80 mt-2 tabular-nums">
                    Level Tertinggi {first.level} · {first.totalCompleted} tantangan berhasil
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500 mt-4">—</p>
              )}
            </div>
          </motion.div>

          {/* Juara 3 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={
              revealStep >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }
            }
            transition={{ duration: 0.4 }}
            className="order-3 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-orange-500/40 p-6 text-center md:min-h-[205px] flex flex-col justify-between"
          >
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-300 mb-2">
                <Award className="w-4 h-4 text-orange-400" />
                <span>JUARA 3 · BRONZE</span>
              </div>
              {third ? (
                <>
                  <h2 className="text-xl font-bold font-display text-white truncate">
                    {third.name}
                  </h2>
                  <p className="text-3xl font-black font-mono tabular-nums text-orange-200 mt-3">
                    {third.score}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 tabular-nums">
                    Level {third.level} · {third.totalCompleted} tantangan
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500 mt-4">—</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Full Participant Ranking Table (up to 25 students) */}
        <div className="rounded-2xl bg-slate-900/75 backdrop-blur-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-bold font-display text-white">
              Ranking Seluruh Peserta
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              Total {ranked.length} Siswa
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs font-semibold text-slate-400">
                  <th className="py-3.5 px-5">Rank</th>
                  <th className="py-3.5 px-5">Nama Siswa</th>
                  <th className="py-3.5 px-5 text-right">Skor</th>
                  <th className="py-3.5 px-5 text-right">Level</th>
                  <th className="py-3.5 px-5 text-right">Challenge Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {ranked.map((player, idx) => {
                  const rank = idx + 1;
                  const isMe = player.uid === currentUid;
                  const topHighlight =
                    rank === 1
                      ? 'bg-amber-500/10 text-amber-200'
                      : rank === 2
                        ? 'bg-slate-400/10 text-slate-100'
                        : rank === 3
                          ? 'bg-orange-500/10 text-orange-200'
                          : isMe
                            ? 'bg-cyan-950/35 text-cyan-100'
                            : 'text-slate-300';

                  return (
                    <tr key={player.uid} className={topHighlight}>
                      <td className="py-3.5 px-5 font-mono font-bold tabular-nums">
                        #{rank}
                      </td>
                      <td className="py-3.5 px-5 font-semibold">
                        {player.name}
                        {isMe ? ' (Kamu)' : ''}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold tabular-nums text-amber-300">
                        {player.score}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono tabular-nums">
                        {player.level}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono tabular-nums">
                        {player.totalCompleted}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 pb-6">
          {isHost ? (
            confirmPlayAgain ? (
              <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-900 border border-cyan-500/40 px-5 py-3">
                <span className="text-sm text-slate-200">
                  Mulai ronde baru dengan reset skor semua siswa?
                </span>
                <button
                  type="button"
                  onClick={handleConfirmPlayAgain}
                  disabled={resetting}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors whitespace-nowrap disabled:opacity-60"
                >
                  {resetting ? 'Mereset...' : 'Ya, Mulai Ulang'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmPlayAgain(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium whitespace-nowrap"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmPlayAgain(true)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white font-bold text-sm shadow-lg transition-all whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                PLAY AGAIN
              </button>
            )
          ) : (
            <div className="px-5 py-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              Menunggu konfirmasi Host jika ingin melanjutkan ke ronde berikutnya.
            </div>
          )}

          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-colors whitespace-nowrap"
          >
            <Home className="w-4 h-4" />
            BACK TO HOME
          </button>
        </div>
      </div>
    </div>
  );
}
