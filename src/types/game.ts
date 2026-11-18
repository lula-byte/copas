export type RoomStatus = 'waiting' | 'countdown' | 'playing' | 'finished';

export type PlayerStatus = 'connected' | 'disconnected' | 'eliminated';

export type ChallengeType =
  | 'BLOK_KATA'
  | 'BLOK_KALIMAT'
  | 'COPY'
  | 'BLOK_PARAGRAF'
  | 'COPY_PASTE';

export interface RoomData {
  roomCode: string;
  hostUid: string;
  hostName: string;
  status: RoomStatus;
  createdAt: number | null;
  updatedAt: number | null;
  countdownStartedAt: number | null;
  startTime: number | null;
  endTime: number | null;
  challengeSeed: number;
  roundNumber: number;
  maxPlayers: number;
  playerCount: number;
}

export interface PlayerData {
  uid: string;
  name: string;
  normalizedKey: string;
  avatarColor: string;
  score: number;
  level: number;
  lives: number;
  completed: number;
  totalCompleted: number;
  status: PlayerStatus;
  roundNumber: number;
  joinedAt: number | null;
  lastSeen: number | null;
}

export interface ChallengeTemplate {
  type: ChallengeType;
  title: string;
  instruction: string;
  text: string;
  target: string;
  contextSentences?: string[];
}

export interface ActiveChallengeCard extends ChallengeTemplate {
  id: string;
  index: number;
  xPercent: number;
  yPx: number;
  speedPxPerSec: number;
  widthPx: number;
}

export type AppScreen =
  | 'landing'
  | 'create'
  | 'join'
  | 'waiting'
  | 'arena'
  | 'results';

export type AuthReadyState =
  | 'initializing'
  | 'ready'
  | 'anonymous_disabled'
  | 'config_error';
