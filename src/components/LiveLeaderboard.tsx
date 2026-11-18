import { Heart, Skull, Trophy, Wifi, WifiOff, X } from 'lucide-react';
import type { PlayerData } from '../types/game';
import { getEffectivePlayerStatus } from '../services/playerManager';
import { CHALLENGES_PER_LEVEL, sortLeaderboard } from '../services/scoreManager';

interface LiveLeaderboardProps {
  players: PlayerData[];
  currentUid: string;
  serverNowMs: number;
  variant?: 'panel' | 'drawer';
  onClose?: () => void;
}

export function LiveLeaderboard({
  players,
  currentUid,
  serverNowMs,
  variant = 'panel',
  onClose,
}: LiveLeaderboardProps) {
  const ranked = sortLeaderboard(players);

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-sm font-bold font-display text-white">
              LEADERBOARD LIVE
            </h2>
            <p className="text-[11px] text-slate-400 tabular-nums">
              {ranked.length} peserta aktif dalam room
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup leaderboard"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {ranked.map((p, index) => {
          const rank = index + 1;
          const status = getEffectivePlayerStatus(p, serverNowMs);
          const isMe = p.uid === currentUid;

          return (
            <div
              key={p.uid}
              className={`rounded-xl px-3.5 py-2.5 border flex items-center justify-between gap-3 transition-colors ${
                isMe
                  ? 'bg-cyan-950/45 border-cyan-500/50'
                  : rank === 1
                    ? 'bg-amber-950/25 border-amber-500/35'
                    : 'bg-slate-900/70 border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-6 text-center font-mono font-bold text-xs tabular-nums shrink-0 ${
                    rank === 1
                      ? 'text-amber-300'
                      : rank === 2
                        ? 'text-slate-200'
                        : rank === 3
                          ? 'text-orange-300'
                          : 'text-slate-500'
                  }`}
                >
                  #{rank}
                </span>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {p.name}
                    {isMe ? ' (Kamu)' : ''}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                    <span>Lvl {p.level}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {p.completed}/{CHALLENGES_PER_LEVEL}
                    </span>
                    <span aria-hidden="true">·</span>
                    {status === 'eliminated' ? (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-sans">
                        <Skull className="w-3 h-3" />
                        Eliminated
                      </span>
                    ) : status === 'disconnected' ? (
                      <span className="inline-flex items-center gap-1 text-amber-400 font-sans">
                        <WifiOff className="w-3 h-3" />
                        Terputus
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-sans">
                        <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                        {p.lives}
                        <Wifi className="w-3 h-3 ml-0.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-base font-black font-mono tabular-nums text-amber-300">
                  {p.score}
                </span>
                <span className="block text-[10px] text-slate-500">pts</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (variant === 'drawer') {
    return (
      <div
        className="fixed inset-0 z-40 flex justify-end bg-slate-950/70 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Live Leaderboard"
      >
        <div className="w-full max-w-md h-full bg-[#0B1124] border-l border-slate-800 shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-900/75 backdrop-blur-xl border border-slate-800 h-full overflow-hidden">
      {content}
    </div>
  );
}
