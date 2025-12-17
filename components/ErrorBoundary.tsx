import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-deepnavy flex items-center justify-center p-6">
          <div className="bg-prussianblue border border-red-500/20 rounded-xl p-12 max-w-lg text-center">
            <div className="mb-6">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                SYSTEM ERROR
              </h1>
              <p className="text-sm text-white/40 font-bold uppercase tracking-widest">
                Mission Critical Failure
              </p>
            </div>

            {this.state.error && (
              <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-4 mb-6">
                <p className="text-xs text-red-400 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="bg-pilot-orange hover:bg-pilot-orange/90 text-white font-bold py-3 px-8 rounded-lg transition-all active:scale-95 flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={16} />
              <span className="text-xs uppercase tracking-widest">Restart System</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
