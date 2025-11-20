import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '@/contexts/AuthContext';
import LoginPage from '@/pages/LoginPage';
import { MemoryRouter } from 'react-router-dom';

// Avoid real navigation updates during tests to prevent act warnings
vi.mock('react-router-dom', async () => {
  const actual: any = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock toast to assert user feedback
vi.mock('react-hot-toast', () => {
  return {
    default: {
      success: vi.fn(),
      error: vi.fn(),
    },
    success: vi.fn(),
    error: vi.fn(),
  };
});

const getToast = async () => {
  const mod: any = await vi.importMock('react-hot-toast');
  return mod.default;
};

const renderWithAuth = (ctxValue: any) => {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={ctxValue}>
        <LoginPage />
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

test('shows validation errors for empty fields and prevents submit', async () => {
  const mockCtx = {
    user: null,
    userProfile: null,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    refreshUserProfile: vi.fn(),
    isAuthenticated: false,
  };

  renderWithAuth(mockCtx);

  await act(async () => {
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));
  });

  expect(await screen.findByText('El email es requerido')).toBeInTheDocument();
  expect(await screen.findByText('La contraseña es requerida')).toBeInTheDocument();
  expect(mockCtx.signIn).not.toHaveBeenCalled();
});

test('successful login triggers success toast and calls signIn', async () => {
  const mockSignIn = vi.fn(async (email: string, password: string) => ({ data: { id: 'u1' }, error: null }));
  const mockCtx = {
    user: null,
    userProfile: null,
    loading: false,
    signUp: vi.fn(),
    signIn: mockSignIn,
    signOut: vi.fn(),
    refreshUserProfile: vi.fn(),
    isAuthenticated: false,
  };

  renderWithAuth(mockCtx);

  const emailInput = screen.getByLabelText('Email');
  const passwordInput = screen.getByLabelText('Contraseña');

  await act(async () => {
    await userEvent.type(emailInput, 'USER@Test.com');
    await userEvent.type(passwordInput, 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));
  });

  const toast = await getToast();

  await waitFor(() => {
    expect(mockSignIn).toHaveBeenCalledWith('USER@Test.com', 'secret123');
    expect(toast.success).toHaveBeenCalledWith('¡Bienvenido a Smashly!');
  });
});

test('failed login shows error toast with message from signIn', async () => {
  const mockSignIn = vi.fn(async () => ({ data: null, error: 'Credenciales inválidas' }));
  const mockCtx = {
    user: null,
    userProfile: null,
    loading: false,
    signUp: vi.fn(),
    signIn: mockSignIn,
    signOut: vi.fn(),
    refreshUserProfile: vi.fn(),
    isAuthenticated: false,
  };

  renderWithAuth(mockCtx);

  await act(async () => {
    await userEvent.type(screen.getByLabelText('Email'), 'user@test.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));
  });

  const toast = await getToast();

  await waitFor(() => {
    expect(mockSignIn).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Credenciales inválidas');
  });
});