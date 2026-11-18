import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { PlayerData } from '../types/game';
import { db } from './firebaseService';

export async function sendPresenceHeartbeat(
  roomCode: string,
  uid: string,
  currentStatus: PlayerData['status']
): Promise<void> {
  if (currentStatus === 'eliminated') return;
  try {
    await updateDoc(doc(db, 'rooms', roomCode, 'players', uid), {
      status: 'connected',
      lastSeen: serverTimestamp(),
    });
  } catch {
    // Heartbeat failures are non-fatal; next heartbeat or reconnect recovers
  }
}

export async function markPlayerDisconnected(
  roomCode: string,
  uid: string,
  currentStatus: PlayerData['status']
): Promise<void> {
  if (currentStatus === 'eliminated') return;
  try {
    await updateDoc(doc(db, 'rooms', roomCode, 'players', uid), {
      status: 'disconnected',
      lastSeen: serverTimestamp(),
    });
  } catch {
    // Ignore errors during page unload
  }
}

export function getEffectivePlayerStatus(
  player: PlayerData,
  serverNowMs: number
): PlayerData['status'] {
  if (player.status === 'eliminated' || player.lives <= 0) {
    return 'eliminated';
  }
  if (player.status === 'disconnected') {
    return 'disconnected';
  }
  if (player.lastSeen && serverNowMs - player.lastSeen > 35000) {
    return 'disconnected';
  }
  return 'connected';
}

export function getPlayerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
