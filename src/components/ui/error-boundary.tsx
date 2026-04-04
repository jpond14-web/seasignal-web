"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // TODO: Send to Sentry or other error reporting service
    console.error("[ErrorBoundary] Caught render error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReport = () => {
    // TODO: Replace with Sentry.captureException or similar
    if (this.state.error) {
      console.error("[ErrorBoundary] User reported error:", this.state.error);
    }
    alert("Error details have been logged. Thank you for reporting.");
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="w-full max-w-md bg-navy-900 border border-navy-700 rounded-xl shadow-2xl p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h2 className="text-lg font-semibold text-slate-100 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              An unexpected error occurred. You can try again or report this issue.
            </p>

            {this.state.error && (
              <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded px-3 py-2 mb-6 font-mono break-all">
                {this.state.error.message}
              </p>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded text-sm transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReport}
                className="px-4 py-2 bg-navy-800 border border-navy-600 rounded hover:bg-navy-700 text-slate-300 text-sm transition-colors"
              >
                Report
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
