import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type { PlayerData, RoomData, RoomStatus } from '../types/game';
import { auth, db, handleFirestoreError, OperationType } from './firebaseService';

const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const AVATAR_COLORS = [
  '#06B6D4', // Cyan
  '#3B82F6', // Electric Blue
  '#8B5CF6', // Violet
  '#10B981', // Emerald
  '#F59E0B', // Gold
  '#EC4899', // Rose
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

export class RoomActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoomActionError';
  }
}

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ROOM_CHARS.charAt(Math.floor(Math.random() * ROOM_CHARS.length));
  }
  return code;
}

export function encodeNameKey(rawName: string): string {
  const normalized = rawName.trim().toLowerCase().replace(/\s+/g, ' ');
  const bytes = new TextEncoder().encode(normalized);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function toMillis(val: unknown): number | null {
  if (val instanceof Timestamp) {
    return val.toMillis();
  }
  if (typeof val === 'number') return val;
  return null;
}

function mapRoomDoc(data: Record<string, unknown>): RoomData {
  return {
    roomCode: String(data.roomCode || ''),
    hostUid: String(data.hostUid || ''),
    hostName: String(data.hostName || ''),
    status: (data.status as RoomStatus) || 'waiting',
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
    countdownStartedAt: toMillis(data.countdownStartedAt),
    startTime: toMillis(data.startTime),
    endTime: toMillis(data.endTime),
    challengeSeed: Number(data.challengeSeed || 1),
    roundNumber: Number(data.roundNumber || 1),
    maxPlayers: Number(data.maxPlayers || 25),
    playerCount: Number(data.playerCount || 0),
  };
}

function mapPlayerDoc(data: Record<string, unknown>): PlayerData {
  return {
    uid: String(data.uid || ''),
    name: String(data.name || ''),
    normalizedKey: String(data.normalizedKey || ''),
    avatarColor: String(data.avatarColor || '#3B82F6'),
    score: Number(data.score || 0),
    level: Number(data.level || 1),
    lives: Number(data.lives ?? 5),
    completed: Number(data.completed || 0),
    totalCompleted: Number(data.totalCompleted || 0),
    status: (data.status as PlayerData['status']) || 'connected',
    roundNumber: Number(data.roundNumber || 1),
    joinedAt: toMillis(data.joinedAt),
    lastSeen: toMillis(data.lastSeen),
  };
}

export async function createRoom(rawHostName: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new RoomActionError('Sesi Firebase belum siap. Coba lagi sebentar.');
  }

  const hostName = rawHostName.trim().slice(0, 40);
  if (!hostName) {
    throw new RoomActionError('Nama host wajib diisi.');
  }

  for (let attempt = 0; attempt < 6; attempt++) {
    const roomCode = generateRoomCode();
    const roomPath = `rooms/${roomCode}`;
    const roomRef = doc(db, 'rooms', roomCode);

    try {
      const existing = await getDoc(roomRef);
      if (existing.exists()) {
        continue;
      }

      const challengeSeed = Math.floor(100000 + Math.random() * 899999);
      await setDoc(roomRef, {
        roomCode,
        hostUid: user.uid,
        hostName,
        status: 'waiting',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        countdownStartedAt: null,
        startTime: null,
        endTime: null,
        challengeSeed,
        roundNumber: 1,
        maxPlayers: 25,
        playerCount: 0,
      });

      return roomCode;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, roomPath);
    }
  }

  throw new RoomActionError('Gagal membuat kode room unik. Silakan coba lagi.');
}

