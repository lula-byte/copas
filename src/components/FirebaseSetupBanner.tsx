import { AlertCircle, ExternalLink, KeyRound, RefreshCw } from 'lucide-react';
import { firebaseProjectId } from '../services/firebaseService';
import type { AuthReadyState } from '../types/game';

interface FirebaseSetupBannerProps {
  authState: AuthReadyState;
  errorMessage: string | null;
  onRetry: () => void;
  onGoogleSignIn: () => void;
  signingInGoogle: boolean;
}

export function FirebaseSetupBanner({
  authState,
  errorMessage,
  onRetry,
  onGoogleSignIn,
  signingInGoogle,
}: FirebaseSetupBannerProps) {
  if (authState === 'ready' || authState === 'initializing') {
    return null;
  }

  const providersUrl = firebaseProjectId
    ? `https://console.firebase.google.com/project/${firebaseProjectId}/authentication/providers`
    : 'https://console.firebase.google.com/';

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-4">
      <div className="rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-amber-500/40 p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-amber-300 font-semibold text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>
                {authState === 'anonymous_disabled'
                  ? 'Aktifkan Anonymous Authentication di Firebase Console'
                  : 'Konfigurasi Firebase Diperlukan'}
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              {authState === 'anonymous_disabled'
                ? `Proyek Firebase (${firebaseProjectId}) sudah terhubung, tetapi provider Anonymous Sign-In belum diaktifkan sehingga siswa belum dapat bergabung tanpa akun. Aktifkan "Anonymous" pada menu Authentication → Sign-in method, atau masuk sementara menggunakan Google.`
                : errorMessage ||
                  'Pastikan firebase-applet-config.json berisi kredensial proyek Firebase yang valid.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {authState === 'anonymous_disabled' && (
              <>
                <a
                  href={providersUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600/60 text-slate-100 text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  Buka Firebase Console
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  disabled={signingInGoogle}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors whitespace-nowrap disabled:opacity-60"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {signingInGoogle ? 'Menghubungkan...' : 'Masuk via Google'}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
