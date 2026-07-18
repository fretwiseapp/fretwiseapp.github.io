import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

/**
 * Catches runtime errors in the React tree so a bug in one view doesn't white-screen the app.
 * Shows a minimal recovery UI with the error message and a reload button.
 * Errors are logged to console for devs; in production we keep the UX calm (no stack trace shown).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): State {
    return { error, info: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ error, info });
    // eslint-disable-next-line no-console
    console.error('[Fretwise] Unexpected error:', error, info);
  }

  private reset = (): void => {
    this.setState({ error: null, info: null });
  };

  private reload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    const isDev = import.meta.env?.DEV ?? false;

    return (
      <div className="error-boundary" role="alert">
        <div className="error-card">
          <h2>Algo se rompió</h2>
          <p>La app encontró un error y no pudo continuar. Probá recargar; si vuelve a pasar, avisá al equipo.</p>
          {isDev && (
            <details className="error-details">
              <summary>Detalle técnico (solo dev)</summary>
              <pre>{this.state.error.message}</pre>
              {this.state.error.stack && <pre className="error-stack">{this.state.error.stack}</pre>}
            </details>
          )}
          <div className="error-actions">
            <button className="p" onClick={this.reload}>↻ Recargar</button>
            <button onClick={this.reset}>Intentar recuperar</button>
          </div>
        </div>
      </div>
    );
  }
}
