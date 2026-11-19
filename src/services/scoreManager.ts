import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import type { LeaderboardEntry } from '../types/game';
import { db, handleFirestoreError, OperationType } from './firebaseService';

export const CHALLENGES_PER_LEVEL = 15;
export const MAX_LEADERBOARD_ENTRIES = 20;

interface RankCandidate {
  uid: string;
  name: string;
  avatarColor: string;
  score: number;
  level: number;
  completed: number;
  totalCompleted: number;
  lives: number;
  status: 'connected' | 'disconnected' | 'eliminated';
  roundNumber: number;
}

export function outranksEntry(
  a: Pick<RankCandidate, 'score' | 'level' | 'totalCompleted'>,
  b: Pick<RankCandidate, 'score' | 'level' | 'totalCompleted'>
): boolean {
  if (a.score !== b.score) return a.score > b.score;
  if (a.level !== b.level) return a.level > b.level;
  return a.totalCompleted > b.totalCompleted;
}

export function sortLeaderboardEntries<
  T extends {
    score: number;
    level: number;
    totalCompleted: number;
    name: string;
  },
>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.level !== a.level) return b.level - a.level;
    if (b.totalCompleted !== a.totalCompleted) {
      return b.totalCompleted - a.totalCompleted;
    }
    return a.name.localeCompare(b.name, 'id');
  });
}

