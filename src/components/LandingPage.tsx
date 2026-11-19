import {
  ArrowRight,
  BookOpen,
  ClipboardCopy,
  Keyboard,
  MousePointer,
  Play,
  PlusSquare,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import type { AuthReadyState } from '../types/game';

interface LandingPageProps {
  onStartSolo: () => void;
  onCreateRoom: () => void;
  onJoinGame: () => void;
  onOpenHowToPlay: () => void;
  onOpenLeaderboards: (tab?: 'solo' | 'multiplayer') => void;
  authState: AuthReadyState;
}

const SKILL_MODULES = [
  {
    code: '01',
    name: 'Blok Kata',
    detail: 'Double-click kata target dengan presisi tinggi.',
    shortcut: '2× Klik',
    cardAccent: 'border-sky-200 hover:border-sky-300',
    numBg: 'bg-sky-100 text-sky-700',
    shortcutColor: 'text-sky-700',
  },
  {
    code: '02',
    name: 'Blok Kalimat',
    detail: 'Drag seleksi kalimat utuh sampai tanda titik.',
    shortcut: 'Drag Seleksi',
    cardAccent: 'border-blue-200 hover:border-blue-300',
    numBg: 'bg-blue-100 text-blue-700',
    shortcutColor: 'text-blue-700',
  },
  {
    code: '03',
    name: 'Copy Teks',
    detail: 'Salin kata sasaran langsung ke clipboard komputer.',
    shortcut: 'Ctrl + C',
    cardAccent: 'border-violet-200 hover:border-violet-300',
    numBg: 'bg-violet-100 text-violet-700',
    shortcutColor: 'text-violet-700',
  },
  {
    code: '04',
    name: 'Blok Paragraf',
    detail: 'Seleksi paragraf Informatika 2–3 kalimat tanpa terpotong.',
    shortcut: 'Blok Penuh',
    cardAccent: 'border-emerald-200 hover:border-emerald-300',
    numBg: 'bg-emerald-100 text-emerald-700',
    shortcutColor: 'text-emerald-700',
  },
  {
    code: '05',
    name: 'Copy + Paste',
    detail: 'Salin teks sasaran lalu tempel ke kotak jawaban.',
    shortcut: 'Ctrl + C → V',
    cardAccent: 'border-amber-200 hover:border-amber-300',
    numBg: 'bg-amber-100 text-amber-800',
    shortcutColor: 'text-amber-700',
  },
];

export function LandingPage({
  onStartSolo,
  onCreateRoom,
  onJoinGame,
  onOpenHowToPlay,
  onOpenLeaderboards,
  authState,
}: LandingPageProps) {
  const actionsDisabled = authState !== 'ready';

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-slate-900 arena-grid-bg relative overflow-x-hidden">
      {/* Soft pastel daylight ambient washes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/5 w-[500px] h-[420px] rounded-full bg-sky-200/50 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-24 right-1/6 w-[400px] h-[360px] rounded-full bg-amber-100/60 blur-[110px]"
      />

      {/* 3-Zone Top Bar */}
      <header className="relative z-10 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <span className="text-lg font-extrabold font-display tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            BLOK, COPY &amp; PASTE
          </span>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a
              href="#arena-skills"
              className="hover:text-sky-600 transition-colors whitespace-nowrap shrink-0"
            >
              Materi Tantangan
            </a>
            <button
              type="button"
              onClick={() => onOpenLeaderboards('solo')}
              className="hover:text-sky-600 transition-colors whitespace-nowrap shrink-0"
            >
              Leaderboard
            </button>
            <button
              type="button"
              onClick={onOpenHowToPlay}
              className="hover:text-sky-600 transition-colors whitespace-nowrap shrink-0"
            >
              Cara Bermain
            </button>
            <button
              type="button"
              onClick={onCreateRoom}
              disabled={actionsDisabled}
              className="hover:text-violet-600 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              Mode Guru
            </button>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenLeaderboards('solo')}
              className="md:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold whitespace-nowrap shrink-0"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Skor
            </button>
            <button
              type="button"
              onClick={onJoinGame}
              disabled={actionsDisabled}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold transition-all shadow-sm whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              Gabung Room
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Hero Copy & Mode Cards */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-sky-700">
              <Keyboard className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Game Edukasi Informatika SMP</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-amber-600">Mode Solo &amp; Multiplayer</span>
            </div>

            <div className="space-y-2.5">
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold font-display tracking-tight text-slate-900 leading-[1.08] [text-wrap:balance]">
                BLOK, COPY &amp; PASTE
              </h1>
              <p className="text-base sm:text-lg font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-600 to-violet-600">
                MASTER YOUR TEXT SKILLS
              </p>
            </div>

            <p className="text-base text-slate-600 leading-relaxed max-w-xl">
              Latih kecepatan dan ketelitianmu menguasai teknik blok, copy, dan paste dengan cara seru. Bermain mandiri untuk rekor pribadi atau berkompetisi bersama teman sekelas!
            </p>

            {/* Two Primary Game Mode Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* MODE 1: BERMAIN SOLO */}
              <div className="rounded-2xl bg-white border border-sky-200 hover:border-sky-300 p-5 flex flex-col justify-between gap-4 shadow-md shadow-sky-900/5 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-extrabold font-display tracking-tight text-slate-900">
                      BERMAIN SOLO
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Bermain sendiri tanpa room. Masukkan nama dan langsung bertanding mengejar skor tertinggi.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={onStartSolo}
                    disabled={actionsDisabled}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white font-bold text-sm shadow-md shadow-sky-500/20 transition-all whitespace-nowrap disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    MULAI BERMAIN SOLO
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenLeaderboards('solo')}
                    className="w-full inline-flex items-center justify-between px-3 py-2 rounded-xl bg-sky-50/70 hover:bg-sky-100/80 border border-sky-200/80 text-xs font-semibold text-sky-700 transition-colors"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      Leaderboard Solo
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* MODE 2: MULTIPLAYER */}
              <div className="rounded-2xl bg-white border border-violet-200 hover:border-violet-300 p-5 flex flex-col justify-between gap-4 shadow-md shadow-violet-900/5 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-extrabold font-display tracking-tight text-slate-900">
                      MULTIPLAYER
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Bermain bersama melalui room hingga 25 siswa dengan sinkronisasi dan leaderboard real-time.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={onJoinGame}
                      disabled={actionsDisabled}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-105 text-white font-bold text-xs sm:text-sm shadow-md shadow-violet-500/20 transition-all whitespace-nowrap disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                      JOIN GAME
                    </button>

                    <button
                      type="button"
                      onClick={onCreateRoom}
                      disabled={actionsDisabled}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-800 font-bold text-xs sm:text-sm transition-all whitespace-nowrap disabled:opacity-50"
                    >
                      <PlusSquare className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                      CREATE ROOM
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenLeaderboards('multiplayer')}
                    className="w-full inline-flex items-center justify-between px-3 py-2 rounded-xl bg-violet-50/70 hover:bg-violet-100/80 border border-violet-200/80 text-xs font-semibold text-violet-700 transition-colors"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      Leaderboard Multiplayer
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Secondary Utility Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onOpenHowToPlay}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-800 font-semibold text-sm transition-colors whitespace-nowrap shadow-xs"
              >
                <BookOpen className="w-4 h-4 text-amber-500" />
                HOW TO PLAY
              </button>

              <button
                type="button"
                onClick={() => onOpenLeaderboards('solo')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-semibold text-sm transition-colors whitespace-nowrap shadow-xs"
              >
                <Trophy className="w-4 h-4 text-amber-500" />
                PAPAN PERINGKAT SOLO &amp; MULTIPLAYER
              </button>
            </div>

            {/* Clean Unboxed Proof Metrics */}
            <div className="pt-3 border-t border-slate-200 grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Users className="w-3.5 h-3.5 text-sky-600" />
                  <span>Kapasitas Room</span>
                </div>
                <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                  25 Siswa
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <ClipboardCopy className="w-3.5 h-3.5 text-violet-600" />
                  <span>Tantangan</span>
                </div>
                <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                  5 Teknik
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>Skor per Kartu</span>
                </div>
                <p className="text-xl font-bold font-mono tabular-nums text-amber-600 mt-1">
                  10 × Lvl
                </p>
              </div>
            </div>
          </div>

          {/* Right Hero Bright Educational Illustration Showcase */}
          <div className="lg:col-span-5 flex">
            <div className="relative w-full rounded-2xl overflow-hidden border border-sky-200 bg-gradient-to-br from-sky-100 via-white to-emerald-50 p-6 shadow-xl shadow-sky-900/5 flex flex-col justify-between gap-6">
              {/* Cheerful Illustrated Keyboard + Mouse + Shortcut Keycaps */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Simulasi Keterampilan Teks</span>
                  <span className="font-mono text-sky-700">Ctrl + C / Ctrl + V</span>
                </div>

                {/* Illustrated Classroom Keycaps & Cursor Graphic */}
                <div className="rounded-2xl bg-white border border-sky-100 p-5 shadow-sm space-y-5">
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <div className="px-4 py-2.5 rounded-xl bg-slate-100 border-b-4 border-slate-300 text-slate-800 font-mono font-bold text-sm shadow-xs">
                      Ctrl
                    </div>
                    <span className="text-slate-400 font-bold">+</span>
                    <div className="px-4 py-2.5 rounded-xl bg-sky-100 border-b-4 border-sky-300 text-sky-800 font-mono font-bold text-sm shadow-xs">
                      C
                    </div>
                    <span className="text-slate-300 font-bold mx-1">→</span>
                    <div className="px-4 py-2.5 rounded-xl bg-slate-100 border-b-4 border-slate-300 text-slate-800 font-mono font-bold text-sm shadow-xs">
                      Ctrl
                    </div>
                    <span className="text-slate-400 font-bold">+</span>
                    <div className="px-4 py-2.5 rounded-xl bg-emerald-100 border-b-4 border-emerald-300 text-emerald-800 font-mono font-bold text-sm shadow-xs">
                      V
                    </div>
                  </div>

                  {/* Colorful Skill Chips Illustration */}
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="rounded-xl bg-sky-50 border border-sky-200 p-2.5">
                      <span className="block text-[11px] font-bold text-sky-700">
                        2× Klik
                      </span>
                      <span className="block text-[11px] text-slate-600 mt-0.5">
                        Blok Kata
                      </span>
                    </div>
                    <div className="rounded-xl bg-violet-50 border border-violet-200 p-2.5">
                      <span className="block text-[11px] font-bold text-violet-700">
                        Drag Teks
                      </span>
                      <span className="block text-[11px] text-slate-600 mt-0.5">
                        Blok Kalimat
                      </span>
                    </div>
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5">
                      <span className="block text-[11px] font-bold text-amber-700">
                        Tempel
                      </span>
                      <span className="block text-[11px] text-slate-600 mt-0.5">
                        Copy &amp; Paste
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Floating Challenge Preview Card */}
              <div className="rounded-2xl bg-white border border-sky-200 p-4 shadow-lg shadow-sky-900/5">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-700">
                    <MousePointer className="w-3.5 h-3.5 text-sky-600" />
                    <span>PRATINJAU KARTU · BLOK KATA</span>
                  </div>
                  <span className="text-xs font-mono font-bold tabular-nums text-amber-600">
                    +10 Poin
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
                  Mouse digunakan untuk{' '}
                  <mark className="px-1.5 py-0.5 rounded bg-sky-500 text-white font-semibold">
                    menggerakkan
                  </mark>{' '}
                  kursor.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Skill Strip */}
        <section id="arena-skills" className="mt-16 pt-10 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold font-display text-slate-900">
                Progresi Keterampilan Teks
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Setiap level membuka teknik seleksi dan penyalinan teks Informatika yang semakin menantang.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500">
              15 Tantangan / Level · Sinkron Real-Time
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {SKILL_MODULES.map((mod) => (
              <div
                key={mod.code}
                className={`rounded-2xl bg-white border ${mod.cardAccent} p-4 flex flex-col justify-between gap-3 shadow-sm transition-colors`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span className={`px-2 py-0.5 rounded-md ${mod.numBg}`}>
                      {mod.code}
                    </span>
                    <span className={mod.shortcutColor}>{mod.shortcut}</span>
                  </div>
                  <h3 className="text-base font-bold font-display text-slate-900">
                    {mod.name}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {mod.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
