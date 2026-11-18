import React, { useState } from 'react';
import { ArrowLeft, LogIn, Users } from 'lucide-react';
import { joinRoom, RoomActionError } from '../services/roomManager';

interface JoinRoomViewProps {
  onBack: () => void;
  onJoined: (roomCode: string) => void;
}

export function JoinRoomView({ onBack, onJoined }: JoinRoomViewProps) {
  const [roomCode, setRoomCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedCode = roomCode.trim().toUpperCase();
    const cleanedName = studentName.trim();

    if (cleanedCode.length !== 6 || !/^[A-Z0-9]{6}$/.test(cleanedCode)) {
      setError('Kode room harus berupa 6 karakter huruf atau angka.');
      return;
    }
    if (!cleanedName) {
      setError('Nama siswa wajib diisi.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await joinRoom(cleanedCode, cleanedName);
      onJoined(result.roomCode);
    } catch (err) {
      if (err instanceof RoomActionError) {
        setError(err.message);
      } else {
        setError('Gagal bergabung ke room. Periksa koneksi Anda dan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060A17] text-slate-100 arena-grid-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 right-1/4 w-[420px] h-[420px] rounded-full bg-cyan-500/15 blur-[130px]"
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
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
              <Users className="w-4 h-4" />
              <span>MASUK ARENA SISWA</span>
            </div>
            <h1 className="text-3xl font-bold font-display text-white">
              Gabung ke Room
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Masukkan 6 karakter Kode Room yang tampil di layar guru dan ketik namamu tanpa perlu login email.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="room-code-input"
                className="block text-xs font-semibold text-slate-300 mb-2"
              >
                ROOM CODE (6 Karakter)
              </label>
              <input
                id="room-code-input"
                type="text"
                maxLength={6}
                value={roomCode}
                onChange={(e) =>
                  setRoomCode(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                  )
                }
                placeholder="MISAL: A7K9P2"
                autoFocus
                className="w-full px-4 py-3.5 rounded-xl bg-slate-950/90 border border-slate-700 text-cyan-300 placeholder-slate-600 font-mono text-xl font-bold tracking-[0.28em] text-center uppercase focus:outline-none focus:ring-2 focus:ring-cyan-500/70 focus:border-cyan-400 transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="student-name-input"
                className="block text-xs font-semibold text-slate-300 mb-2"
              >
                NAMA SISWA
              </label>
              <input
                id="student-name-input"
                type="text"
                maxLength={30}
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Contoh: Nadia Putri"
                className="w-full px-4 py-3.5 rounded-xl bg-slate-950/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/70 focus:border-cyan-400 transition-all"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl bg-rose-950/70 border border-rose-500/45 px-4 py-3 text-sm text-rose-200 leading-relaxed"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white font-bold text-sm shadow-lg shadow-cyan-950/50 transition-all disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Menghubungkan ke Room...' : 'JOIN GAME'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
