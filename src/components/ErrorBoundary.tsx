import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Terjadi kesalahan pada aplikasi.',
    };
  }

  render() {
    if (this.state.hasError) {
      let friendlyMessage = this.state.message;
      try {
        const parsed = JSON.parse(this.state.message);
        if (parsed && parsed.error) {
          friendlyMessage = `Sinkronisasi database gagal (${parsed.operationType}): ${parsed.error}`;
        }
      } catch {
        // Keep raw message
      }

      return (
        <div className="min-h-screen bg-[#F5F9FF] text-slate-900 flex items-center justify-center p-6 arena-grid-bg">
          <div className="max-w-lg w-full rounded-2xl bg-white border border-rose-200 p-8 shadow-xl shadow-slate-900/5">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <h2 className="text-xl font-bold font-display text-slate-900">
                Koneksi Arena Terganggu
              </h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-6 break-words">
              {friendlyMessage}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-colors whitespace-nowrap shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Muat Ulang Arena
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