export async function recordChallengeSuccess(
  roomCode: string,
  playerUid: string
): Promise<{ leveledUp: boolean; pointsEarned: number; nextLevel: number }> {
  const playerPath = `rooms/${roomCode}/players/${playerUid}`;
  const playerRef = doc(db, 'rooms', roomCode, 'players', playerUid);
  const metaRef = doc(db, 'rooms', roomCode, 'leaderboardMeta', 'state');

  try {
    return await runTransaction(db, async (tx) => {
      // Phase 1: All Reads BEFORE Writes
      const playerSnap = await tx.get(playerRef);
      if (!playerSnap.exists()) {
        return { leveledUp: false, pointsEarned: 0, nextLevel: 1 };
      }

      const pData = playerSnap.data();
      const status = String(pData.status || 'connected');
      const lives = Number(pData.lives ?? 0);
      const level = Number(pData.level || 1);
      const score = Number(pData.score || 0);
      const completed = Number(pData.completed || 0);
      const totalCompleted = Number(pData.totalCompleted || 0);
      const roundNumber = Number(pData.roundNumber || 1);
      const name = String(pData.name || '');
      const avatarColor = String(pData.avatarColor || '#3B82F6');

      if (status === 'eliminated' || lives <= 0) {
        return { leveledUp: false, pointsEarned: 0, nextLevel: level };
      }

      const metaSnap = await tx.get(metaRef);
      const metaData = metaSnap.exists() ? metaSnap.data() : null;
      const existingUids: string[] = Array.isArray(metaData?.entryUids)
        ? metaData.entryUids.map(String)
        : [];

      const lbRefs = existingUids.map((uid) =>
        doc(db, 'rooms', roomCode, 'leaderboard', uid)
      );
      const lbSnaps = await Promise.all(lbRefs.map((ref) => tx.get(ref)));

      const existingEntries: RankCandidate[] = [];
      for (const snap of lbSnaps) {
        if (snap.exists()) {
          const d = snap.data();
          existingEntries.push({
            uid: String(d.uid || snap.id),
            name: String(d.name || ''),
            avatarColor: String(d.avatarColor || '#3B82F6'),
            score: Number(d.score || 0),
            level: Number(d.level || 1),
            completed: Number(d.completed || 0),
            totalCompleted: Number(d.totalCompleted || 0),
            lives: Number(d.lives ?? 5),
            status: (d.status as RankCandidate['status']) || 'connected',
            roundNumber: Number(d.roundNumber || roundNumber),
          });
        }
      }

      // Phase 2: Compute Next State
      const pointsEarned = 10 * level;
      const nextScore = score + pointsEarned;
      const nextTotalCompleted = totalCompleted + 1;
      const leveledUp = completed >= CHALLENGES_PER_LEVEL - 1;
      const nextLevel = leveledUp ? level + 1 : level;
      const nextCompleted = leveledUp ? 0 : completed + 1;
      const nextLives = leveledUp ? 5 : lives;

      const updatedCandidate: RankCandidate = {
        uid: playerUid,
        name,
        avatarColor,
        score: nextScore,
        level: nextLevel,
        completed: nextCompleted,
        totalCompleted: nextTotalCompleted,
        lives: nextLives,
        status: 'connected',
        roundNumber,
      };

      // Phase 3: Writes
      if (leveledUp) {
        tx.update(playerRef, {
          score: nextScore,
          level: nextLevel,
          lives: 5,
          completed: 0,
          totalCompleted: nextTotalCompleted,
          status: 'connected',
          lastSeen: serverTimestamp(),
        });
      } else {
        tx.update(playerRef, {
          score: nextScore,
          completed: nextCompleted,
          totalCompleted: nextTotalCompleted,
          status: 'connected',
          lastSeen: serverTimestamp(),
        });
      }

      // Sync verified multiplayer score to the global Multiplayer Leaderboard (strictly isolated from Solo)
      const mpLbId = `${roomCode}_r${roundNumber}_${playerUid}`;
      const mpLbRef = doc(db, 'multiplayerLeaderboard', mpLbId);
      tx.set(mpLbRef, {
        roomCode,
        roundNumber,
        uid: playerUid,
        name,
        avatarColor,
        score: nextScore,
        level: nextLevel,
        totalCompleted: nextTotalCompleted,
        mode: 'multiplayer',
        updatedAt: serverTimestamp(),
      });

      if (metaSnap.exists()) {
        const alreadyInLeaderboard = existingEntries.some(
          (e) => e.uid === playerUid
        );

        if (alreadyInLeaderboard) {
          // Update existing entry in Top 20 and recompute rank #20 threshold
          const nextEntries = sortLeaderboardEntries(
            existingEntries.map((e) =>
              e.uid === playerUid ? updatedCandidate : e
            )
          );
          const lowest = nextEntries[nextEntries.length - 1];
          const myLbRef = doc(db, 'rooms', roomCode, 'leaderboard', playerUid);

          tx.update(myLbRef, {
            score: nextScore,
            level: nextLevel,
            completed: nextCompleted,
            totalCompleted: nextTotalCompleted,
            lives: nextLives,
            status: 'connected',
            updatedAt: serverTimestamp(),
          });

          tx.update(metaRef, {
            count: nextEntries.length,
            entryUids: nextEntries.map((e) => e.uid),
            minEntryUid: lowest ? lowest.uid : null,
            minScore: lowest ? lowest.score : 0,
            minLevel: lowest ? lowest.level : 0,
            minTotalCompleted: lowest ? lowest.totalCompleted : 0,
            updatedAt: serverTimestamp(),
          });
        } else if (existingEntries.length < MAX_LEADERBOARD_ENTRIES) {
          // Space available (< 20): insert directly into leaderboard
          const nextEntries = sortLeaderboardEntries([
            ...existingEntries,
            updatedCandidate,
          ]);
          const lowest = nextEntries[nextEntries.length - 1];
          const myLbRef = doc(db, 'rooms', roomCode, 'leaderboard', playerUid);

          tx.set(myLbRef, {
            ...updatedCandidate,
            updatedAt: serverTimestamp(),
          });

          tx.update(metaRef, {
            count: nextEntries.length,
            entryUids: nextEntries.map((e) => e.uid),
            minEntryUid: lowest.uid,
            minScore: lowest.score,
            minLevel: lowest.level,
            minTotalCompleted: lowest.totalCompleted,
            updatedAt: serverTimestamp(),
          });
        } else {
          // Full (20 entries): only insert if strictly outranking rank #20, and evict #20!
          const sortedExisting = sortLeaderboardEntries(existingEntries);
          const currentRank20 = sortedExisting[sortedExisting.length - 1];

          if (currentRank20 && outranksEntry(updatedCandidate, currentRank20)) {
            const evictedRef = doc(
              db,
              'rooms',
              roomCode,
              'leaderboard',
              currentRank20.uid
            );
            const myLbRef = doc(db, 'rooms', roomCode, 'leaderboard', playerUid);

            const nextEntries = sortLeaderboardEntries([
              ...sortedExisting.slice(0, MAX_LEADERBOARD_ENTRIES - 1),
              updatedCandidate,
            ]);
            const newLowest = nextEntries[nextEntries.length - 1];

            tx.delete(evictedRef);
            tx.set(myLbRef, {
              ...updatedCandidate,
              updatedAt: serverTimestamp(),
            });
            tx.update(metaRef, {
              count: MAX_LEADERBOARD_ENTRIES,
              entryUids: nextEntries.map((e) => e.uid),
              minEntryUid: newLowest.uid,
              minScore: newLowest.score,
              minLevel: newLowest.level,
              minTotalCompleted: newLowest.totalCompleted,
              updatedAt: serverTimestamp(),
            });
          }
          // Otherwise: Rank 21+ is NOT written to /leaderboard at all!
        }
      }

      return { leveledUp, pointsEarned, nextLevel };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, playerPath);
  }
}

export async function recordCardMissed(
  roomCode: string,
  playerUid: string
): Promise<{ eliminated: boolean; livesRemaining: number }> {
  const playerPath = `rooms/${roomCode}/players/${playerUid}`;
  const playerRef = doc(db, 'rooms', roomCode, 'players', playerUid);
  const lbRef = doc(db, 'rooms', roomCode, 'leaderboard', playerUid);

  try {
    return await runTransaction(db, async (tx) => {
      const playerSnap = await tx.get(playerRef);
      const lbSnap = await tx.get(lbRef);

      if (!playerSnap.exists()) {
        return { eliminated: true, livesRemaining: 0 };
      }

      const data = playerSnap.data();
      const status = String(data.status || 'connected');
      const lives = Number(data.lives ?? 0);

      if (status === 'eliminated' || lives <= 0) {
        return { eliminated: true, livesRemaining: 0 };
      }

      const livesRemaining = Math.max(0, lives - 1);
      const eliminated = livesRemaining === 0;
      const nextStatus = eliminated ? 'eliminated' : 'connected';

      tx.update(playerRef, {
        lives: livesRemaining,
        status: nextStatus,
        lastSeen: serverTimestamp(),
      });

      if (lbSnap.exists()) {
        tx.update(lbRef, {
          lives: livesRemaining,
          status: nextStatus,
          updatedAt: serverTimestamp(),
        });
      }

      return { eliminated, livesRemaining };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, playerPath);
  }
}

export function sortLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return sortLeaderboardEntries(entries);
}
