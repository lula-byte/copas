import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  ensureAnonymousSession,
  isFirebaseConfigured,
  signInWithGoogleFallback,
} from './services/firebaseService';
import {
  subscribeToLeaderboard,
  subscribeToPlayers,
  subscribeToRoom,
  tryReconnectSession,
} from './services/roomManager';
import {
  markPlayerDisconnected,
  sendPresenceHeartbeat,
} from './services/playerManager';
import { soundManager } from './services/soundManager';
import type {
  AppScreen,
  AuthReadyState,
  LeaderboardEntry,
  PlayerData,
  RoomData,
  SoloSessionResult,
} from './types/game';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FirebaseSetupBanner } from './components/FirebaseSetupBanner';
import { LandingPage } from './components/LandingPage';
import { HowToPlayModal } from './components/HowToPlayModal';
import { CreateRoomView } from './components/CreateRoomView';
import { JoinRoomView } from './components/JoinRoomView';
import { WaitingRoom } from './components/WaitingRoom';
import { GameArena } from './components/GameArena';
import { FinalResults } from './components/FinalResults';
import { SoloSetupView } from './components/SoloSetupView';
import { SoloArena } from './components/SoloArena';
import { SoloResults } from './components/SoloResults';
import { LeaderboardsView } from './components/LeaderboardsView';

const SESSION_STORAGE_KEY = 'bcp_active_session';

interface StoredSession {
  roomCode: string;
  role: 'host' | 'player';
}

