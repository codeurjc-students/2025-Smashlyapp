import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Helper component to interact with AuthContext in tests
const AuthActionsProbe: React.FC = () => {
  const { signIn, signOut, isAuthenticated, userProfile } = useAuth();
  return (
    <div>
      <button data-testid="login" onClick={() => signIn('User@Test.com', 'secret')}>Login</button>
      <button data-testid="logout" onClick={() => signOut()}>Logout</button>
      <div data-testid="status">{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="nickname">{userProfile?.nickname || ''}</div>
    </div>
  );
};

// Minimal mock profile returned by /users/profile
const mockProfile = {
  id: 'u1',
  email: 'user@test.com',
  nickname: 'user',
  role: 'player',
};

// Reset fetch between tests
beforeEach(() => {
  // @ts-expect-error override global in test
  global.fetch = vi.fn(async (input: any, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input?.toString?.() ?? '';
    if (url.includes('/api/v1/auth/login')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            access_token: 'token123',
            session: { access_token: 'token123', refresh_token: 'refresh123', expires_at: 123456 },
            user: { id: 'u1', email: 'user@test.com', user_metadata: { nickname: 'user' } },
          },
          timestamp: new Date().toISOString(),
        }),
      } as Response;
    }

    if (url.includes('/api/v1/users/profile')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockProfile, timestamp: new Date().toISOString() }),
      } as Response;
    }

    if (url.includes('/api/v1/auth/logout')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { message: 'Sesión cerrada exitosamente' }, timestamp: new Date().toISOString() }),
      } as Response;
    }

    // Default: 404
    return {
      ok: false,
      status: 404,
      json: async () => ({ success: false, error: 'Not Found', message: 'Not Found', timestamp: new Date().toISOString() }),
    } as Response;
  });
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('signIn stores token, loads profile and sets authenticated state', async () => {
  render(
    <AuthProvider>
      <AuthActionsProbe />
    </AuthProvider>
  );

  expect(screen.getByTestId('status').textContent).toBe('no');

  await userEvent.click(screen.getByTestId('login'));

  await waitFor(() => {
    expect(localStorage.getItem('auth_token')).toBe('token123');
    expect(screen.getByTestId('status').textContent).toBe('yes');
    expect(screen.getByTestId('nickname').textContent).toBe('user');
  });
});

test('signOut clears token and resets authenticated state', async () => {
  render(
    <AuthProvider>
      <AuthActionsProbe />
    </AuthProvider>
  );

  // Login first
  await userEvent.click(screen.getByTestId('login'));
  await waitFor(() => expect(localStorage.getItem('auth_token')).toBe('token123'));

  // Logout
  await userEvent.click(screen.getByTestId('logout'));

  await waitFor(() => {
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(screen.getByTestId('status').textContent).toBe('no');
    expect(screen.getByTestId('nickname').textContent).toBe('');
  });
});

test('signIn returns friendly error on invalid credentials', async () => {
  // Override fetch to return 401 for login
  // @ts-expect-error override global in test
  global.fetch = vi.fn(async (input: any, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input?.toString?.() ?? '';
    if (url.includes('/api/v1/auth/login')) {
      return {
        ok: false,
        status: 401,
        json: async () => ({ success: false, error: 'Invalid credentials', message: 'Invalid credentials', timestamp: new Date().toISOString() }),
      } as Response;
    }
    // Any other call returns 404
    return {
      ok: false,
      status: 404,
      json: async () => ({ success: false, error: 'Not Found', message: 'Not Found', timestamp: new Date().toISOString() }),
    } as Response;
  });

  // Probe component that captures returned error
  const ProbeWithErrorCapture: React.FC = () => {
    const { signIn } = useAuth();
    const [error, setError] = React.useState<string | null>(null);
    return (
      <div>
        <button
          data-testid="login-invalid"
          onClick={async () => {
            const result = await signIn('bad@test.com', 'wrong');
            setError(result.error);
          }}
        >
          Login Invalid
        </button>
        <div data-testid="error">{error || ''}</div>
      </div>
    );
  };

  render(
    <AuthProvider>
      <ProbeWithErrorCapture />
    </AuthProvider>
  );

  await userEvent.click(screen.getByTestId('login-invalid'));
  await waitFor(() => {
    expect(screen.getByTestId('error').textContent).toMatch('Credenciales inválidas');
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});