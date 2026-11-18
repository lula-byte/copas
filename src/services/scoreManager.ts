import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import type { PlayerData } from '../types/game';
import { db, handleFirestoreError, OperationType } from './firebaseService';

export const CHALLENGES_PER_LEVEL = 15;

export async function recordChallengeSuccess(
  roomCode: string,
  playerUid: string
): Promise<{ leveledUp: boolean; pointsEarned: number; nextLevel: number }> {
  const playerPath = `rooms/${roomCode}/players/${playerUid}`;
  const playerRef = doc(db, 'rooms', roomCode, 'players', playerUid);

  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(playerRef);
      if (!snap.exists()) {
        return { leveledUp: false, pointsEarned: 0, nextLevel: 1 };
      }

      const data = snap.data();
      const status = String(data.status || 'connected');
      const lives = Number(data.lives ?? 0);
      const level = Number(data.level || 1);
      const score = Number(data.score || 0);
      const completed = Number(data.completed || 0);
      const totalCompleted = Number(data.totalCompleted || 0);

      if (status === 'eliminated' || lives <= 0) {
        return { leveledUp: false, pointsEarned: 0, nextLevel: level };
      }

      const pointsEarned = 10 * level;
      const nextScore = score + pointsEarned;
      const nextTotalCompleted = totalCompleted + 1;
      const leveledUp = completed >= CHALLENGES_PER_LEVEL - 1;

      if (leveledUp) {
        const nextLevel = level + 1;
        tx.update(playerRef, {
          score: nextScore,
          level: nextLevel,
          lives: 5,
          completed: 0,
          totalCompleted: nextTotalCompleted,
          status: 'connected',
          lastSeen: serverTimestamp(),
        });
        return { leveledUp: true, pointsEarned, nextLevel };
      }

      tx.update(playerRef, {
        score: nextScore,
        completed: completed + 1,
        totalCompleted: nextTotalCompleted,
        status: 'connected',
        lastSeen: serverTimestamp(),
      });
      return { leveledUp: false, pointsEarned, nextLevel: level };
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

  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(playerRef);
      if (!snap.exists()) {
        return { eliminated: true, livesRemaining: 0 };
      }

      const data = snap.data();
      const status = String(data.status || 'connected');
      const lives = Number(data.lives ?? 0);

      if (status === 'eliminated' || lives <= 0) {
        return { eliminated: true, livesRemaining: 0 };
      }

      const livesRemaining = Math.max(0, lives - 1);
      const eliminated = livesRemaining === 0;

      tx.update(playerRef, {
        lives: livesRemaining,
        status: eliminated ? 'eliminated' : 'connected',
        lastSeen: serverTimestamp(),
      });
      return { eliminated, livesRemaining };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, playerPath);
  }
}

export function sortLeaderboard(players: PlayerData[]): PlayerData[] {
  return [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.level !== a.level) return b.level - a.level;
    if (b.totalCompleted !== a.totalCompleted) {
      return b.totalCompleted - a.totalCompleted;
    }
    return a.name.localeCompare(b.name, 'id');
  });
}
