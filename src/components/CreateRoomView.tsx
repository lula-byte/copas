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
    <div className="min-h-screen bg-[#060A17] text-slate-100 arena-grid-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/4 left-1/3 w-[440px] h-[440px] rounded-full bg-violet-600/15 blur-[130px]"
      />

      <div className="relative z-10 w-full max-w-lg">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </button>

        <div className="rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 p-8 shadow-2xl space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-300">
              <MonitorPlay className="w-4 h-4" />
              <span>MODE GURU / HOST</span>
            </div>
            <h1 className="text-3xl font-bold font-display text-white">
              Buat Ruang Permainan
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Sistem akan menghasilkan kode unik 6 karakter yang dapat ditampilkan di proyektor untuk hingga 25 siswa.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="host-name-input"
                className="block text-xs font-semibold text-slate-300 mb-2"
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
                className="w-full px-4 py-3.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/70 focus:border-violet-400 transition-all"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl bg-rose-950/60 border border-rose-500/40 px-4 py-3 text-sm text-rose-200"
              >
                {error}
              </div>
            )}

            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 flex items-start gap-3 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
              <span>
                Host bertugas mengendalikan awal dan akhir permainan, memantau leaderboard kelas, dan tidak dihitung sebagai peserta skor.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 hover:brightness-110 text-white font-bold text-sm shadow-lg shadow-blue-950/50 transition-all disabled:opacity-60"
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
