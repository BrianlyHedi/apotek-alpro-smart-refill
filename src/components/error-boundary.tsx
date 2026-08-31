"use client";

import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/// Global error boundary — tangkap uncaught errors di client dan tampilkan fallback UI
export class ErrorBoundary extends Component<
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Di production, kirim ke error tracking service (Sentry, dll.)
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
          <div className="rounded-lg bg-red-50 p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold text-red-800">
              Terjadi Kesalahan
            </h2>
            <p className="mb-4 text-sm text-red-600">
              {this.state.error?.message ?? "Terjadi kesalahan yang tidak terduga."}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
