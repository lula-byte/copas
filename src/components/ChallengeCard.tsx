import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileText,
  MousePointerClick,
  PauseCircle,
  Type,
} from 'lucide-react';
import type { ActiveChallengeCard, ChallengeType } from '../types/game';

interface ChallengeCardProps {
  card: ActiveChallengeCard;
  isPaused: boolean;
  onPauseChange: (cardId: string, paused: boolean) => void;
  onSuccess: (cardId: string) => void;
  onWrongAttempt: () => void;
}

const CARD_STYLES: Record<
  ChallengeType,
  {
    border: string;
    glow: string;
    badgeText: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  BLOK_KATA: {
    border: 'border-cyan-400/50',
    glow: 'shadow-cyan-950/60',
    badgeText: 'text-cyan-300',
    icon: MousePointerClick,
  },
  BLOK_KALIMAT: {
    border: 'border-blue-400/55',
    glow: 'shadow-blue-950/60',
    badgeText: 'text-blue-300',
    icon: Type,
  },
  COPY: {
    border: 'border-violet-400/55',
    glow: 'shadow-violet-950/60',
    badgeText: 'text-violet-300',
    icon: Copy,
  },
  BLOK_PARAGRAF: {
    border: 'border-emerald-400/55',
    glow: 'shadow-emerald-950/60',
    badgeText: 'text-emerald-300',
    icon: FileText,
  },
  COPY_PASTE: {
    border: 'border-amber-400/60',
    glow: 'shadow-amber-950/50',
    badgeText: 'text-amber-300',
    icon: ClipboardCheck,
  },
};