export async function joinRoom(
  rawRoomCode: string,
  rawPlayerName: string
): Promise<{ roomCode: string; reconnected: boolean }> {
  const user = auth.currentUser;
  if (!user) {
    throw new RoomActionError('Sesi Firebase belum siap. Coba lagi sebentar.');
  }

  const roomCode = rawRoomCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(roomCode)) {
    throw new RoomActionError('Kode room harus terdiri dari 6 karakter huruf atau angka.');
  }

  const playerName = rawPlayerName.trim().slice(0, 30);
  if (!playerName) {
    throw new RoomActionError('Nama siswa wajib diisi.');
  }

  const normalizedKey = encodeNameKey(playerName);
  const roomRef = doc(db, 'rooms', roomCode);
  const playerRef = doc(db, 'rooms', roomCode, 'players', user.uid);
  const nameLockRef = doc(db, 'rooms', roomCode, 'names', normalizedKey);

  let reconnected = false;

  try {
    await runTransaction(db, async (tx) => {
      const roomSnap = await tx.get(roomRef);
      if (!roomSnap.exists()) {
        throw new RoomActionError(
          `Room "${roomCode}" tidak ditemukan. Periksa kembali kode dari guru.`
        );
      }

      const roomData = mapRoomDoc(roomSnap.data());
      if (roomData.hostUid === user.uid) {
        throw new RoomActionError(
          'Perangkat ini terdaftar sebagai Host pada room ini. Gunakan tab atau perangkat terpisah untuk masuk sebagai siswa.'
        );
      }

      const playerSnap = await tx.get(playerRef);
      if (playerSnap.exists()) {
        const existingPlayer = mapPlayerDoc(playerSnap.data());
        if (roomData.status === 'finished') {
          throw new RoomActionError('Permainan di room ini sudah berakhir.');
        }
        reconnected = true;
        if (existingPlayer.status !== 'eliminated') {
          tx.update(playerRef, {
            status: 'connected',
            lastSeen: serverTimestamp(),
          });
        }
        return;
      }

      if (roomData.status !== 'waiting') {
        throw new RoomActionError(
          'Game sedang berlangsung dan tidak menerima peserta baru.'
        );
      }

      if (roomData.playerCount >= roomData.maxPlayers) {
        throw new RoomActionError(
          `Room sudah penuh (${roomData.maxPlayers}/${roomData.maxPlayers} siswa).`
        );
      }

      const nameLockSnap = await tx.get(nameLockRef);
      if (nameLockSnap.exists()) {
        throw new RoomActionError(
          `Nama "${playerName}" sudah digunakan di room ini. Pilih nama lain.`
        );
      }

      const avatarColor =
        AVATAR_COLORS[roomData.playerCount % AVATAR_COLORS.length];

      tx.set(nameLockRef, {
        uid: user.uid,
        name: playerName,
      });

      tx.set(playerRef, {
        uid: user.uid,
        name: playerName,
        normalizedKey,
        avatarColor,
        score: 0,
        level: 1,
        lives: 5,
        completed: 0,
        totalCompleted: 0,
        status: 'connected',
        roundNumber: roomData.roundNumber,
        joinedAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      });

      tx.update(roomRef, {
        playerCount: roomData.playerCount + 1,
        updatedAt: serverTimestamp(),
      });
    });

    return { roomCode, reconnected };
  } catch (error) {
    if (error instanceof RoomActionError) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `rooms/${roomCode}`);
  }
}

export async function tryReconnectSession(
  roomCode: string,
  role: 'host' | 'player'
): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || !/^[A-Z0-9]{6}$/.test(roomCode)) return false;

  try {
    const roomSnap = await getDoc(doc(db, 'rooms', roomCode));
    if (!roomSnap.exists()) return false;
    const room = mapRoomDoc(roomSnap.data());

    if (role === 'host') {
      return room.hostUid === user.uid;
    }

    const playerRef = doc(db, 'rooms', roomCode, 'players', user.uid);
    const playerSnap = await getDoc(playerRef);
    if (!playerSnap.exists()) return false;

    const player = mapPlayerDoc(playerSnap.data());
    if (room.status !== 'finished' && player.status !== 'eliminated') {
      await updateDoc(playerRef, {
        status: 'connected',
        lastSeen: serverTimestamp(),
      });
    }
    return true;
  } catch {
    return false;
  }
}

