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
import type {
  ActiveChallengeCard,
  LeaderboardEntry,
  PlayerData,
  RoomData,
} from '../types/game';
import {
  generateChallengeForIndex,
  getLevelSpeedAndInterval,
} from '../data/challenges';
import { endGame } from '../services/roomManager';
import {
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
  leaderboard: LeaderboardEntry[];
  isHost: boolean;
  currentUid: string;
  serverClockOffsetMs: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export function GameArena({
  room,
  players,
  leaderboard,
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

  useEffect(() => {
    pausedMapRef.current = pausedMap;
  }, [pausedMap]);

  useEffect(() => {
    soundManager.playGameStart();
    if (!isMuted) {
      soundManager.startMusic();
    }
    return () => {
      soundManager.stopMusic();
    };
  }, [isMuted]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);

  const serverNowMs = nowTick + serverClockOffsetMs;
  const elapsedSeconds = room.startTime
    ? Math.max(0, Math.floor((serverNowMs - room.startTime) / 1000))
    : 0;

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

  const rankedTop20 = sortLeaderboard(leaderboard);
  const myIndexInTop20 = rankedTop20.findIndex((e) => e.uid === currentUid);
  const myRankInTop20 = myIndexInTop20 >= 0 ? myIndexInTop20 + 1 : null;

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
      <div className="min-h-screen bg-[#F5F9FF] text-slate-900 arena-grid-bg flex flex-col">
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-violet-700">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>HOST CONTROL ARENA · ROOM {room.roomCode}</span>
              </div>
              <h1 className="text-xl font-bold font-display text-slate-900 mt-0.5">
                Pemantauan Pertandingan Kelas (Top 20)
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-50 border border-sky-200 font-mono text-base font-bold tabular-nums text-sky-700">
                <Clock className="w-4 h-4 text-sky-600" />
                <span>{formatTimeMMSS(elapsedSeconds)}</span>
              </div>

              <button
                type="button"
                onClick={onToggleMute}
                aria-label={isMuted ? 'Nyalakan suara' : 'Matikan suara'}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-sky-600" />
                )}
              </button>

              <button
                type="button"
                onClick={handleEndGame}
                disabled={endingGame}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:brightness-105 text-white font-bold text-sm shadow-md shadow-rose-500/20 transition-all whitespace-nowrap disabled:opacity-60"
              >
                <OctagonX className="w-4 h-4" />
                {endingGame ? 'Mengakhiri...' : 'END GAME'}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-5 shadow-md shadow-slate-900/5">
              <h2 className="text-base font-bold font-display text-slate-900">
                Status Kelas Real-Time
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-4">
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    Peserta Aktif
                  </span>
                  <p className="text-3xl font-black font-mono tabular-nums text-slate-900 mt-1">
                    {activeCount}
                  </p>
                </div>
                <div className="rounded-xl bg-rose-50/70 border border-rose-200 p-4">
                  <span className="text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                    <Skull className="w-3.5 h-3.5 text-rose-500" />
                    Eliminated
                  </span>
                  <p className="text-3xl font-black font-mono tabular-nums text-rose-600 mt-1">
                    {eliminatedCount}
                  </p>
                </div>
              </div>

              {rankedTop20[0] && (
                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>PEMIMPIN SEMENTARA</span>
                  </div>
                  <p className="text-xl font-bold font-display text-slate-900 mt-1 truncate">
                    {rankedTop20[0].name}
                  </p>
                  <p className="text-sm font-mono font-semibold tabular-nums text-amber-700 mt-0.5">
                    {rankedTop20[0].score} poin · Level {rankedTop20[0].level}
                  </p>
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed">
                Database leaderboard hanya menyimpan maksimal <strong className="text-slate-900">20 pemain skor tertinggi</strong> per sesi. Tekan <strong className="text-slate-900">END GAME</strong> untuk mengakhiri sesi.
              </p>
            </div>
          </div>

          <div className="lg:col-span-8 min-h-[480px]">
            <LiveLeaderboard
              entries={rankedTop20}
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
    <div className="h-screen bg-[#F5F9FF] text-slate-900 arena-grid-bg flex flex-col overflow-hidden relative">
      {currentPlayer && (
        <PlayerHud
          player={currentPlayer}
          elapsedSeconds={elapsedSeconds}
          isMuted={isMuted}
          onToggleMute={onToggleMute}
          onOpenLeaderboard={() => setLeaderboardOpen(true)}
          playerRankInTop20={myRankInTop20}
          top20Count={rankedTop20.length}
        />
      )}

      <div
        ref={arenaRef}
        className="relative flex-1 w-full max-w-7xl mx-auto overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-rose-200/70 via-rose-100/25 to-transparent border-b-4 border-rose-400"
        >
          <div className="max-w-7xl mx-auto h-full flex items-end justify-center pb-2.5">
            <span className="text-[11px] font-mono font-bold tracking-wider text-rose-700 uppercase">
              Batas Arena — Jangan Sampai Kartu Melewati Garis Ini
            </span>
          </div>
        </div>

        <AnimatePresence>
          {floatingPoints && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: -12, scale: 1 }}
              exit={{ opacity: 0, y: -24 }}
              className="pointer-events-none absolute top-6 right-8 z-30 text-2xl font-black font-mono tabular-nums text-amber-600 drop-shadow-xs"
            >
              {floatingPoints}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {levelUpBanner !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-white/75 backdrop-blur-sm"
            >
              <div className="rounded-2xl bg-white border-2 border-amber-300 px-10 py-8 text-center shadow-2xl">
                <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                <p className="text-xs font-mono font-bold tracking-[0.25em] text-sky-600 uppercase">
                  15/15 Tantangan Selesai
                </p>
                <h2 className="text-4xl font-black font-display text-slate-900 mt-1">
                  LEVEL {levelUpBanner}!
                </h2>
                <p className="text-sm text-emerald-700 mt-2 font-semibold">
                  5 Nyawa dipulihkan · Skor per kartu kini {levelUpBanner * 10} poin!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isEliminated && currentPlayer ? (
          <div className="relative z-20 h-full flex items-center justify-center p-6">
            <div className="max-w-3xl w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              <div className="md:col-span-5 rounded-2xl bg-white border border-rose-200 p-6 flex flex-col justify-between text-center shadow-xl shadow-slate-900/5">
                <div className="space-y-3">
                  <AlertOctagon className="w-12 h-12 text-rose-500 mx-auto" />
                  <h2 className="text-2xl font-black font-display text-slate-900">
                    ELIMINATED
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Nyawamu sudah habis. Skormu tetap tersimpan sambil menunggu Host mengakhiri permainan.
                  </p>
                </div>

                <div className="my-6 py-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                  <span className="text-xs font-medium text-amber-800">Skor Akhir Kamu</span>
                  <p className="text-4xl font-black font-mono tabular-nums text-amber-600">
                    {currentPlayer.score}
                  </p>
                  <p className="text-xs text-slate-600 tabular-nums">
                    Level {currentPlayer.level} · {currentPlayer.totalCompleted} tantangan
                  </p>
                </div>

                <p className="text-[11px] text-slate-500">
                  {myRankInTop20 !== null ? (
                    <>
                      Peringkat Top 20: <strong className="text-sky-700">#{myRankInTop20}</strong>
                    </>
                  ) : (
                    'Belum masuk Top 20'
                  )}
                </p>
              </div>

              <div className="md:col-span-7 min-h-[340px] max-h-[420px]">
                <LiveLeaderboard
                  entries={rankedTop20}
                  players={players}
                  currentUid={currentUid}
                  serverNowMs={serverNowMs}
                  variant="panel"
                />
              </div>
            </div>
          </div>
        ) : (
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

      {leaderboardOpen && (
        <LiveLeaderboard
          entries={rankedTop20}
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
