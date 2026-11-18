import { useState } from 'react';
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
    accent: 'text-cyan-400',
  },
  {
    level: 'Level 1+',
    title: 'Blok Kalimat',
    desc: 'Drag kursor dari huruf pertama hingga tanda titik akhir kalimat target.',
    icon: Type,
    accent: 'text-blue-400',
  },
  {
    level: 'Level 2+',
    title: 'Copy',
    desc: 'Blok kata target lalu tekan Ctrl+C (atau klik kanan → Copy).',
    icon: Copy,
    accent: 'text-violet-400',
  },
  {
    level: 'Level 3+',
    title: 'Blok Paragraf',
    desc: 'Blok seluruh paragraf pendek (2–3 kalimat) secara lengkap.',
    icon: FileText,
    accent: 'text-emerald-400',
  },
  {
    level: 'Level 4+',
    title: 'Copy + Paste',
    desc: 'Blok kata target, tekan Ctrl+C, lalu Ctrl+V ke kotak jawaban.',
    icon: ClipboardCheck,
    accent: 'text-amber-400',
  },
];

export function HowToPlayModal({ open, onClose }: HowToPlayModalProps) {
  const [imgError, setImgError] = useState(false);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-to-play-title"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0C1328] border border-slate-700/60 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#0C1328]/95 backdrop-blur-md border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Keyboard className="w-5 h-5 text-cyan-400" />
            <h2 id="how-to-play-title" className="text-lg font-bold font-display text-white">
              Panduan Bermain — BLOK, COPY & PASTE
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Tutup panduan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            <div className="md:col-span-5 overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900 aspect-[4/3]">
              {!imgError ? (
                <img
                  src="/src/assets/images/tutorial_text_selection_1795003070264.jpg"
                  alt="Ilustrasi seleksi teks dan pintasan Ctrl+C serta Ctrl+V pada keyboard"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-br from-slate-900 to-blue-950/60 text-cyan-300">
                  <Keyboard className="w-10 h-10" />
                  <span className="text-xs font-mono">Ctrl+C · Ctrl+V · Blok Teks</span>
                </div>
              )}
            </div>

            <div className="md:col-span-7 space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>
                Guru membuka ruang permainan dan membagikan <strong className="text-white">6 karakter Kode Room</strong> di layar kelas. Maksimal 25 siswa dapat bergabung dan bersaing secara bersamaan.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                  <span>
                    <strong className="text-white">Arahkan kursor ke kartu</strong> untuk menghentikan gerak jatuh sementara saat kamu menyeleksi teks.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <span>
                    Setiap jawaban benar bernilai <strong className="text-amber-300 font-mono tabular-nums">10 × Level</strong> poin. Selesaikan 15 tantangan untuk naik level dan memulihkan 5 nyawa!
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                  <span>
                    Jawaban salah hanya menggoyangkan kartu (tidak mengurangi nyawa), namun kartu yang jatuh melewati batas bawah mengurangi 1 nyawa.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">
              5 Jenis Tantangan Keterampilan Teks
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CHALLENGE_GUIDES.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800"
                  >
                    <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${item.accent}`} />
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-semibold text-slate-100 text-sm">
                          {item.title}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{item.level}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm transition-all whitespace-nowrap"
          >
            Siap Bermain
          </button>
        </div>
      </div>
    </div>
  );
}
