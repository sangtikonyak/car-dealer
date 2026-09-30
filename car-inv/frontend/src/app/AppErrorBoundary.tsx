import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public state: AppErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('Unhandled application error.', error, errorInfo);
    }
  }

  private readonly reload = (): void => {
    window.location.reload();
  };

  public render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="app-error-screen" role="alert">
        <div className="app-error-card">
          <p className="app-error-kicker">DRIVA / TEMPORARILY UNAVAILABLE</p>
          <h1>We hit a small roadblock.</h1>
          <p>
            This page could not finish loading. Refresh the page or return to the homepage to
            continue browsing.
          </p>
          <div className="app-error-actions">
            <button type="button" onClick={this.reload}>
              Refresh page
            </button>
            <a href="/">Return home</a>
          </div>
        </div>
      </main>
    );
  }
}