function normalizeWhitespace(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

function stripTrailingPunctuation(word: string): string {
  return word.trim().replace(/[.,!?;:"'()]+$/g, '').replace(/^[.,!?;:"'()]+/g, '');
}

export function ChallengeCard({
  card,
  isPaused,
  onPauseChange,
  onSuccess,
  onWrongAttempt,
}: ChallengeCardProps) {
  const [shaking, setShaking] = useState(false);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pasteValue, setPasteValue] = useState('');
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const resolvedRef = useRef(false);

  const style = CARD_STYLES[card.type];
  const Icon = style.icon;

  const triggerWrong = (message: string) => {
    if (resolvedRef.current) return;
    setFeedback(message);
    setShaking(true);
    onWrongAttempt();
    window.setTimeout(() => setShaking(false), 380);
    window.setTimeout(() => {
      setFeedback((curr) => (curr === message ? null : curr));
    }, 1800);
  };

  const triggerSuccess = () => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    setSolved(true);
    setFeedback('Tepat! +Poin');
    window.getSelection()?.removeAllRanges();
    window.setTimeout(() => {
      onSuccess(card.id);
    }, 220);
  };

  const getSelectedInsideCard = (): string => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return '';
    const text = sel.toString();
    if (!text.trim()) return '';
    // Ensure selection actually belongs to this card's text container
    if (textContainerRef.current) {
      const anchor = sel.anchorNode;
      if (anchor && !textContainerRef.current.contains(anchor)) {
        return '';
      }
    }
    return normalizeWhitespace(text);
  };

  const handleDoubleClick = () => {
    if (card.type !== 'BLOK_KATA' || resolvedRef.current) return;
    const rawSelected = getSelectedInsideCard();
    if (!rawSelected) return;

    const cleanedSelected = stripTrailingPunctuation(rawSelected);
    const cleanedTarget = stripTrailingPunctuation(card.target);

    if (cleanedSelected === cleanedTarget) {
      triggerSuccess();
    } else {
      window.getSelection()?.removeAllRanges();
      triggerWrong(`Belum tepat. Target kata: "${card.target}"`);
    }
  };

  const handleMouseUp = () => {
    if (resolvedRef.current) return;
    const selected = getSelectedInsideCard();
    if (!selected) return;

    if (card.type === 'BLOK_KATA') {
      // Also allow precise drag-selecting the single word
      const cleaned = stripTrailingPunctuation(selected);
      if (cleaned === stripTrailingPunctuation(card.target)) {
        triggerSuccess();
      }
      return;
    }

    if (card.type === 'BLOK_KALIMAT') {
      const targetNorm = normalizeWhitespace(card.target);
      if (selected === targetNorm) {
        triggerSuccess();
      } else if (
        selected === targetNorm.replace(/\.$/, '') &&
        targetNorm.endsWith('.')
      ) {
        triggerWrong('Hampir benar! Pastikan tanda titik di akhir kalimat ikut terblok.');
      } else if (selected.length >= 6) {
        triggerWrong('Kalimat yang diblok belum sesuai target.');
      }
      return;
    }

    if (card.type === 'BLOK_PARAGRAF') {
      const targetNorm = normalizeWhitespace(card.target);
      if (selected === targetNorm) {
        triggerSuccess();
      } else if (selected.length >= 10) {
        triggerWrong('Blok seluruh paragraf dari kata awal hingga akhir!');
      }
    }
  };

  const handleCopyEvent = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (resolvedRef.current) return;
    const selected = getSelectedInsideCard();

    if (card.type === 'COPY') {
      e.preventDefault();
      if (!selected) {
        triggerWrong('Blok kata target terlebih dahulu sebelum Copy!');
        return;
      }
      const cleaned = stripTrailingPunctuation(selected);
      const targetClean = stripTrailingPunctuation(card.target);
      e.clipboardData.setData('text/plain', cleaned);
      if (cleaned === targetClean) {
        triggerSuccess();
      } else {
        triggerWrong(`Teks yang disalin ("${cleaned}") belum sesuai target!`);
      }
      return;
    }

    if (card.type === 'COPY_PASTE') {
      // Allow native/controlled copy into clipboard and give subtle confirmation
      if (selected) {
        const cleaned = stripTrailingPunctuation(selected);
        e.clipboardData.setData('text/plain', cleaned);
        e.preventDefault();
        setFeedback('Tersalin! Sekarang Paste (Ctrl+V) ke kotak jawaban.');
      }
    }
  };

  const handleKeyDownOnText = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
      const selected = getSelectedInsideCard();
      if (card.type === 'COPY' && selected) {
        const cleaned = stripTrailingPunctuation(selected);
        if (cleaned === stripTrailingPunctuation(card.target)) {
          navigator.clipboard?.writeText(cleaned).catch(() => {});
          triggerSuccess();
        } else {
          triggerWrong(`Teks yang disalin ("${cleaned}") belum sesuai target!`);
        }
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (card.type !== 'COPY_PASTE' || resolvedRef.current) return;
    e.preventDefault();
    const pasted = normalizeWhitespace(e.clipboardData.getData('text/plain'));
    setPasteValue(pasted);

    const cleanedPasted = stripTrailingPunctuation(pasted);
    const cleanedTarget = stripTrailingPunctuation(card.target);

    if (cleanedPasted === cleanedTarget) {
      triggerSuccess();
    } else {
      triggerWrong(
        pasted
          ? `Teks tempelan ("${pasted}") belum sesuai target!`
          : 'Clipboard kosong. Blok dan Copy kata target dahulu.'
      );
      window.setTimeout(() => setPasteValue(''), 600);
    }
  };

  const handlePasteInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isPasteShortcut =
      (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v';
    const isCopyShortcut =
      (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c';
    const allowedKeys = ['Tab', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight'];
    if (isPasteShortcut || isCopyShortcut || allowedKeys.includes(e.key)) {
      return;
    }
    e.preventDefault();
    setFeedback('Gunakan Paste (Ctrl+V atau klik kanan → Tempel), bukan diketik manual.');
  };

  return (
    <div
      style={{
        left: `${card.xPercent}%`,
        width: `${card.widthPx}px`,
        transform: `translate3d(0, ${card.yPx}px, 0)`,
      }}
      onMouseEnter={() => onPauseChange(card.id, true)}
      onMouseLeave={() => onPauseChange(card.id, false)}
      onFocus={() => onPauseChange(card.id, true)}
      onBlur={() => onPauseChange(card.id, false)}
      className={`absolute top-0 z-10 will-change-transform transition-opacity duration-200 ${
        solved ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div
        className={`rounded-2xl bg-[#0D152E]/95 backdrop-blur-xl border ${style.border} p-4 shadow-2xl ${style.glow} ${
          shaking ? 'animate-card-shake border-rose-500' : ''
        } ${solved ? 'border-emerald-400 bg-emerald-950/60' : ''}`}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className={`flex items-center gap-1.5 text-xs font-bold ${style.badgeText}`}>
            <Icon className="w-4 h-4 shrink-0" />
            <span>{card.title}</span>
          </div>
          {isPaused && !solved && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-200">
              <PauseCircle className="w-3.5 h-3.5 text-cyan-400" />
              Berhenti sejenak
            </span>
          )}
          {solved && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Benar!
            </span>
          )}
        </div>

        {/* Instruction */}
        <p className="text-xs text-slate-400 mb-2.5 leading-snug">
          {card.instruction}
        </p>

        {/* Target Cue (for word / sentence / copy / copy-paste) */}
        {card.type !== 'BLOK_PARAGRAF' && (
          <div className="mb-2.5 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
            <span className="text-slate-400">Target: </span>
            <span className="font-semibold text-amber-300 select-none">
              {card.target}
            </span>
          </div>
        )}

        {/* Selectable Text Area */}
        <div
          ref={textContainerRef}
          tabIndex={0}
          onDoubleClick={handleDoubleClick}
          onMouseUp={handleMouseUp}
          onCopy={handleCopyEvent}
          onKeyDown={handleKeyDownOnText}
          className="challenge-selectable rounded-xl bg-slate-950/90 border border-slate-700/70 px-3.5 py-3 text-sm sm:text-[15px] text-white leading-relaxed select-text cursor-text focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
        >
          {card.text}
        </div>

        {/* Paste Box for COPY + PASTE */}
        {card.type === 'COPY_PASTE' && (
          <div className="mt-3">
            <input
              type="text"
              value={pasteValue}
              onChange={() => {}}
              onPaste={handlePaste}
              onKeyDown={handlePasteInputKeyDown}
              placeholder="Klik di sini, lalu Paste (Ctrl+V)..."
              aria-label="Kotak jawaban untuk menempel teks yang disalin"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-400/50 text-sm text-amber-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/70"
            />
          </div>
        )}

        {/* Brief Feedback */}
        {feedback && (
          <p
            className={`mt-2 text-xs font-medium ${
              solved
                ? 'text-emerald-300'
                : feedback.startsWith('Tersalin!')
                  ? 'text-cyan-300'
                  : 'text-rose-300'
            }`}
          >
            {feedback}
          </p>
        )}
      </div>
    </div>
  );
}