function loadStoredSession(): StoredSession | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (parsed?.roomCode && (parsed.role === 'host' || parsed.role === 'player')) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function saveStoredSession(session: StoredSession | null) {
  try {
    if (!session) {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  } catch {
    // Ignore storage quota issues
  }
}

function GameApp() {
  const [authState, setAuthState] = useState<AuthReadyState>(
    isFirebaseConfigured ? 'initializing' : 'config_error'
  );
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentUid, setCurrentUid] = useState<string>('');
  const [signingInGoogle, setSigningInGoogle] = useState(false);

  const [screen, setScreen] = useState<AppScreen>('landing');
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<'host' | 'player' | null>(null);

  const [room, setRoom] = useState<RoomData | null>(null);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [serverClockOffsetMs, setServerClockOffsetMs] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const [soloPlayerName, setSoloPlayerName] = useState<string>('');
  const [soloAvatarColor, setSoloAvatarColor] = useState<string>('#06B6D4');
  const [soloRunKey, setSoloRunKey] = useState<number>(1);
  const [soloResult, setSoloResult] = useState<SoloSessionResult | null>(null);
  const [leaderboardsTab, setLeaderboardsTab] = useState<'solo' | 'multiplayer'>('solo');

  const currentPlayerStatusRef = useRef<PlayerData['status']>('connected');

  const initSession = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setAuthState('config_error');
      setAuthError('Konfigurasi Firebase belum diisi.');
      return;
    }

    setAuthState('initializing');
    const result = await ensureAnonymousSession();
    if (result.user) {
      setCurrentUid(result.user.uid);
      setAuthState('ready');
      setAuthError(null);

      const stored = loadStoredSession();
      if (stored) {
        const ok = await tryReconnectSession(stored.roomCode, stored.role);
        if (ok) {
          setActiveRoomCode(stored.roomCode);
          setActiveRole(stored.role);
        } else {
          saveStoredSession(null);
        }
      }
    } else if (result.anonymousDisabled) {
      setAuthState('anonymous_disabled');
      setAuthError(result.errorMessage);
    } else {
      setAuthState('config_error');
      setAuthError(result.errorMessage);
    }
  }, []);

  useEffect(() => {
    initSession();
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setCurrentUid(u.uid);
        setAuthState('ready');
      }
    });
    return () => unsub();
  }, [initSession]);

  const handleGoogleSignIn = async () => {
    setSigningInGoogle(true);
    try {
      const user = await signInWithGoogleFallback();
      setCurrentUid(user.uid);
      setAuthState('ready');
      setAuthError(null);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Login Google dibatalkan atau gagal.'
      );
    } finally {
      setSigningInGoogle(false);
    }
  };

  // Subscribe to active room, players, and Top-20 leaderboard in real-time
  useEffect(() => {
    if (!activeRoomCode || authState !== 'ready') {
      setRoom(null);
      setPlayers([]);
      setLeaderboard([]);
      return;
    }

    const unsubRoom = subscribeToRoom(activeRoomCode, (nextRoom, offset) => {
      if (!nextRoom) {
        setActiveRoomCode(null);
        setActiveRole(null);
        saveStoredSession(null);
        setScreen('landing');
        return;
      }

      setRoom(nextRoom);
      if (offset !== null) {
        setServerClockOffsetMs(offset);
      }

      if (nextRoom.status === 'waiting' || nextRoom.status === 'countdown') {
        setScreen('waiting');
      } else if (nextRoom.status === 'playing') {
        setScreen('arena');
      } else if (nextRoom.status === 'finished') {
        setScreen('results');
      }
    });

    const unsubPlayers = subscribeToPlayers(activeRoomCode, (nextPlayers) => {
      setPlayers(nextPlayers);
      const mine = nextPlayers.find((p) => p.uid === currentUid);
      if (mine) {
        currentPlayerStatusRef.current = mine.status;
      }
    });

    const unsubLeaderboard = subscribeToLeaderboard(
      activeRoomCode,
      (nextEntries) => {
        setLeaderboard(nextEntries);
      }
    );

    return () => {
      unsubRoom();
      unsubPlayers();
      unsubLeaderboard();
    };
  }, [activeRoomCode, authState, currentUid]);

  useEffect(() => {
    if (
      !activeRoomCode ||
      activeRole !== 'player' ||
      !currentUid ||
      authState !== 'ready'
    ) {
      return;
    }

    const heartbeatId = window.setInterval(() => {
      sendPresenceHeartbeat(
        activeRoomCode,
        currentUid,
        currentPlayerStatusRef.current
      );
    }, 12000);

    const handlePageHide = () => {
      markPlayerDisconnected(
        activeRoomCode,
        currentUid,
        currentPlayerStatusRef.current
      );
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.clearInterval(heartbeatId);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [activeRoomCode, activeRole, currentUid, authState]);

  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      soundManager.setMuted(next);
      if (!next && (screen === 'arena' || screen === 'solo-arena')) {
        soundManager.startMusic();
      }
      return next;
    });
  };

  const handleRoomEntered = (code: string, role: 'host' | 'player') => {
    saveStoredSession({ roomCode: code, role });
    setActiveRoomCode(code);
    setActiveRole(role);
    setScreen('waiting');
  };

  const handleExitRoom = () => {
    soundManager.stopMusic();
    saveStoredSession(null);
    setActiveRoomCode(null);
    setActiveRole(null);
    setRoom(null);
    setPlayers([]);
    setLeaderboard([]);
    setScreen('landing');
  };

  const handleStartSolo = (playerName: string, avatarColor: string) => {
    setSoloPlayerName(playerName);
    setSoloAvatarColor(avatarColor);
    setSoloResult(null);
    setSoloRunKey((k) => k + 1);
    setScreen('solo-arena');
  };

  const handleOpenLeaderboards = (tab: 'solo' | 'multiplayer' = 'solo') => {
    setLeaderboardsTab(tab);
    setScreen('leaderboards');
  };

  const isHost = Boolean(room && currentUid && room.hostUid === currentUid);

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-slate-900">
      {(screen === 'landing' ||
        screen === 'solo-setup' ||
        screen === 'leaderboards') && (
        <FirebaseSetupBanner
          authState={authState}
          errorMessage={authError}
          onRetry={initSession}
          onGoogleSignIn={handleGoogleSignIn}
          signingInGoogle={signingInGoogle}
        />
      )}

      {screen === 'landing' && (
        <LandingPage
          onStartSolo={() => setScreen('solo-setup')}
          onCreateRoom={() => setScreen('create')}
          onJoinGame={() => setScreen('join')}
          onOpenHowToPlay={() => setHowToPlayOpen(true)}
          onOpenLeaderboards={handleOpenLeaderboards}
          authState={authState}
        />
      )}

      {screen === 'solo-setup' && (
        <SoloSetupView
          initialName={soloPlayerName}
          onBack={() => setScreen('landing')}
          onStartSolo={handleStartSolo}
          onOpenSoloLeaderboard={() => handleOpenLeaderboards('solo')}
        />
      )}

      {screen === 'solo-arena' && (
        <SoloArena
          key={soloRunKey}
          playerName={soloPlayerName}
          avatarColor={soloAvatarColor}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onFinished={(result) => {
            setSoloResult(result);
            setScreen('solo-results');
          }}
        />
      )}

      {screen === 'solo-results' && soloResult && (
        <SoloResults
          result={soloResult}
          onPlayAgain={() => {
            setSoloResult(null);
            setSoloRunKey((k) => k + 1);
            setScreen('solo-arena');
          }}
          onBackHome={() => {
            setSoloResult(null);
            setScreen('landing');
          }}
          onOpenAllLeaderboards={() => handleOpenLeaderboards('multiplayer')}
        />
      )}

      {screen === 'leaderboards' && (
        <LeaderboardsView
          initialTab={leaderboardsTab}
          currentUid={currentUid}
          onBack={() => setScreen('landing')}
          onStartSolo={() => setScreen('solo-setup')}
          onJoinMultiplayer={() => setScreen('join')}
        />
      )}

      {screen === 'create' && (
        <CreateRoomView
          onBack={() => setScreen('landing')}
          onRoomCreated={(code) => handleRoomEntered(code, 'host')}
        />
      )}

      {screen === 'join' && (
        <JoinRoomView
          onBack={() => setScreen('landing')}
          onJoined={(code) => handleRoomEntered(code, 'player')}
        />
      )}

      {screen === 'waiting' && room && (
        <WaitingRoom
          room={room}
          players={players}
          isHost={isHost}
          currentUid={currentUid}
          serverClockOffsetMs={serverClockOffsetMs}
          onExitRoom={handleExitRoom}
        />
      )}

      {screen === 'arena' && room && (
        <GameArena
          room={room}
          players={players}
          leaderboard={leaderboard}
          isHost={isHost}
          currentUid={currentUid}
          serverClockOffsetMs={serverClockOffsetMs}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {screen === 'results' && room && (
        <FinalResults
          room={room}
          players={players}
          leaderboard={leaderboard}
          isHost={isHost}
          currentUid={currentUid}
          onBackHome={handleExitRoom}
        />
      )}

      <HowToPlayModal
        open={howToPlayOpen}
        onClose={() => setHowToPlayOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GameApp />
    </ErrorBoundary>
  );
}
