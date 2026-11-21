import React from 'react';

interface ErrorBoundaryProps {
  /** Friendly name of the area that failed, e.g. "Sala 3 • Capacitancia". */
  label?: string;
  /** Changing this value clears a previous error (e.g. when the student switches room). */
  resetKey?: string;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  resetKey: string | undefined;
}

/**
 * Lightweight error boundary: a rendering or canvas failure in one laboratory shows a
 * friendly message with a retry button instead of blanking the whole application.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState
  ): Partial<ErrorBoundaryState> | null {
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey };
    }
    return null;
  }

  private handleRetry = (): void => {
    this.setState({ error: null });
  };

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        className="w-full h-full flex items-center justify-center bg-[#090d16] p-6"
      >
        <div className="max-w-md text-center bg-slate-900/80 border border-rose-500/30 rounded-xl p-6">
          <h2 className="text-lg font-bold text-rose-300 mb-2">
            No se pudo mostrar {this.props.label ?? 'esta sección'}
          </h2>
          <p className="text-sm text-slate-300 mb-4">
            Ocurrió un error inesperado. Sus demás salas siguen funcionando. Puede reintentar o
            elegir otra sala desde la barra superior.
          </p>
          <p className="text-xs text-slate-500 font-mono mb-4 break-words">{error.message}</p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
}
