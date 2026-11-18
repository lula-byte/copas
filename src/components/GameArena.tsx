import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertOctagon,
  Clock,
  Crown,
  OctagonX,
  Skull,
  Sparkles,
  Trophy,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { ActiveChallengeCard, PlayerData, RoomData } from '../types/game';
import {
  generateChallengeForIndex,
  getLevelSpeedAndInterval,
} from '../data/challenges';
import { endGame } from '../services/roomManager';
import {
  CHALLENGES_PER_LEVEL,
  recordCardMissed,
  recordChallengeSuccess,
  sortLeaderboard,
} from '../services/scoreManager';
import { getEffectivePlayerStatus } from '../services/playerManager';
import { soundManager } from '../services/soundManager';
import { ChallengeCard } from './ChallengeCard';
import { LiveLeaderboard } from './LiveLeaderboard';
import { formatTimeMMSS, PlayerHud } from './PlayerHud';

interface GameArenaProps {
  room: RoomData;
  players: PlayerData[];
  isHost: boolean;
  currentUid: string;
  serverClockOffsetMs: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export function GameArena({
  room,
  players,
  isHost,
  currentUid,
  serverClockOffsetMs,
  isMuted,
  onToggleMute,
}: GameArenaProps) {
  const [cards, setCards] = useState<ActiveChallengeCard[]>([]);
  const [pausedMap, setPausedMap] = useState<Record<string, boolean>>({});
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [levelUpBanner, setLevelUpBanner] = useState<number | null>(null);
  const [floatingPoints, setFloatingPoints] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [endingGame, setEndingGame] = useState(false);

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const cardIndexRef = useRef(0);
  const lastSpawnAtRef = useRef(0);
  const pausedMapRef = useRef<Record<string, boolean>>({});
  const missedLockRef = useRef<Set<string>>(new Set());
  const levelFreezeUntilRef = useRef(0);

  const currentPlayer = players.find((p) => p.uid === currentUid) || null;
  const isEliminated = Boolean(
    currentPlayer &&
      (currentPlayer.status === 'eliminated' || currentPlayer.lives <= 0)
  );

  // Sync pausedMap ref for RAF loop
  useEffect(() => {
    pausedMapRef.current = pausedMap;
  }, [pausedMap]);

  // Play game start chime & start ambient music on arena mount
  useEffect(() => {
    soundManager.playGameStart();
    if (!isMuted) {
      soundManager.startMusic();
    }
    return () => {
      soundManager.stopMusic();
    };
  }, [isMuted]);

  // Synchronized clock tick every 500ms for shared timer
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);

  const serverNowMs = nowTick + serverClockOffsetMs;
  const elapsedSeconds = room.startTime
    ? Math.max(0, Math.floor((serverNowMs - room.startTime) / 1000))
    : 0;

  // Reset card pool when roundNumber changes
  useEffect(() => {
    setCards([]);
    cardIndexRef.current = 0;
    lastSpawnAtRef.current = 0;
    missedLockRef.current.clear();
  }, [room.roundNumber]);

  const spawnNextCard = useCallback(
    (level: number) => {
      const arenaWidth = arenaRef.current?.clientWidth || 1000;
      const idx = cardIndexRef.current++;
      const tpl = generateChallengeForIndex(room.challengeSeed, level, idx);

      const desiredWidth =
        tpl.type === 'BLOK_PARAGRAF'
          ? Math.min(440, Math.max(290, arenaWidth - 32))
          : Math.min(380, Math.max(270, arenaWidth - 32));

      const maxLeftPercent = Math.max(
        4,
        Math.min(68, ((arenaWidth - desiredWidth - 20) / arenaWidth) * 100)
      );
      // Spread lanes deterministically so cards don't overlap identically
      const laneSlots = [4, 32, 58, 18, 46];
      const basePercent = laneSlots[idx % laneSlots.length];
      const xPercent = Math.min(basePercent, maxLeftPercent);

      const { speedPxPerSec } = getLevelSpeedAndInterval(level);

      const newCard: ActiveChallengeCard = {
        ...tpl,
        id: `${room.roundNumber}-${level}-${idx}-${Date.now()}`,
        index: idx,
        xPercent,
        yPx: -10,
        speedPxPerSec,
        widthPx: desiredWidth,
      };

      setCards((prev) => [...prev, newCard]);
    },
    [room.challengeSeed, room.roundNumber]
  );

