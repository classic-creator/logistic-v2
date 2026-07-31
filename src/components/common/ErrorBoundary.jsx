import React from 'react';
import { AlertOctagon } from 'lucide-react';
import { Button } from './Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none">
          <div className="max-w-md w-full text-center space-y-6 bg-slate-900/60 border border-slate-800 backdrop-blur-md rounded-xl p-8 shadow-2xl">
            <div className="flex justify-center text-accent-rose">
              <AlertOctagon size={56} className="animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-display tracking-tight text-slate-100">
                Application Error
              </h2>
              <p className="text-sm text-slate-400">
                An unexpected error occurred in this module. Our operations log has registered the event.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs overflow-x-auto text-rose-300 max-h-40">
                {this.state.error.toString()}
              </div>
            )}

            <div className="pt-2">
              <Button variant="primary" onClick={this.handleReset} className="w-full">
                Reload Application
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