export async function leaveWaitingRoom(roomCode: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const roomRef = doc(db, 'rooms', roomCode);
  const playerRef = doc(db, 'rooms', roomCode, 'players', user.uid);

  try {
    await runTransaction(db, async (tx) => {
      const roomSnap = await tx.get(roomRef);
      const playerSnap = await tx.get(playerRef);
      if (!roomSnap.exists() || !playerSnap.exists()) return;

      const room = mapRoomDoc(roomSnap.data());
      if (room.status !== 'waiting') return;

      const player = mapPlayerDoc(playerSnap.data());
      const nameLockRef = doc(db, 'rooms', roomCode, 'names', player.normalizedKey);

      tx.delete(playerRef);
      tx.delete(nameLockRef);
      tx.update(roomRef, {
        playerCount: Math.max(0, room.playerCount - 1),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `rooms/${roomCode}/players/${user.uid}`);
  }
}

export async function startGameCountdown(roomCode: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomCode);
  try {
    await updateDoc(roomRef, {
      status: 'countdown',
      countdownStartedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomCode}`);
  }
}

export async function activatePlayingState(roomCode: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomCode);
  try {
    await updateDoc(roomRef, {
      status: 'playing',
      startTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomCode}`);
  }
}

export async function endGame(roomCode: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomCode);
  try {
    await updateDoc(roomRef, {
      status: 'finished',
      endTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomCode}`);
  }
}

export async function playAgainRoom(
  roomCode: string,
  currentRound: number,
  players: PlayerData[]
): Promise<void> {
  const nextRound = currentRound + 1;
  const newSeed = Math.floor(100000 + Math.random() * 899999);
  const batch = writeBatch(db);

  const roomRef = doc(db, 'rooms', roomCode);
  batch.update(roomRef, {
    status: 'waiting',
    roundNumber: nextRound,
    challengeSeed: newSeed,
    countdownStartedAt: null,
    startTime: null,
    endTime: null,
    updatedAt: serverTimestamp(),
  });

  players.forEach((p) => {
    const pRef = doc(db, 'rooms', roomCode, 'players', p.uid);
    batch.update(pRef, {
      score: 0,
      level: 1,
      lives: 5,
      completed: 0,
      totalCompleted: 0,
      status: 'connected',
      roundNumber: nextRound,
      lastSeen: serverTimestamp(),
    });
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomCode}`);
  }
}

export async function closeRoom(
  roomCode: string,
  players: PlayerData[]
): Promise<void> {
  const batch = writeBatch(db);
  players.forEach((p) => {
    batch.delete(doc(db, 'rooms', roomCode, 'players', p.uid));
    if (p.normalizedKey) {
      batch.delete(doc(db, 'rooms', roomCode, 'names', p.normalizedKey));
    }
  });
  batch.delete(doc(db, 'rooms', roomCode));

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `rooms/${roomCode}`);
  }
}

export function subscribeToRoom(
  roomCode: string,
  onRoomUpdate: (room: RoomData | null, serverClockOffsetMs: number | null) => void
): Unsubscribe {
  const roomPath = `rooms/${roomCode}`;
  return onSnapshot(
    doc(db, 'rooms', roomCode),
    (snapshot) => {
      if (!snapshot.exists()) {
        onRoomUpdate(null, null);
        return;
      }
      const data = mapRoomDoc(snapshot.data());
      let offset: number | null = null;
      if (!snapshot.metadata.hasPendingWrites && data.updatedAt) {
        offset = data.updatedAt - Date.now();
      }
      onRoomUpdate(data, offset);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, roomPath);
    }
  );
}

export function subscribeToPlayers(
  roomCode: string,
  onPlayersUpdate: (players: PlayerData[]) => void
): Unsubscribe {
  const playersPath = `rooms/${roomCode}/players`;
  return onSnapshot(
    collection(db, 'rooms', roomCode, 'players'),
    (snapshot) => {
      const list: PlayerData[] = [];
      snapshot.forEach((d) => {
        list.push(mapPlayerDoc(d.data()));
      });
      onPlayersUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, playersPath);
    }
  );
}