  // Main 60fps Falling Card Loop (Students only, while active & not eliminated)
  useEffect(() => {
    if (isHost || !currentPlayer || isEliminated || room.status !== 'playing') {
      return;
    }

    let rafId = 0;
    let lastFrameTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.08, (now - lastFrameTime) / 1000);
      lastFrameTime = now;

      const nowEpoch = Date.now();
      const level = currentPlayer.level;
      const { spawnIntervalMs, maxActiveCards } = getLevelSpeedAndInterval(level);
      const arenaHeight = arenaRef.current?.clientHeight || 560;
      const missThresholdY = Math.max(240, arenaHeight - 135);

      if (nowEpoch >= levelFreezeUntilRef.current) {
        // Spawn check
        setCards((prevCards) => {
          const timeSinceSpawn = nowEpoch - lastSpawnAtRef.current;
          let nextCards = prevCards;

          if (
            prevCards.length < maxActiveCards &&
            (prevCards.length === 0 || timeSinceSpawn >= spawnIntervalMs)
          ) {
            lastSpawnAtRef.current = nowEpoch;
            const arenaWidth = arenaRef.current?.clientWidth || 1000;
            const idx = cardIndexRef.current++;
            const tpl = generateChallengeForIndex(room.challengeSeed, level, idx);
            const desiredWidth =
              tpl.type === 'BLOK_PARAGRAF'
                ? Math.min(440, Math.max(290, arenaWidth - 32))
                : Math.min(380, Math.max(270, arenaWidth - 32));
            const maxLeftPercent = Math.max(
              4,
              Math.min(68, ((arenaWidth - desiredWidth - 20) / arenaWidth) * 100)
            );
            const laneSlots = [4, 34, 60, 16, 46];
            const xPercent = Math.min(
              laneSlots[idx % laneSlots.length],
              maxLeftPercent
            );
            const { speedPxPerSec } = getLevelSpeedAndInterval(level);

            nextCards = [
              ...prevCards,
              {
                ...tpl,
                id: `${room.roundNumber}-${level}-${idx}-${nowEpoch}`,
                index: idx,
                xPercent,
                yPx: 12,
                speedPxPerSec,
                widthPx: desiredWidth,
              },
            ];
          }

          const surviving: ActiveChallengeCard[] = [];
          const missedIds: string[] = [];

          for (const card of nextCards) {
            if (pausedMapRef.current[card.id]) {
              surviving.push(card);
              continue;
            }
            const nextY = card.yPx + card.speedPxPerSec * dt;
            if (nextY >= missThresholdY) {
              missedIds.push(card.id);
            } else {
              surviving.push({ ...card, yPx: nextY });
            }
          }

          if (missedIds.length > 0) {
            missedIds.forEach((id) => {
              if (!missedLockRef.current.has(id)) {
                missedLockRef.current.add(id);
                soundManager.playMissed();
                recordCardMissed(room.roomCode, currentUid).catch(() => {});
              }
            });
          }

          return surviving;
        });
      }

      rafId = window.requestAnimationFrame(loop);
    };

