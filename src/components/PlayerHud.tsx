import {
  Heart,
  Trophy,
  Volume2,
  VolumeX,
  Wifi,
  Clock,
  Layers,
} from 'lucide-react';
import type { PlayerData } from '../types/game';
import { CHALLENGES_PER_LEVEL } from '../services/scoreManager';

interface PlayerHudProps {
  player: PlayerData;
  elapsedSeconds: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenLeaderboard: () => void;
  playerRank: number;
  totalPlayers: number;
}

export function formatTimeMMSS(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function PlayerHud({
  player,
  elapsedSeconds,
  isMuted,
  onToggleMute,
  onOpenLeaderboard,
  playerRank,
  totalPlayers,
}: PlayerHudProps) {
  const progressPct = Math.min(
    100,
    Math.round((player.completed / CHALLENGES_PER_LEVEL) * 100)
  );

  return (
    <header className="relative z-20 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/90 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Player Identity + Level + Lives */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold font-display text-xs text-slate-950 shrink-0"
              style={{ backgroundColor: player.avatarColor }}
            >
              {player.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate max-w-[140px] sm:max-w-[180px]">
                {player.name}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <Wifi className="w-3 h-3 shrink-0" />
                <span>Terhubung</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-cyan-300 tabular-nums">
            <Layers className="w-3.5 h-3.5" />
            <span>Level {player.level}</span>
          </div>

          {/* 5 Lives */}
          <div
            className="flex items-center gap-1"
            aria-label={`Nyawa tersisa: ${player.lives} dari 5`}
          >
            {Array.from({ length: 5 }).map((_, idx) => {
              const alive = idx < player.lives;
              return (
                <Heart
                  key={idx}
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                    alive
                      ? 'text-rose-500 fill-rose-500 scale-100'
                      : 'text-slate-700 fill-slate-800/50 scale-90'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Center: Progress 0/15 + Bar */}
        <div className="flex-1 min-w-[170px] max-w-xs mx-auto sm:mx-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 font-medium">
              Level {player.level} · Tantangan
            </span>
            <span className="font-mono font-bold tabular-nums text-cyan-300">
              {player.completed}/{CHALLENGES_PER_LEVEL}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Right: Score + Timer + Leaderboard + Sound */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="text-right px-3 py-1 rounded-lg bg-slate-900 border border-amber-500/30">
            <span className="block text-[10px] text-amber-300/80 font-medium uppercase">
              Skor
            </span>
            <span className="text-base sm:text-lg font-black font-mono tabular-nums text-amber-300 leading-none">
              {player.score}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono tabular-nums text-slate-200">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{formatTimeMMSS(elapsedSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition-colors whitespace-nowrap"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Leaderboard</span>
            <span className="font-mono tabular-nums text-cyan-300">
              #{playerRank}/{totalPlayers}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Nyalakan suara' : 'Matikan suara'}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
