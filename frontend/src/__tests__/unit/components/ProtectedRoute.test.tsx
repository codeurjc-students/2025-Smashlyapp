import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { AuthContext } from '../../../contexts/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => {
      mockNavigate(to);
      return <div>Redirecting to {to}</div>;
    },
  };
});

describe('ProtectedRoute', () => {
  const renderWithAuth = (
    children: React.ReactNode,
    authValue: any
  ) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={authValue}>
          <ProtectedRoute>{children}</ProtectedRoute>
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  it('should show loading state', () => {
    renderWithAuth(
      <div>Protected Content</div>,
      { user: null, loading: true }
    );

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('should redirect when not authenticated', () => {
    renderWithAuth(
      <div>Protected Content</div>,
      { user: null, loading: false }
    );

    expect(mockNavigate).toHaveBeenCalledWith('/error?type=unauthorized');
  });

  it('should render children when authenticated', () => {
    renderWithAuth(
      <div>Protected Content</div>,
      { user: { id: '1', email: 'test@test.com', role: 'player' }, loading: false }
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect non-admin from admin route', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{
          user: { id: '1', email: 'test@test.com', role: 'player' },
          loading: false
        }}>
          <ProtectedRoute requireAdmin={true}>
            <div>Admin Content</div>
          </ProtectedRoute>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/error?type=403');
  });

  it('should allow admin to access admin route', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{
          user: { id: '1', email: 'admin@test.com', role: 'admin' },
          loading: false
        }}>
          <ProtectedRoute requireAdmin={true}>
            <div>Admin Content</div>
          </ProtectedRoute>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });
});
