import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  DoorOpen,
  Play,
  Users,
  Wifi,
  WifiOff,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { PlayerData, RoomData } from '../types/game';
import {
  getEffectivePlayerStatus,
  getPlayerInitials,
} from '../services/playerManager';
import {
  activatePlayingState,
  closeRoom,
  leaveWaitingRoom,
  startGameCountdown,
} from '../services/roomManager';
import { soundManager } from '../services/soundManager';

interface WaitingRoomProps {
  room: RoomData;
  players: PlayerData[];
  isHost: boolean;
  currentUid: string;
  serverClockOffsetMs: number;
  onExitRoom: () => void;
}

export function WaitingRoom({
  room,
  players,
  isHost,
  currentUid,
  serverClockOffsetMs,
  onExitRoom,
}: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [countdownLabel, setCountdownLabel] = useState<string | null>(null);
  const lastSpokenStepRef = useRef<string | null>(null);
  const hostTransitionedRef = useRef(false);

  // Live clock tick for player presence evaluation and synchronized countdown
  useEffect(() => {
    const interval = window.setInterval(
      () => setNowTick(Date.now()),
      room.status === 'countdown' ? 80 : 3000
    );
    return () => window.clearInterval(interval);
  }, [room.status]);

  // Synchronized 3 -> 2 -> 1 -> GO! countdown across all devices
  useEffect(() => {
    if (room.status !== 'countdown') {
      setCountdownLabel(null);
      lastSpokenStepRef.current = null;
      hostTransitionedRef.current = false;
      return;
    }

    const serverNow = nowTick + serverClockOffsetMs;
    const baseTime = room.countdownStartedAt ?? serverNow;
    const elapsed = Math.max(0, serverNow - baseTime);

    let step = '3';
    if (elapsed >= 3000) {
      step = 'GO!';
    } else if (elapsed >= 2000) {
      step = '1';
    } else if (elapsed >= 1000) {
      step = '2';
    }

    setCountdownLabel(step);

    if (lastSpokenStepRef.current !== step) {
      lastSpokenStepRef.current = step;
      if (step === 'GO!') {
        soundManager.playCountdown(true);
      } else {
        soundManager.playCountdown(false);
      }
    }

    if (isHost && elapsed >= 3800 && !hostTransitionedRef.current) {
      hostTransitionedRef.current = true;
      activatePlayingState(room.roomCode).catch(() => {
        hostTransitionedRef.current = false;
      });
    }
  }, [
    room.status,
    room.countdownStartedAt,
    room.roomCode,
    nowTick,
    serverClockOffsetMs,
    isHost,
  ]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API fallback ignored
    }
  };

  const handleStartGame = async () => {
    if (!isHost || players.length < 1 || actionBusy) return;
    setActionBusy(true);
    try {
      await startGameCountdown(room.roomCode);
    } finally {
      setActionBusy(false);
    }
  };

  const handleCloseRoom = async () => {
    if (!isHost || actionBusy) return;
    setActionBusy(true);
    try {
      await closeRoom(room.roomCode, players);
      onExitRoom();
    } finally {
      setActionBusy(false);
    }
  };

  const handleLeaveStudent = async () => {
    if (isHost || actionBusy) return;
    setActionBusy(true);
    try {
      await leaveWaitingRoom(room.roomCode);
      onExitRoom();
    } finally {
      setActionBusy(false);
    }
  };

  const serverNowMs = nowTick + serverClockOffsetMs;
  const connectedCount = players.filter(
    (p) => getEffectivePlayerStatus(p, serverNowMs) === 'connected'
  ).length;

  return (
    <div className="min-h-screen bg-[#060A17] text-slate-100 arena-grid-bg relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-[360px] rounded-full bg-blue-600/15 blur-[130px]"
      />

      {/* Synchronized Countdown Overlay */}
      <AnimatePresence>
        {room.status === 'countdown' && countdownLabel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#050814]/90 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <p className="text-sm font-semibold tracking-[0.25em] text-cyan-300 mb-6 uppercase">
              Arena Dimulai Dalam
            </p>
            <motion.div
              key={countdownLabel}
              initial={{ scale: 0.65, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.25, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={`text-8xl sm:text-9xl font-black font-display tracking-tight tabular-nums ${
                countdownLabel === 'GO!'
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-cyan-300 to-blue-400'
                  : 'text-white'
              }`}
            >
              {countdownLabel}
            </motion.div>
            <p className="text-sm text-slate-400 mt-6">
              Siapkan mouse dan keyboardmu (Ctrl+C &amp; Ctrl+V)
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Waiting Room Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Firebase Realtime Terhubung</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-300">Host: {room.hostName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white mt-1">
              WAITING FOR PLAYERS
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {isHost ? (
              <>
                <button
                  type="button"
                  onClick={handleCloseRoom}
                  disabled={actionBusy}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-500/50 text-slate-200 hover:text-rose-200 text-sm font-semibold transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  CLOSE ROOM
                </button>
                <button
                  type="button"
                  onClick={handleStartGame}
                  disabled={players.length < 1 || actionBusy}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 hover:brightness-110 text-white text-sm font-bold shadow-lg shadow-cyan-950/50 transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4 fill-current" />
                  START GAME
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleLeaveStudent}
                disabled={actionBusy}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium transition-colors whitespace-nowrap"
              >
                <DoorOpen className="w-4 h-4" />
                Keluar Room
              </button>
            )}
          </div>
        </div>

        {/* Projector Room Code Banner + Player Counter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8 rounded-2xl bg-slate-900/75 backdrop-blur-xl border border-cyan-500/30 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="text-center sm:text-left">
              <p className="text-xs font-semibold tracking-widest text-cyan-300 uppercase">
                KODE ROOM KELAS
              </p>
              <div className="text-5xl sm:text-6xl font-black font-mono tracking-[0.22em] text-white mt-2 select-all">
                {room.roomCode}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Bagikan kode ini ke siswa untuk bergabung ke arena
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600/70 text-white text-sm font-semibold transition-all whitespace-nowrap shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Kode Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-cyan-400" />
                  <span>COPY ROOM CODE</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-4 rounded-2xl bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 p-6 sm:p-8 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Users className="w-4 h-4 text-amber-400" />
              <span>PLAYER CONNECTED</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-5xl font-black font-mono tabular-nums text-white">
                {players.length}
              </span>
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-500">
                / {room.maxPlayers}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 tabular-nums">
              {connectedCount} perangkat aktif ·{' '}
              {isHost
                ? players.length === 0
                  ? 'Menunggu minimal 1 siswa bergabung'
                  : 'Siap menekan START GAME'
                : 'Menunggu Host memulai permainan'}
            </p>
          </div>
        </div>

        {/* Realtime Student Grid */}
        <div className="rounded-2xl bg-slate-900/65 backdrop-blur-xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold font-display text-white">
              Daftar Peserta Room
            </h2>
            <span className="text-xs text-slate-400">
              Update otomatis secara real-time
            </span>
          </div>

          {players.length === 0 ? (
            <div className="py-16 text-center space-y-3 border border-dashed border-slate-800 rounded-xl">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-medium text-sm">
                Belum ada siswa yang masuk ke room ini.
              </p>
              <p className="text-slate-500 text-xs">
                Siswa dapat membuka menu JOIN GAME dan memasukkan kode{' '}
                <span className="font-mono text-cyan-300">{room.roomCode}</span>.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              <AnimatePresence>
                {players.map((player) => {
                  const effStatus = getEffectivePlayerStatus(player, serverNowMs);
                  const isMe = player.uid === currentUid;
                  return (
                    <motion.div
                      key={player.uid}
                      layout
                      initial={{ opacity: 0, scale: 0.88, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.2 }}
                      className={`rounded-xl p-3.5 border flex items-center gap-3 transition-colors ${
                        isMe
                          ? 'bg-cyan-950/40 border-cyan-500/50'
                          : 'bg-slate-950/70 border-slate-800'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold font-display text-sm text-slate-950 shrink-0 shadow-inner"
                        style={{ backgroundColor: player.avatarColor }}
                      >
                        {getPlayerInitials(player.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">
                          {player.name}
                          {isMe ? ' (Kamu)' : ''}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                          {effStatus === 'connected' ? (
                            <>
                              <Wifi className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="text-emerald-300">Terhubung</span>
                            </>
                          ) : (
                            <>
                              <WifiOff className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="text-amber-300">Terputus</span>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
