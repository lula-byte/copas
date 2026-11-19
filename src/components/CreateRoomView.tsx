import React, { useState } from 'react';
import { ArrowLeft, MonitorPlay, ShieldCheck, Sparkles } from 'lucide-react';
import { createRoom, RoomActionError } from '../services/roomManager';

interface CreateRoomViewProps {
  onBack: () => void;
  onRoomCreated: (roomCode: string) => void;
}

export function CreateRoomView({ onBack, onRoomCreated }: CreateRoomViewProps) {
  const [hostName, setHostName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = hostName.trim();
    if (!trimmed) {
      setError('Nama guru atau host wajib diisi.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const code = await createRoom(trimmed);
      onRoomCreated(code);
    } catch (err) {
      if (err instanceof RoomActionError) {
        setError(err.message);
      } else {
        setError('Gagal membuat room. Periksa koneksi Firebase Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-slate-900 arena-grid-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/4 left-1/3 w-[440px] h-[440px] rounded-full bg-violet-200/45 blur-[110px]"
      />

      <div className="relative z-10 w-full max-w-lg">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </button>

        <div className="rounded-2xl bg-white border border-violet-200 p-8 shadow-xl shadow-violet-900/5 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-violet-700">
              <MonitorPlay className="w-4 h-4 text-violet-600" />
              <span>MODE GURU / HOST</span>
            </div>
            <h1 className="text-3xl font-bold font-display text-slate-900">
              Buat Ruang Permainan
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sistem akan menghasilkan kode unik 6 karakter yang dapat ditampilkan di proyektor untuk hingga 25 siswa.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="host-name-input"
                className="block text-xs font-bold text-slate-700 mb-2"
              >
                Nama Guru / Host
              </label>
              <input
                id="host-name-input"
                type="text"
                maxLength={40}
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Contoh: Pak Budi · Lab Komputer 1"
                autoFocus
                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700"
              >
                {error}
              </div>
            )}

            <div className="rounded-xl bg-violet-50/70 border border-violet-100 p-4 flex items-start gap-3 text-xs text-slate-700">
              <ShieldCheck className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
              <span>
                Host bertugas mengendalikan awal dan akhir permainan, memantau leaderboard kelas, dan tidak dihitung sebagai peserta skor.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-105 text-white font-bold text-sm shadow-md shadow-violet-500/20 transition-all disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Membuat Room...' : 'Buat Room Sekarang'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
