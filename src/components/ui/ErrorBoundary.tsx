import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional custom fallback UI */
  fallback?: React.ReactNode;
}

/**
 * Catches unhandled render errors in the component tree and displays a
 * user-friendly error screen instead of a blank white page.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-deepnavy flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-prussianblue border border-red-500/20 rounded-2xl p-10 text-center shadow-2xl">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
              Something went wrong
            </h2>
            <p className="text-xs text-white/40 font-bold uppercase tracking-widest mb-6">
              An unexpected error occurred
            </p>
            {this.state.error && (
              <pre className="text-[10px] text-red-400/80 bg-red-500/5 border border-red-500/10 rounded-lg p-4 text-left overflow-auto mb-6 max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="bg-pilot-orange hover:bg-pilot-orange/90 text-white font-black rounded-lg px-8 py-3 text-xs uppercase tracking-widest transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
