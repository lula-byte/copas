import React, { useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Heart,
  Play,
  Trophy,
  User,
} from 'lucide-react';
import { AVATAR_COLORS } from '../services/roomManager';

interface SoloSetupViewProps {
  initialName?: string;
  onBack: () => void;
  onStartSolo: (playerName: string, avatarColor: string) => void;
  onOpenSoloLeaderboard: () => void;
}

export function SoloSetupView({
  initialName = '',
  onBack,
  onStartSolo,
  onOpenSoloLeaderboard,
}: SoloSetupViewProps) {
  const [playerName, setPlayerName] = useState(initialName);
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = playerName.trim().slice(0, 30);
    if (!cleaned) {
      setError('Nama pemain wajib diisi sebelum memulai permainan.');
      return;
    }
    setError(null);
    onStartSolo(cleaned, selectedColor);
  };

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-slate-900 arena-grid-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/4 left-1/4 w-[420px] h-[420px] rounded-full bg-sky-200/50 blur-[110px]"
      />

      <div className="relative z-10 w-full max-w-lg">
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </button>

          <button
            type="button"
            onClick={onOpenSoloLeaderboard}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-600 transition-colors"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            Leaderboard Solo
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-sky-200 p-8 shadow-xl shadow-sky-900/5 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-700">
              <User className="w-4 h-4 text-sky-600" />
              <span>MODE SOLO · LATIHAN MANDIRI</span>
            </div>
            <h1 className="text-3xl font-bold font-display text-slate-900">
              Mulai Bermain Solo
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Latih kecepatan blok, copy, dan paste tanpa perlu kode room. Cukup masukkan namamu dan langsung masuk ke arena!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="solo-name-input"
                className="block text-xs font-bold text-slate-700 mb-2"
              >
                NAMA PEMAIN
              </label>
              <input
                id="solo-name-input"
                type="text"
                maxLength={30}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Contoh: Raka Pratama"
                autoFocus
                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all"
              />
            </div>

            <div>
              <span className="block text-xs font-bold text-slate-700 mb-2">
                WARNA AVATAR
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                {AVATAR_COLORS.map((color) => {
                  const active = color === selectedColor;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      aria-label={`Pilih warna ${color}`}
                      className={`w-8 h-8 rounded-lg transition-transform shadow-xs ${
                        active
                          ? 'ring-2 ring-slate-900 ring-offset-2 ring-offset-white scale-110'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  );
                })}
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700"
              >
                {error}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 rounded-xl bg-sky-50/70 border border-sky-100 p-3.5 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-500">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Nyawa</span>
                </div>
                <p className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  5 Nyawa
                </p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  <span>Timer</span>
                </div>
                <p className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  Aktif
                </p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-500">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>Skor</span>
                </div>
                <p className="text-sm font-bold font-mono tabular-nums text-amber-700 mt-0.5">
                  Solo Board
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white font-bold text-sm shadow-md shadow-sky-500/20 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              MULAI BERMAIN SOLO
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
