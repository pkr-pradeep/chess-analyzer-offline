import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
    this.handleReset = this.handleReset.bind(this);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chess UI Error Caught by Boundary:', error, errorInfo);
  }

  public handleReset() {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-slate-900 border border-amber-500/40 rounded-2xl text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-100">
              {this.props.fallbackTitle || 'Position Display Notice'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              A temporary display error occurred while stepping through moves. The match state is preserved safely.
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Live Board Position</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
