import { useState } from 'react';
import {
  BookOpen,
  ClipboardCopy,
  Keyboard,
  MousePointer,
  Play,
  PlusSquare,
  Trophy,
  Users,
} from 'lucide-react';
import type { AuthReadyState } from '../types/game';

interface LandingPageProps {
  onCreateRoom: () => void;
  onJoinGame: () => void;
  onOpenHowToPlay: () => void;
  authState: AuthReadyState;
}

const SKILL_MODULES = [
  {
    code: '01',
    name: 'Blok Kata',
    detail: 'Double-click kata target dengan presisi tinggi.',
    shortcut: '2× Klik',
  },
  {
    code: '02',
    name: 'Blok Kalimat',
    detail: 'Drag seleksi kalimat utuh sampai tanda titik.',
    shortcut: 'Drag Seleksi',
  },
  {
    code: '03',
    name: 'Copy Teks',
    detail: 'Salin kata sasaran langsung ke clipboard komputer.',
    shortcut: 'Ctrl + C',
  },
  {
    code: '04',
    name: 'Blok Paragraf',
    detail: 'Seleksi paragraf Informatika 2–3 kalimat tanpa terpotong.',
    shortcut: 'Blok Penuh',
  },
  {
    code: '05',
    name: 'Copy + Paste',
    detail: 'Salin teks sasaran lalu tempel ke kotak jawaban.',
    shortcut: 'Ctrl + C → V',
  },
];

export function LandingPage({
  onCreateRoom,
  onJoinGame,
  onOpenHowToPlay,
  authState,
}: LandingPageProps) {
  const [heroImgError, setHeroImgError] = useState(false);
  const actionsDisabled = authState !== 'ready';

  return (
    <div className="min-h-screen bg-[#060A17] text-slate-100 arena-grid-bg relative overflow-x-hidden">
      {/* Subtle ambient light gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/4 w-[540px] h-[540px] rounded-full bg-blue-600/15 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-32 right-1/5 w-[420px] h-[420px] rounded-full bg-violet-600/12 blur-[130px]"
      />

      {/* 3-Zone Top Bar */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-8 border-b border-slate-800/70">
        <span className="text-lg font-bold font-display tracking-tight text-white whitespace-nowrap shrink-0">
          BLOK, COPY &amp; PASTE
        </span>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a
            href="#arena-skills"
            className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0"
          >
            Materi Tantangan
          </a>
          <button
            type="button"
            onClick={onOpenHowToPlay}
            className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0"
          >
            Cara Bermain
          </button>
          <button
            type="button"
            onClick={onCreateRoom}
            disabled={actionsDisabled}
            className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            Mode Guru
          </button>
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={onJoinGame}
            disabled={actionsDisabled}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-900/30 whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            Gabung Room
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Hero Copy & Actions */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <div className="flex items-center gap-2.5 text-sm font-medium text-cyan-300">
              <Keyboard className="w-4 h-4 shrink-0" />
              <span>Arena Pembelajaran Informatika SMP</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className="text-amber-300 font-semibold">Hingga 25 Siswa</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold font-display tracking-tight text-white leading-[1.08] [text-wrap:balance]">
                BLOK, COPY &amp; PASTE
              </h1>
              <p className="text-base sm:text-lg font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400">
                MASTER YOUR TEXT SKILLS
              </p>
            </div>

            <p className="text-base text-slate-300 leading-relaxed max-w-xl">
              Tantang kecepatan dan ketelitianmu dalam menguasai teknik blok, copy, dan paste. Bersaing dengan teman sekelas, kumpulkan poin, dan jadilah juara!
            </p>

            {/* Primary Action Cluster */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={onJoinGame}
                disabled={actionsDisabled}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-cyan-950/50 transition-all whitespace-nowrap disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                JOIN GAME
              </button>

              <button
                type="button"
                onClick={onCreateRoom}
                disabled={actionsDisabled}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-600/70 text-white font-semibold text-sm transition-all whitespace-nowrap disabled:opacity-50"
              >
                <PlusSquare className="w-4 h-4 text-violet-400" />
                CREATE ROOM
              </button>

              <button
                type="button"
                onClick={onOpenHowToPlay}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-transparent hover:bg-slate-800/60 border border-slate-700/70 text-slate-200 font-medium text-sm transition-colors whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                HOW TO PLAY
              </button>
            </div>

            {/* Clean Unboxed Proof Metrics */}
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Kapasitas Room</span>
                </div>
                <p className="text-xl font-bold font-mono tabular-nums text-white mt-1">
                  25 Siswa
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <ClipboardCopy className="w-3.5 h-3.5 text-violet-400" />
                  <span>Tantangan</span>
                </div>
                <p className="text-xl font-bold font-mono tabular-nums text-white mt-1">
                  5 Teknik
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Skor per Kartu</span>
                </div>
                <p className="text-xl font-bold font-mono tabular-nums text-amber-300 mt-1">
                  10 × Lvl
                </p>
              </div>
            </div>
          </div>

          {/* Right Hero Visual Showcase */}
          <div className="lg:col-span-6 flex">
            <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-900/70 backdrop-blur-xl shadow-2xl flex flex-col">
              <div className="relative flex-1 min-h-[300px] sm:min-h-[360px]">
                {!heroImgError ? (
                  <img
                    src="/src/assets/images/hero_arena_keyboard_1795003069930.jpg"
                    alt="Ilustrasi workstation digital classroom dengan keyboard bercahaya, kursor, dan kartu teks melayang"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950/60 to-violet-950/60 p-8">
                    <Keyboard className="w-20 h-20 text-cyan-400/70" />
                  </div>
                )}

                {/* Subtle bottom scrim */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#060A17] via-[#060A17]/25 to-transparent"
                />

                {/* Interactive Floating Challenge Preview Card */}
                <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 rounded-xl bg-slate-950/85 backdrop-blur-xl border border-cyan-400/40 p-4 shadow-2xl">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                      <MousePointer className="w-3.5 h-3.5" />
                      <span>PRATINJAU KARTU · BLOK KATA</span>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-amber-300">
                      +10 Poin
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    Mouse digunakan untuk{' '}
                    <mark className="px-1.5 py-0.5 rounded bg-cyan-400/30 text-cyan-100 border border-cyan-400/50">
                      menggerakkan
                    </mark>{' '}
                    kursor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Skill Strip */}
        <section id="arena-skills" className="mt-16 pt-10 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold font-display text-white">
                Progresi Keterampilan Teks
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Setiap level membuka teknik seleksi dan penyalinan teks Informatika yang semakin menantang.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              15 Tantangan / Level · Sinkron Real-Time
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {SKILL_MODULES.map((mod) => (
              <div
                key={mod.code}
                className="rounded-xl bg-slate-900/65 backdrop-blur-md border border-slate-800 p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>{mod.code}</span>
                    <span className="text-cyan-300">{mod.shortcut}</span>
                  </div>
                  <h3 className="text-base font-bold font-display text-white">
                    {mod.name}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
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
