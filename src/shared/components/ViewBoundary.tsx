import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, LoaderCircle, RefreshCw } from 'lucide-react';

export function ViewLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-64 rounded-2xl border border-slate-200 bg-white flex flex-col items-center justify-center gap-3 text-slate-500"
    >
      <LoaderCircle className="h-7 w-7 animate-spin text-indigo-600" aria-hidden="true" />
      <span className="text-xs font-bold">Memuat modul HouseERP…</span>
    </div>
  );
}

interface ViewErrorBoundaryProps {
  children: ReactNode;
  viewName: string;
}

interface ViewErrorBoundaryState {
  error: Error | null;
}

export class ViewErrorBoundary extends Component<ViewErrorBoundaryProps, ViewErrorBoundaryState> {
  state: ViewErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ViewErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`HouseERP view failed: ${this.props.viewName}`, error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        className="min-h-64 rounded-2xl border border-rose-200 bg-rose-50 px-6 flex flex-col items-center justify-center gap-3 text-center"
      >
        <AlertTriangle className="h-8 w-8 text-rose-600" aria-hidden="true" />
        <div>
          <h2 className="font-extrabold text-rose-900">Modul gagal dimuat</h2>
          <p className="mt-1 max-w-lg text-xs text-rose-700">
            {this.props.viewName} mengalami kesalahan. Data Anda tidak diubah oleh tampilan yang gagal ini.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-1 inline-flex items-center gap-2 rounded-lg bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Muat ulang aplikasi
        </button>
      </div>
    );
  }
}
