import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import type {
  MultiplayerLeaderboardEntry,
  SoloLeaderboardEntry,
} from '../types/game';
import { auth, db, handleFirestoreError, OperationType } from './firebaseService';
import { sortLeaderboardEntries } from './scoreManager';

function toMillis(val: unknown): number | null {
  if (val instanceof Timestamp) {
    return val.toMillis();
  }
  if (typeof val === 'number') return val;
  return null;
}

export async function saveSoloScore(params: {
  name: string;
  avatarColor: string;
  score: number;
  level: number;
  totalCompleted: number;
  durationSeconds: number;
}): Promise<string | null> {
  const user = auth.currentUser;
  if (!user || params.score <= 0 || params.totalCompleted <= 0) {
    return null;
  }

  const cleanName = params.name.trim().slice(0, 30);
  if (!cleanName) return null;

  const rand = Math.random().toString(36).slice(2, 8);
  const entryId = `solo_${user.uid}_${Date.now()}_${rand}`;
  const path = `soloLeaderboard/${entryId}`;

  try {
    await setDoc(doc(db, 'soloLeaderboard', entryId), {
      uid: user.uid,
      name: cleanName,
      avatarColor: params.avatarColor || '#06B6D4',
      score: Math.max(1, Math.floor(params.score)),
      level: Math.max(1, Math.floor(params.level)),
      totalCompleted: Math.max(1, Math.floor(params.totalCompleted)),
      durationSeconds: Math.max(0, Math.floor(params.durationSeconds)),
      mode: 'solo',
      createdAt: serverTimestamp(),
    });
    return entryId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToSoloLeaderboard(
  onUpdate: (entries: SoloLeaderboardEntry[]) => void
): Unsubscribe {
  const path = 'soloLeaderboard';
  const q = query(
    collection(db, path),
    where('score', '>=', 1),
    orderBy('score', 'desc'),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: SoloLeaderboardEntry[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.mode !== 'solo') return;
        list.push({
          id: d.id,
          uid: String(data.uid || ''),
          name: String(data.name || ''),
          avatarColor: String(data.avatarColor || '#06B6D4'),
          score: Number(data.score || 0),
          level: Number(data.level || 1),
          totalCompleted: Number(data.totalCompleted || 0),
          durationSeconds: Number(data.durationSeconds || 0),
          mode: 'solo',
          createdAt: toMillis(data.createdAt),
        });
      });
      onUpdate(sortLeaderboardEntries(list));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeToGlobalMultiplayerLeaderboard(
  onUpdate: (entries: MultiplayerLeaderboardEntry[]) => void
): Unsubscribe {
  const path = 'multiplayerLeaderboard';
  const q = query(
    collection(db, path),
    where('score', '>=', 1),
    orderBy('score', 'desc'),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: MultiplayerLeaderboardEntry[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.mode !== 'multiplayer') return;
        list.push({
          id: d.id,
          roomCode: String(data.roomCode || ''),
          roundNumber: Number(data.roundNumber || 1),
          uid: String(data.uid || ''),
          name: String(data.name || ''),
          avatarColor: String(data.avatarColor || '#3B82F6'),
          score: Number(data.score || 0),
          level: Number(data.level || 1),
          totalCompleted: Number(data.totalCompleted || 0),
          mode: 'multiplayer',
          updatedAt: toMillis(data.updatedAt),
        });
      });
      onUpdate(sortLeaderboardEntries(list));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
