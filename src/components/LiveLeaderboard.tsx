import { Heart, Skull, Trophy, Wifi, WifiOff, X } from 'lucide-react';
import type { LeaderboardEntry, PlayerData } from '../types/game';
import { getEffectivePlayerStatus } from '../services/playerManager';
import {
  CHALLENGES_PER_LEVEL,
  MAX_LEADERBOARD_ENTRIES,
  sortLeaderboard,
} from '../services/scoreManager';

interface LiveLeaderboardProps {
  entries: LeaderboardEntry[];
  players: PlayerData[];
  currentUid: string;
  serverNowMs: number;
  variant?: 'panel' | 'drawer';
  onClose?: () => void;
}

export function LiveLeaderboard({
  entries,
  players,
  currentUid,
  serverNowMs,
  variant = 'panel',
  onClose,
}: LiveLeaderboardProps) {
  const ranked = sortLeaderboard(entries).slice(0, MAX_LEADERBOARD_ENTRIES);
  const playerMap = new Map(players.map((p) => [p.uid, p]));

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-5 h-5 text-amber-500" />
          <div>
            <h2 className="text-sm font-bold font-display text-slate-900">
              LEADERBOARD TOP 20 · LIVE
            </h2>
            <p className="text-[11px] text-slate-500 tabular-nums">
              {ranked.length} / {MAX_LEADERBOARD_ENTRIES} peringkat teratas tersimpan
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup leaderboard"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {ranked.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              Leaderboard masih kosong
            </p>
            <p className="text-xs text-slate-500">
              Pemain yang mulai mencetak skor akan masuk ke daftar Top 20 secara real-time.
            </p>
          </div>
        ) : (
          ranked.map((entry, index) => {
            const rank = index + 1;
            const livePlayer = playerMap.get(entry.uid);
            const status = livePlayer
              ? getEffectivePlayerStatus(livePlayer, serverNowMs)
              : entry.status;
            const isMe = entry.uid === currentUid;

            return (
              <div
                key={entry.uid}
                className={`rounded-xl px-3.5 py-2.5 border flex items-center justify-between gap-3 transition-colors ${
                  isMe
                    ? 'bg-sky-50 border-sky-300'
                    : rank === 1
                      ? 'bg-amber-50 border-amber-200'
                      : rank === 2
                        ? 'bg-slate-100 border-slate-300'
                        : rank === 3
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-7 text-center font-mono font-bold text-xs tabular-nums shrink-0 ${
                      rank === 1
                        ? 'text-amber-600'
                        : rank === 2
                          ? 'text-slate-600'
                          : rank === 3
                            ? 'text-orange-600'
                            : 'text-slate-400'
                    }`}
                  >
                    #{rank}
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {entry.name}
                      {isMe ? ' (Kamu)' : ''}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                      <span>Lvl {entry.level}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {entry.completed}/{CHALLENGES_PER_LEVEL}
                      </span>
                      <span aria-hidden="true">·</span>
                      {status === 'eliminated' ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-sans font-semibold">
                          <Skull className="w-3 h-3" />
                          Eliminated
                        </span>
                      ) : status === 'disconnected' ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-sans font-semibold">
                          <WifiOff className="w-3 h-3" />
                          Terputus
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-sans font-semibold">
                          <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                          {entry.lives}
                          <Wifi className="w-3 h-3 ml-0.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-black font-mono tabular-nums text-amber-600">
                    {entry.score}
                  </span>
                  <span className="block text-[10px] text-slate-500">pts</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  if (variant === 'drawer') {
    return (
      <div
        className="fixed inset-0 z-40 flex justify-end bg-slate-900/35 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Live Top 20 Leaderboard"
      >
        <div className="w-full max-w-md h-full bg-white border-l border-slate-200 shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 h-full overflow-hidden shadow-md shadow-slate-900/5">
      {content}
    </div>
  );
}
