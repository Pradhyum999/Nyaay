import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto my-12 rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-3">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-base font-bold text-white mb-1">
            {this.props.fallbackTitle || 'Something went wrong'}
          </h2>
          <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
            {this.state.error?.message || 'A temporary display error occurred while rendering this section.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                if (this.props.onReset) this.props.onReset();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition"
            >
              <RefreshCw size={13} /> Try Again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
