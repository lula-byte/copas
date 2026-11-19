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
    <div className="min-h-screen bg-[#F5F9FF] text-slate-900 arena-grid-bg relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[620px] h-[340px] rounded-full bg-sky-200/50 blur-[110px]"
      />

      {/* Synchronized Countdown Overlay */}
      <AnimatePresence>
        {room.status === 'countdown' && countdownLabel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <p className="text-sm font-bold tracking-[0.25em] text-sky-600 mb-6 uppercase">
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
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-500'
                  : 'text-slate-900'
              }`}
            >
              {countdownLabel}
            </motion.div>
            <p className="text-sm font-medium text-slate-600 mt-6">
              Siapkan mouse dan keyboardmu (Ctrl+C &amp; Ctrl+V)
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Waiting Room Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Firebase Realtime Terhubung</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-slate-600">Host: {room.hostName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 mt-1">
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
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-700 text-sm font-semibold transition-colors whitespace-nowrap disabled:opacity-50 shadow-xs"
                >
                  <XCircle className="w-4 h-4" />
                  CLOSE ROOM
                </button>
                <button
                  type="button"
                  onClick={handleStartGame}
                  disabled={players.length < 1 || actionBusy}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-600 hover:brightness-105 text-white text-sm font-bold shadow-md shadow-emerald-500/20 transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
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
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold transition-colors whitespace-nowrap shadow-xs"
              >
                <DoorOpen className="w-4 h-4" />
                Keluar Room
              </button>
            )}
          </div>
        </div>

        {/* Projector Room Code Banner + Player Counter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8 rounded-2xl bg-white border border-sky-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md shadow-sky-900/5">
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold tracking-widest text-sky-600 uppercase">
                KODE ROOM KELAS
              </p>
              <div className="text-5xl sm:text-6xl font-black font-mono tracking-[0.22em] text-slate-900 mt-2 select-all">
                {room.roomCode}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Bagikan kode ini ke siswa untuk bergabung ke arena
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-sm font-bold transition-all whitespace-nowrap shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Kode Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-sky-600" />
                  <span>COPY ROOM CODE</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 flex flex-col justify-center shadow-md shadow-slate-900/5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Users className="w-4 h-4 text-amber-500" />
              <span>PLAYER CONNECTED</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-5xl font-black font-mono tabular-nums text-slate-900">
                {players.length}
              </span>
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-400">
                / {room.maxPlayers}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 tabular-nums">
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
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md shadow-slate-900/5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold font-display text-slate-900">
              Daftar Peserta Room
            </h2>
            <span className="text-xs text-slate-500">
              Update otomatis secara real-time
            </span>
          </div>

          {players.length === 0 ? (
            <div className="py-16 text-center space-y-3 border border-dashed border-slate-200 rounded-xl bg-slate-50/60">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-slate-700 font-semibold text-sm">
                Belum ada siswa yang masuk ke room ini.
              </p>
              <p className="text-slate-500 text-xs">
                Siswa dapat membuka menu JOIN GAME dan memasukkan kode{' '}
                <span className="font-mono font-bold text-sky-700">{room.roomCode}</span>.
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
                          ? 'bg-sky-50 border-sky-300 shadow-xs'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold font-display text-sm text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: player.avatarColor }}
                      >
                        {getPlayerInitials(player.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {player.name}
                          {isMe ? ' (Kamu)' : ''}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium mt-0.5">
                          {effStatus === 'connected' ? (
                            <>
                              <Wifi className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="text-emerald-700">Terhubung</span>
                            </>
                          ) : (
                            <>
                              <WifiOff className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="text-amber-700">Terputus</span>
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
