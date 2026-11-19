import {
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileText,
  Keyboard,
  MousePointerClick,
  Type,
  X,
} from 'lucide-react';

interface HowToPlayModalProps {
  open: boolean;
  onClose: () => void;
}

const CHALLENGE_GUIDES = [
  {
    level: 'Level 1+',
    title: 'Blok Kata',
    desc: 'Double-click tepat pada kata target di dalam kalimat.',
    icon: MousePointerClick,
    accent: 'text-sky-600',
    cardBg: 'bg-sky-50/70 border-sky-200',
  },
  {
    level: 'Level 1+',
    title: 'Blok Kalimat',
    desc: 'Drag kursor dari huruf pertama hingga tanda titik akhir kalimat target.',
    icon: Type,
    accent: 'text-blue-600',
    cardBg: 'bg-blue-50/70 border-blue-200',
  },
  {
    level: 'Level 2+',
    title: 'Copy',
    desc: 'Blok kata target lalu tekan Ctrl+C (atau klik kanan → Copy).',
    icon: Copy,
    accent: 'text-violet-600',
    cardBg: 'bg-violet-50/70 border-violet-200',
  },
  {
    level: 'Level 3+',
    title: 'Blok Paragraf',
    desc: 'Blok seluruh paragraf pendek (2–3 kalimat) secara lengkap.',
    icon: FileText,
    accent: 'text-emerald-600',
    cardBg: 'bg-emerald-50/70 border-emerald-200',
  },
  {
    level: 'Level 4+',
    title: 'Copy + Paste',
    desc: 'Blok kata target, tekan Ctrl+C, lalu Ctrl+V ke kotak jawaban.',
    icon: ClipboardCheck,
    accent: 'text-amber-600',
    cardBg: 'bg-amber-50/70 border-amber-200',
  },
];

export function HowToPlayModal({ open, onClose }: HowToPlayModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-to-play-title"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-md border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <Keyboard className="w-5 h-5" />
            </div>
            <h2
              id="how-to-play-title"
              className="text-lg font-bold font-display text-slate-900"
            >
              Panduan Bermain — BLOK, COPY &amp; PASTE
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Tutup panduan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Bright Educational Vector Illustration */}
            <div className="md:col-span-5 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-amber-50 p-5 flex flex-col items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-white border-b-4 border-slate-300 text-xs font-mono font-bold text-slate-800 shadow-xs">
                  Ctrl
                </span>
                <span className="text-slate-400 font-bold">+</span>
                <span className="px-3 py-1.5 rounded-lg bg-sky-100 border-b-4 border-sky-300 text-xs font-mono font-bold text-sky-800 shadow-xs">
                  C
                </span>
                <span className="text-slate-400 font-bold">/</span>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-100 border-b-4 border-emerald-300 text-xs font-mono font-bold text-emerald-800 shadow-xs">
                  V
                </span>
              </div>
              <div className="w-full rounded-xl bg-white border border-slate-200 p-3 text-xs text-slate-700 leading-relaxed shadow-xs">
                Klik dua kali pada kata{' '}
                <mark className="px-1.5 py-0.5 rounded bg-sky-500 text-white font-semibold">
                  Informatika
                </mark>{' '}
                lalu salin!
              </div>
              <span className="text-[11px] font-semibold text-sky-700">
                Gunakan Mouse &amp; Pintasan Keyboard
              </span>
            </div>

            <div className="md:col-span-7 space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                Pilih <strong className="text-slate-900">Mode Solo</strong> untuk berlatih langsung, atau <strong className="text-slate-900">Mode Multiplayer</strong> menggunakan <strong className="text-sky-700">6 karakter Kode Room</strong> dari guru hingga 25 siswa.
              </p>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
                  <span>
                    <strong className="text-slate-900">Arahkan kursor ke kartu</strong> untuk menghentikan gerak jatuh sementara saat kamu menyeleksi teks.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <span>
                    Setiap jawaban benar bernilai <strong className="text-amber-700 font-mono tabular-nums">10 × Level</strong> poin. Selesaikan 15 tantangan untuk naik level dan memulihkan 5 nyawa!
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  <span>
                    Jawaban salah hanya menggoyangkan kartu (tidak mengurangi nyawa), namun kartu yang jatuh melewati batas bawah mengurangi 1 nyawa.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              5 Jenis Tantangan Keterampilan Teks
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CHALLENGE_GUIDES.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border ${item.cardBg}`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${item.accent}`} />
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-bold text-slate-900 text-sm">
                          {item.title}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono font-semibold">{item.level}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white font-bold text-sm transition-all whitespace-nowrap shadow-sm"
          >
            Siap Bermain
          </button>
        </div>
      </div>
    </div>
  );
}
