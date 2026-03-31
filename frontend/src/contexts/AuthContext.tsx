import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { UserProfile, UserProfileService } from '../services/userProfileService';
import { forceCleanAuthStorage, setAuthToken, removeAuthToken } from '../utils/authUtils';
import { API_ENDPOINTS, buildApiUrl } from '../config/api';
import { GoogleAuthService } from '../services/googleAuthService';

// Interfaces para TypeScript
interface AuthContextType {
  user: UserProfile | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    nickname: string,
    fullName?: string,
    _role?: 'player' | 'store_owner'
  ) => Promise<{ data: UserProfile | null; error: string | null; token?: string }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ data: UserProfile | null; error: string | null; errorCode?: string }>;
  signInWithGoogle: () => Promise<{
    data: UserProfile | null;
    error: string | null;
    isNewUser?: boolean;
    suggestedNickname?: string;
  }>;
  signOut: () => Promise<{ error: string | null }>;
  refreshUserProfile: () => Promise<void>;
  isAuthenticated: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Crear el contexto con valor por defecto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Exportar el contexto para testing
export { AuthContext };

// Hook personalizado para usar el contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

// Proveedor del contexto
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Función utilitaria para limpiar completamente el almacenamiento de auth
  const clearAuthStorage = () => {
    forceCleanAuthStorage();
    removeAuthToken();
  };

  // Función para cargar el perfil del usuario desde la API
  const loadUserProfile = async () => {
    try {
      // console.log('Loading user profile from API...');
      const profile = await UserProfileService.getUserProfile();

      if (!profile) {
        console.warn(
          'No profile found for authenticated user. User needs to complete profile setup.'
        );
        // No limpiamos el token aquí, el usuario está autenticado pero sin perfil completo
        setUser(null);
        setUserProfile(null);
        return profile;
      }

      // Log para debug del rol
      console.log('🔍 Profile loaded from API:', {
        id: profile.id,
        email: profile.email,
        nickname: profile.nickname,
        role: profile.role,
      });

      setUser(profile);
      setUserProfile(profile);
      // console.log('User profile loaded successfully:', profile);
      return profile;
    } catch (error) {
      // Solo limpiamos en caso de error de autenticación, no si falta el perfil
      if (
        error instanceof Error &&
        (error.message.includes('401') ||
          error.message.toLowerCase().includes('token') ||
          error.message.toLowerCase().includes('expired'))
      ) {
        // Silencio en consola para expereciones esperadas
        setUser(null);
        setUserProfile(null);
        clearAuthStorage();
      } else {
        console.error('Error loading user profile:', error);
        // Otros errores no deberían cerrar la sesión
        setUser(null);
        setUserProfile(null);
      }
      return null;
    }
  };

  useEffect(() => {
    // Inicializar autenticación comprobando la sesión via cookie httpOnly.
    // No leemos localStorage: el servidor valida la cookie y devuelve el perfil si la sesión es válida.
    const initializeAuth = async () => {
      try {
        await loadUserProfile();
      } catch (error) {
        // loadUserProfile ya maneja 401 limpiando el estado
        console.error('Error during auth initialization:', error);
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Función para registrar usuario
  const signUp = async (
    email: string,
    password: string,
    nickname: string,
    fullName?: string,
    _role?: 'player' | 'store_owner'
  ): Promise<{ data: UserProfile | null; error: string | null; token?: string }> => {
    try {
      console.log('Attempting to sign up with email:', email);

      const url = buildApiUrl(API_ENDPOINTS.AUTH_REGISTER);
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include', // sends/receives httpOnly cookies
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          nickname,
          full_name: fullName,
          // NOTE: 'role' is intentionally omitted — backend always assigns 'player'
        }),
      });

      const result = await response.json();

      console.log('🔍 Backend response:', JSON.stringify(result, null, 2));
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response OK:', response.ok);

      if (!response.ok || !result.success) {
        const errorMessage =
          result.message || result.error || 'Error desconocido durante el registro';
        console.error('API SignUp error:', errorMessage);
        return { data: null, error: errorMessage };
      }

      console.log('🔍 result.data:', result.data);
      const access_token = result.data.session?.access_token;
      const registeredUser = result.data.user;
      console.log(
        '🔍 access_token extracted:',
        access_token ? 'Present (length: ' + access_token.length + ')' : 'MISSING'
      );
      console.log('🔍 user extracted:', registeredUser ? 'Present' : 'Missing');

      if (access_token) {
        console.log('Registration successful, storing token...');
        setAuthToken(access_token);
        await loadUserProfile();
      }

      return { data: registeredUser || userProfile, error: null, token: access_token };
    } catch (error: any) {
      console.error('SignUp unexpected error:', error);
      return {
        data: null,
        error: error.message || 'Error inesperado durante el registro',
      };
    }
  };

  // Función para iniciar sesión
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ data: UserProfile | null; error: string | null; errorCode?: string }> => {
    try {
      console.log('Attempting to sign in with email:', email);

      if (!email || !password) {
        return {
          data: null,
          error: 'Email y contraseña son requeridos',
          errorCode: 'MISSING_CREDENTIALS',
        };
      }

      const url = buildApiUrl(API_ENDPOINTS.AUTH_LOGIN);
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include', // sends/receives httpOnly cookies
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorCode = result.error;
        const errorMessage =
          result.message || result.error || 'Error desconocido durante el inicio de sesión';
        console.error('API SignIn error:', errorMessage);

        // Proporcionar mensajes de error más específicos usando códigos del backend
        let friendlyErrorMessage = errorMessage;

        if (errorCode === 'USER_NOT_FOUND') {
          friendlyErrorMessage = 'No tienes una cuenta con este email. ¿Quieres registrarte?';
        } else if (errorCode === 'INVALID_PASSWORD') {
          friendlyErrorMessage = 'La contraseña es incorrecta. Inténtalo de nuevo.';
        } else if (
          errorMessage.toLowerCase().includes('invalid') ||
          errorMessage.toLowerCase().includes('incorrect')
        ) {
          friendlyErrorMessage = 'Credenciales inválidas. Verifica tu email y contraseña.';
        } else if (errorMessage.toLowerCase().includes('not found')) {
          friendlyErrorMessage = 'No tienes una cuenta con este email. ¿Quieres registrarte?';
        } else if (errorMessage.toLowerCase().includes('not confirmed')) {
          friendlyErrorMessage = 'Por favor confirma tu email antes de iniciar sesión.';
        } else if (errorMessage.toLowerCase().includes('too many')) {
          friendlyErrorMessage =
            'Demasiados intentos. Espera un momento antes de intentar de nuevo.';
        }

        return { data: null, error: friendlyErrorMessage, errorCode };
      }

      const { access_token } = result.data;

      if (access_token) {
        console.log('Login successful, storing token...');
        setAuthToken(access_token);
        // Load the profile with the correct role information
        const loadedProfile = await loadUserProfile();
        console.log('✅ SignIn complete - Profile with role loaded:', {
          id: loadedProfile?.id,
          email: loadedProfile?.email,
          role: loadedProfile?.role,
        });
        return { data: loadedProfile, error: null };
      }

      return { data: null, error: 'No se recibió token de autenticación', errorCode: 'NO_TOKEN' };
    } catch (error: any) {
      console.error('SignIn unexpected error:', error);
      return {
        data: null,
        error:
          error.message ||
          'Error inesperado durante el inicio de sesión. Verifica tu conexión a internet.',
        errorCode: error.code || 'UNKNOWN_ERROR',
      };
    }
  };

  // Función para recargar el perfil del usuario.
  // La autenticación se valida vía cookie httpOnly en el backend.
  const refreshUserProfile = async (): Promise<void> => {
    await loadUserProfile();
  };

  // Función para iniciar sesión con Google
  const signInWithGoogle = async (): Promise<{
    data: UserProfile | null;
    error: string | null;
    isNewUser?: boolean;
    suggestedNickname?: string;
  }> => {
    try {
      console.log('Attempting to sign in with Google...');

      // Call Google Auth Service
      const result = await GoogleAuthService.signInWithGoogle();

      const { user: googleUser, session, isNewUser, suggestedNickname } = result;

      // Store the access token
      if (session?.access_token) {
        console.log('Google sign-in successful, storing token...');
        setAuthToken(session.access_token);
        const loadedProfile = await loadUserProfile();
        console.log('✅ Google SignIn complete - Profile with role loaded:', {
          id: loadedProfile?.id,
          email: loadedProfile?.email,
          role: loadedProfile?.role,
        });
        return {
          data: loadedProfile,
          error: null,
          isNewUser,
          suggestedNickname,
        };
      }

      return {
        data: googleUser || null,
        error: 'No se recibió token de autenticación',
        isNewUser,
        suggestedNickname,
      };
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      return {
        data: null,
        error: error.message || 'Error durante el inicio de sesión con Google',
      };
    }
  };

  // Función para cerrar sesión
  const signOut = async (): Promise<{ error: string | null }> => {
    try {
      console.log('Signing out...');

      // Llamar al endpoint de logout para que el backend limpie las cookies httpOnly
      try {
        const url = buildApiUrl(API_ENDPOINTS.AUTH_LOGOUT);
        await fetch(url, {
          method: 'POST',
          credentials: 'include', // necesario para que el backend pueda limpiar la cookie
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (logoutError) {
        console.warn('Error calling logout endpoint:', logoutError);
        // No fallar el logout local si el endpoint falla
      }

      // Limpiar el estado local y el token
      setUser(null);
      setUserProfile(null);
      clearAuthStorage();

      console.log('Sign out successful.');
      return { error: null };
    } catch (error: any) {
      console.error('SignOut error:', error);
      // Asegurar que el estado local y el token se limpien incluso si hay un error
      setUser(null);
      setUserProfile(null);
      clearAuthStorage();
      return {
        error: error.message || 'Error inesperado durante el cierre de sesión',
      };
    }
  };

  // Valor del contexto
  const value: AuthContextType = {
    user,
    userProfile,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshUserProfile,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