    // Spawn first card promptly
    if (lastSpawnAtRef.current === 0) {
      lastSpawnAtRef.current = Date.now();
      spawnNextCard(currentPlayer.level);
    }

    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, [
    isHost,
    currentPlayer?.level,
    currentPlayer?.uid,
    isEliminated,
    room.status,
    room.challengeSeed,
    room.roundNumber,
    room.roomCode,
    currentUid,
    spawnNextCard,
  ]);

  const handlePauseChange = useCallback((cardId: string, paused: boolean) => {
    setPausedMap((prev) => {
      if (Boolean(prev[cardId]) === paused) return prev;
      return { ...prev, [cardId]: paused };
    });
  }, []);

  const handleCardSuccess = useCallback(
    async (cardId: string) => {
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      setPausedMap((prev) => {
        const copy = { ...prev };
        delete copy[cardId];
        return copy;
      });
      soundManager.playCorrect();

      const res = await recordChallengeSuccess(room.roomCode, currentUid);
      if (res.pointsEarned > 0) {
        setFloatingPoints(`+${res.pointsEarned}`);
        window.setTimeout(() => setFloatingPoints(null), 1100);
      }
      if (res.leveledUp) {
        soundManager.playLevelUp();
        setCards([]);
        levelFreezeUntilRef.current = Date.now() + 2100;
        lastSpawnAtRef.current = Date.now() + 2100;
        setLevelUpBanner(res.nextLevel);
        window.setTimeout(() => setLevelUpBanner(null), 2200);
      }
    },
    [room.roomCode, currentUid]
  );

  const handleWrongAttempt = useCallback(() => {
    soundManager.playWrong();
  }, []);

  const handleEndGame = async () => {
    if (!isHost || endingGame) return;
    setEndingGame(true);
    try {
      await endGame(room.roomCode);
    } finally {
      setEndingGame(false);
    }
  };

  const rankedPlayers = sortLeaderboard(players);
  const myRank = Math.max(
    1,
    rankedPlayers.findIndex((p) => p.uid === currentUid) + 1
  );

  // ==========================
  // HOST PROJECTOR CONTROL VIEW
  // ==========================
  if (isHost) {
    const activeCount = players.filter(
      (p) => getEffectivePlayerStatus(p, serverNowMs) === 'connected'
    ).length;
    const eliminatedCount = players.filter(
      (p) => getEffectivePlayerStatus(p, serverNowMs) === 'eliminated'
    ).length;

    return (
      <div className="min-h-screen bg-[#060A17] text-slate-100 arena-grid-bg flex flex-col">
        <header className="bg-slate-950/90 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-violet-300">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>HOST CONTROL ARENA · ROOM {room.roomCode}</span>
                </div>
                <h1 className="text-xl font-bold font-display text-white mt-0.5">
                  Pemantauan Pertandingan Kelas
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 font-mono text-base font-bold tabular-nums text-cyan-300">
                <Clock className="w-4 h-4" />
                <span>{formatTimeMMSS(elapsedSeconds)}</span>
              </div>

              <button
                type="button"
                onClick={onToggleMute}
                aria-label={isMuted ? 'Nyalakan suara' : 'Matikan suara'}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                )}
              </button>

              <button
                type="button"
                onClick={handleEndGame}
                disabled={endingGame}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 hover:brightness-110 text-white font-bold text-sm shadow-lg transition-all whitespace-nowrap disabled:opacity-60"
              >
                <OctagonX className="w-4 h-4" />
                {endingGame ? 'Mengakhiri...' : 'END GAME'}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Class Summary Strip */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl bg-slate-900/75 backdrop-blur-xl border border-slate-800 p-6 space-y-5">
              <h2 className="text-base font-bold font-display text-white">
                Status Kelas Real-Time
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    Peserta Aktif
                  </span>
                  <p className="text-3xl font-black font-mono tabular-nums text-white mt-1">
                    {activeCount}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Skull className="w-3.5 h-3.5 text-rose-400" />
                    Eliminated
                  </span>
                  <p className="text-3xl font-black font-mono tabular-nums text-rose-300 mt-1">
                    {eliminatedCount}
                  </p>
                </div>
              </div>

              {rankedPlayers[0] && (
                <div className="rounded-xl bg-gradient-to-br from-amber-500/15 to-slate-950 border border-amber-500/35 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                    <Trophy className="w-4 h-4" />
                    <span>PEMIMPIN SEMENTARA</span>
                  </div>
                  <p className="text-xl font-bold font-display text-white mt-1 truncate">
                    {rankedPlayers[0].name}
                  </p>
                  <p className="text-sm font-mono tabular-nums text-amber-300 mt-0.5">
                    {rankedPlayers[0].score} poin · Level {rankedPlayers[0].level}
                  </p>
                </div>
              )}

              <p className="text-xs text-slate-400 leading-relaxed">
                Seluruh siswa mendapatkan urutan tantangan yang identik. Tekan{' '}
                <strong className="text-white">END GAME</strong> kapan saja untuk menghentikan sesi dan menampilkan podium juara.
              </p>
            </div>
          </div>

          {/* Projector Live Leaderboard */}
          <div className="lg:col-span-8 min-h-[480px]">
            <LiveLeaderboard
              players={players}
              currentUid={currentUid}
              serverNowMs={serverNowMs}
              variant="panel"
            />
          </div>
        </main>
      </div>
    );
  }

  // ==========================
  // STUDENT ACTIVE GAME ARENA
  // ==========================
  return (
    <div className="h-screen bg-[#060A17] text-slate-100 arena-grid-bg flex flex-col overflow-hidden relative">
      {currentPlayer && (
        <PlayerHud
          player={currentPlayer}
          elapsedSeconds={elapsedSeconds}
          isMuted={isMuted}
          onToggleMute={onToggleMute}
          onOpenLeaderboard={() => setLeaderboardOpen(true)}
          playerRank={myRank}
          totalPlayers={players.length}
        />
      )}

      {/* Main Falling Card Arena */}
      <div
        ref={arenaRef}
        className="relative flex-1 w-full max-w-7xl mx-auto overflow-hidden"
      >
        {/* Subtle Danger Floor Zone */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-rose-950/35 via-rose-950/10 to-transparent border-b-2 border-rose-500/30"
        >
          <div className="max-w-7xl mx-auto h-full flex items-end justify-center pb-2.5">
            <span className="text-[11px] font-mono tracking-wider text-rose-300/70 uppercase">
              Batas Arena — Jangan Sampai Kartu Melewati Garis Ini
            </span>
          </div>
        </div>

        {/* Floating Points Pop */}
        <AnimatePresence>
          {floatingPoints && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: -12, scale: 1 }}
              exit={{ opacity: 0, y: -24 }}
              className="pointer-events-none absolute top-6 right-8 z-30 text-2xl font-black font-mono tabular-nums text-amber-300 drop-shadow"
            >
              {floatingPoints}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level Up Celebration Overlay */}
        <AnimatePresence>
          {levelUpBanner !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm"
            >
              <div className="rounded-2xl bg-gradient-to-br from-blue-950/95 via-slate-900/95 to-violet-950/95 border border-amber-400/50 px-10 py-8 text-center shadow-2xl">
                <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <p className="text-xs font-mono tracking-[0.25em] text-cyan-300 uppercase">
                  15/15 Tantangan Selesai
                </p>
                <h2 className="text-4xl font-black font-display text-white mt-1">
                  LEVEL {levelUpBanner}!
                </h2>
                <p className="text-sm text-emerald-300 mt-2 font-medium">
                  5 Nyawa dipulihkan · Skor per kartu kini {levelUpBanner * 10} poin!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Eliminated Spectator Overlay */}
        {isEliminated && currentPlayer ? (
          <div className="relative z-20 h-full flex items-center justify-center p-6">
            <div className="max-w-3xl w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              <div className="md:col-span-5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-rose-500/40 p-6 flex flex-col justify-between text-center">
                <div className="space-y-3">
                  <AlertOctagon className="w-12 h-12 text-rose-400 mx-auto" />
                  <h2 className="text-2xl font-black font-display text-white">
                    ELIMINATED
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Nyawamu sudah habis. Skormu tetap tersimpan aman sambil menunggu Host mengakhiri permainan.
                  </p>
                </div>

                <div className="my-6 py-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Skor Akhir Kamu</span>
                  <p className="text-4xl font-black font-mono tabular-nums text-amber-300">
                    {currentPlayer.score}
                  </p>
                  <p className="text-xs text-slate-400 tabular-nums">
                    Level {currentPlayer.level} · {currentPlayer.totalCompleted} tantangan
                  </p>
                </div>

                <p className="text-[11px] text-slate-400">
                  Posisi sementara: <strong className="text-cyan-300">#{myRank}</strong> dari {players.length} siswa
                </p>
              </div>

              <div className="md:col-span-7 min-h-[340px] max-h-[420px]">
                <LiveLeaderboard
                  players={players}
                  currentUid={currentUid}
                  serverNowMs={serverNowMs}
                  variant="panel"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Active Falling Challenge Cards */
          cards.map((card) => (
            <ChallengeCard
              key={card.id}
              card={card}
              isPaused={Boolean(pausedMap[card.id])}
              onPauseChange={handlePauseChange}
              onSuccess={handleCardSuccess}
              onWrongAttempt={handleWrongAttempt}
            />
          ))
        )}
      </div>

      {/* Slide-Over Live Leaderboard Drawer */}
      {leaderboardOpen && (
        <LiveLeaderboard
          players={players}
          currentUid={currentUid}
          serverNowMs={serverNowMs}
          variant="drawer"
          onClose={() => setLeaderboardOpen(false)}
        />
      )}
    </div>
  );
}
