import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundaryClass extends Component<Props & { navigate: (to: string) => void }, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  private handleGoToError = () => {
    this.props.navigate(
      '/error?type=500&message=' +
        encodeURIComponent(this.state.error?.message || 'Error desconocido')
    );
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '3rem 2rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 10px 40px rgba(22, 163, 74, 0.12)',
            }}
          >
            <h1
              style={{
                fontSize: '3rem',
                margin: '0',
                color: '#dc2626',
                fontWeight: '700',
              }}
            >
              ¡Ups!
            </h1>
            <h2
              style={{
                fontSize: '1.5rem',
                margin: '1rem 0',
                color: '#1f2937',
              }}
            >
              Algo salió mal
            </h2>
            <p
              style={{
                fontSize: '1rem',
                color: '#6b7280',
                margin: '1.5rem 0',
                lineHeight: '1.6',
              }}
            >
              Ha ocurrido un error inesperado. Puedes intentar recargar la página o volver al
              inicio.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                marginTop: '2rem',
              }}
            >
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  background: '#16a34a',
                  color: 'white',
                }}
              >
                Reintentar
              </button>
              <button
                onClick={this.handleGoToError}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  color: '#374151',
                }}
              >
                Ver Detalles
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to use hooks with class component
const ErrorBoundary: React.FC<Props> = ({ children, fallback }) => {
  const navigate = useNavigate();
  return (
    <ErrorBoundaryClass navigate={navigate} fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
};

export default ErrorBoundary;
