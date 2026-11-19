import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Clock,
  Flag,
  Heart,
  Layers,
  Sparkles,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ActiveChallengeCard, SoloSessionResult } from '../types/game';
import {
  generateChallengeForIndex,
  getLevelSpeedAndInterval,
} from '../data/challenges';
import { CHALLENGES_PER_LEVEL } from '../services/scoreManager';
import { saveSoloScore } from '../services/soloService';
import { soundManager } from '../services/soundManager';
import { ChallengeCard } from './ChallengeCard';
import { formatTimeMMSS } from './PlayerHud';

interface SoloArenaProps {
  playerName: string;
  avatarColor: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onFinished: (result: SoloSessionResult) => void;
}

export function SoloArena({
  playerName,
  avatarColor,
  isMuted,
  onToggleMute,
  onFinished,
}: SoloArenaProps) {
  const [seed] = useState(() => Math.floor(100000 + Math.random() * 899999));
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(5);
  const [completed, setCompleted] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [saving, setSaving] = useState(false);

  const [cards, setCards] = useState<ActiveChallengeCard[]>([]);
  const [pausedMap, setPausedMap] = useState<Record<string, boolean>>({});
  const [levelUpBanner, setLevelUpBanner] = useState<number | null>(null);
  const [floatingPoints, setFloatingPoints] = useState<string | null>(null);

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const cardIndexRef = useRef(0);
  const lastSpawnAtRef = useRef(0);
  const pausedMapRef = useRef<Record<string, boolean>>({});
  const missedLockRef = useRef<Set<string>>(new Set());
  const levelFreezeUntilRef = useRef(0);
  const startMsRef = useRef(Date.now());
  const finishedRef = useRef(false);

  // Mirror latest stats in refs so async finish saves exact totals
  const statsRef = useRef({
    score: 0,
    level: 1,
    lives: 5,
    completed: 0,
    totalCompleted: 0,
    elapsedSeconds: 0,
  });

  useEffect(() => {
    statsRef.current = {
      score,
      level,
      lives,
      completed,
      totalCompleted,
      elapsedSeconds,
    };
  }, [score, level, lives, completed, totalCompleted, elapsedSeconds]);

  useEffect(() => {
    pausedMapRef.current = pausedMap;
  }, [pausedMap]);

  useEffect(() => {
    soundManager.playGameStart();
    return () => {
      soundManager.stopMusic();
    };
  }, []);

  useEffect(() => {
    if (isMuted) {
      soundManager.stopMusic();
    } else if (!finishedRef.current) {
      soundManager.startMusic();
    }
  }, [isMuted]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      if (!finishedRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - startMsRef.current) / 1000));
      }
    }, 500);
    return () => window.clearInterval(timerId);
  }, []);

  const finalizeSoloRun = useCallback(
    async (endReason: 'eliminated' | 'finished_by_player') => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setSaving(true);
      soundManager.stopMusic();

      const snap = statsRef.current;
      const finalDuration = Math.max(
        snap.elapsedSeconds,
        Math.floor((Date.now() - startMsRef.current) / 1000)
      );

      let entryId: string | null = null;
      if (snap.score > 0 && snap.totalCompleted > 0) {
        try {
          entryId = await saveSoloScore({
            name: playerName,
            avatarColor,
            score: snap.score,
            level: snap.level,
            totalCompleted: snap.totalCompleted,
            durationSeconds: finalDuration,
          });
        } catch {
          entryId = null;
        }
      }

      onFinished({
        entryId,
        playerName,
        avatarColor,
        score: snap.score,
        level: snap.level,
        totalCompleted: snap.totalCompleted,
        durationSeconds: finalDuration,
        savedToLeaderboard: Boolean(entryId),
        endReason,
      });
    },
    [playerName, avatarColor, onFinished]
  );

  const spawnNextCard = useCallback(
    (targetLevel: number) => {
      const arenaWidth = arenaRef.current?.clientWidth || 1000;
      const idx = cardIndexRef.current++;
      const tpl = generateChallengeForIndex(seed, targetLevel, idx);

      const desiredWidth =
        tpl.type === 'BLOK_PARAGRAF'
          ? Math.min(440, Math.max(290, arenaWidth - 32))
          : Math.min(380, Math.max(270, arenaWidth - 32));

      const maxLeftPercent = Math.max(
        4,
        Math.min(68, ((arenaWidth - desiredWidth - 20) / arenaWidth) * 100)
      );
      const laneSlots = [4, 32, 58, 18, 46];
      const xPercent = Math.min(laneSlots[idx % laneSlots.length], maxLeftPercent);
      const { speedPxPerSec } = getLevelSpeedAndInterval(targetLevel);

      setCards((prev) => [
        ...prev,
        {
          ...tpl,
          id: `solo-${targetLevel}-${idx}-${Date.now()}`,
          index: idx,
          xPercent,
          yPx: 12,
          speedPxPerSec,
          widthPx: desiredWidth,
        },
      ]);
    },
    [seed]
  );

  // Main 60fps Falling Card Loop
  useEffect(() => {
    if (finishedRef.current || lives <= 0) return;

    let rafId = 0;
    let lastFrameTime = performance.now();

    const loop = (now: number) => {
      if (finishedRef.current) return;
      const dt = Math.min(0.08, (now - lastFrameTime) / 1000);
      lastFrameTime = now;

      const nowEpoch = Date.now();
      const currentLevel = statsRef.current.level;
      const { spawnIntervalMs, maxActiveCards } =
        getLevelSpeedAndInterval(currentLevel);
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
            const tpl = generateChallengeForIndex(seed, currentLevel, idx);
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
            const { speedPxPerSec } = getLevelSpeedAndInterval(currentLevel);

            nextCards = [
              ...prevCards,
              {
                ...tpl,
                id: `solo-${currentLevel}-${idx}-${nowEpoch}`,
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
            let newMissedCount = 0;
            missedIds.forEach((id) => {
              if (!missedLockRef.current.has(id)) {
                missedLockRef.current.add(id);
                newMissedCount += 1;
              }
            });

            if (newMissedCount > 0) {
              soundManager.playMissed();
              setLives((prevLives) => {
                const nextLives = Math.max(0, prevLives - newMissedCount);
                statsRef.current.lives = nextLives;
                if (nextLives === 0) {
                  window.setTimeout(() => {
                    finalizeSoloRun('eliminated');
                  }, 150);
                }
                return nextLives;
              });
            }
          }

          return surviving;
        });
      }

      rafId = window.requestAnimationFrame(loop);
    };

    if (lastSpawnAtRef.current === 0) {
      lastSpawnAtRef.current = Date.now();
      spawnNextCard(1);
    }

    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, [seed, lives, spawnNextCard, finalizeSoloRun]);

  const handlePauseChange = useCallback((cardId: string, paused: boolean) => {
    setPausedMap((prev) => {
      if (Boolean(prev[cardId]) === paused) return prev;
      return { ...prev, [cardId]: paused };
    });
  }, []);

  const handleCardSuccess = useCallback((cardId: string) => {
    if (finishedRef.current) return;

    setCards((prev) => prev.filter((c) => c.id !== cardId));
    setPausedMap((prev) => {
      const copy = { ...prev };
      delete copy[cardId];
      return copy;
    });
    soundManager.playCorrect();

    const curr = statsRef.current;
    const pointsEarned = 10 * curr.level;
    const nextScore = curr.score + pointsEarned;
    const nextTotalCompleted = curr.totalCompleted + 1;
    const leveledUp = curr.completed >= CHALLENGES_PER_LEVEL - 1;

    setScore(nextScore);
    setTotalCompleted(nextTotalCompleted);
    setFloatingPoints(`+${pointsEarned}`);
    window.setTimeout(() => setFloatingPoints(null), 1100);

    if (leveledUp) {
      const nextLevel = curr.level + 1;
      setLevel(nextLevel);
      setCompleted(0);
      setLives(5);
      statsRef.current = {
        ...curr,
        score: nextScore,
        level: nextLevel,
        completed: 0,
        lives: 5,
        totalCompleted: nextTotalCompleted,
      };
      soundManager.playLevelUp();
      setCards([]);
      levelFreezeUntilRef.current = Date.now() + 2100;
      lastSpawnAtRef.current = Date.now() + 2100;
      setLevelUpBanner(nextLevel);
      window.setTimeout(() => setLevelUpBanner(null), 2200);
    } else {
      const nextCompleted = curr.completed + 1;
      setCompleted(nextCompleted);
      statsRef.current = {
        ...curr,
        score: nextScore,
        completed: nextCompleted,
        totalCompleted: nextTotalCompleted,
      };
    }
  }, []);

  const handleWrongAttempt = useCallback(() => {
    soundManager.playWrong();
  }, []);

  const progressPct = Math.min(
    100,
    Math.round((completed / CHALLENGES_PER_LEVEL) * 100)
  );

  return (
    <div className="h-screen bg-[#F5F9FF] text-slate-900 arena-grid-bg flex flex-col overflow-hidden relative">
      {/* Solo HUD */}
      <header className="relative z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Solo Identity + Level + Lives */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold font-display text-xs text-white shrink-0 shadow-xs"
                style={{ backgroundColor: avatarColor }}
              >
                {playerName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[180px]">
                  {playerName}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-700">
                  <User className="w-3 h-3 shrink-0" />
                  <span>Mode Solo</span>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-xs font-bold text-sky-700 tabular-nums">
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>Level {level}</span>
            </div>

            <div
              className="flex items-center gap-1"
              aria-label={`Nyawa tersisa: ${lives} dari 5`}
            >
              {Array.from({ length: 5 }).map((_, idx) => {
                const alive = idx < lives;
                return (
                  <Heart
                    key={idx}
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                      alive
                        ? 'text-rose-500 fill-rose-500 scale-100'
                        : 'text-slate-200 fill-slate-100 scale-90'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Center: Progress 0/15 */}
          <div className="flex-1 min-w-[170px] max-w-xs mx-auto sm:mx-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600 font-semibold">
                Level {level} · Tantangan
              </span>
              <span className="font-mono font-bold tabular-nums text-sky-700">
                {completed}/{CHALLENGES_PER_LEVEL}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Right: Score + Timer + Finish Button + Mute */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="text-right px-3 py-1 rounded-xl bg-amber-50 border border-amber-200">
              <span className="block text-[10px] text-amber-700 font-bold uppercase">
                Skor
              </span>
              <span className="text-base sm:text-lg font-black font-mono tabular-nums text-amber-600 leading-none">
                {score}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold tabular-nums text-slate-700">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>{formatTimeMMSS(elapsedSeconds)}</span>
            </div>

            <button
              type="button"
              onClick={() => finalizeSoloRun('finished_by_player')}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-xs font-bold text-emerald-800 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <Flag className="w-3.5 h-3.5 text-emerald-600" />
              <span>{saving ? 'Menyimpan...' : 'Selesai'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              aria-label={isMuted ? 'Nyalakan suara' : 'Matikan suara'}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-sky-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Falling Card Arena */}
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

        {cards.map((card) => (
          <ChallengeCard
            key={card.id}
            card={card}
            isPaused={Boolean(pausedMap[card.id])}
            onPauseChange={handlePauseChange}
            onSuccess={handleCardSuccess}
            onWrongAttempt={handleWrongAttempt}
          />
        ))}
      </div>
    </div>
  );
}
