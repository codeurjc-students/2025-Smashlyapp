import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { apiRequest } from "../config/api";
import {
  UserProfile,
  UserProfileService,
} from "../services/userProfileService.ts";

// Interfaces para TypeScript
interface AuthError {
  message: string;
}

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    nickname: string,
    fullName?: string
  ) => Promise<{ data: any; error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ data: any; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  refreshUserProfile: () => Promise<void>;
  isAuthenticated: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Crear el contexto con valor por defecto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};

// Provider del contexto de autenticación
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Función para obtener el token de localStorage
  const getToken = (): string | null => {
    return localStorage.getItem('auth_token');
  };

  // Función para guardar el token
  const setToken = (token: string) => {
    localStorage.setItem('auth_token', token);
  };

  // Función para eliminar el token
  const removeToken = () => {
    localStorage.removeItem('auth_token');
  };

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getToken();
        if (!token) {
          setLoading(false);
          return;
        }

        // Verificar si el token es válido obteniendo el usuario actual
        const response = await apiRequest('/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.user) {
          setUser(response.user);
          
          // Cargar perfil del usuario
          const profile = await UserProfileService.getUserProfile(token);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        removeToken();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Función de registro
  const signUp = async (
    email: string,
    password: string,
    nickname: string,
    fullName?: string
  ): Promise<{ data: any; error: AuthError | null }> => {
    try {
      setLoading(true);

      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          nickname,
          full_name: fullName
        })
      });

      console.log('Register response received:', response);

      // Verificar si la respuesta es exitosa y tiene datos
      if (response.success && response.data) {
        console.log('Registration successful, processing data...');
        const { access_token, user, message } = response.data;
        
        // Si hay un mensaje sobre confirmación de email
        if (message && message.includes('email')) {
          console.log('Email confirmation required');
          return { 
            data: { requiresEmailConfirmation: true, message }, 
            error: null 
          };
        }
        
        if (access_token) {
          console.log('Setting token and user...');
          setToken(access_token);
          setUser(user);
          
          // Crear perfil del usuario si no existe
          try {
            const profile = await UserProfileService.createUserProfile(access_token, {
              email,
              nickname,
              full_name: fullName
            });
            setUserProfile(profile);
          } catch (profileError) {
            console.warn('Error creating profile:', profileError);
          }

          console.log('Registration completed successfully');
          return { data: response.data, error: null };
        }
      }

      console.log('Registration failed or no token received');
      return { data: null, error: { message: 'Error en el registro' } };
    } catch (error: any) {
      console.error('SignUp error details:', error);
      
      // Mejorar mensajes de error específicos
      let errorMessage = error.message || 'Error en el registro';
      
      if (errorMessage.includes('email rate limit exceeded')) {
        errorMessage = 'Límite de registros alcanzado. Por favor, espera unos minutos antes de intentar de nuevo.';
      } else if (errorMessage.includes('email already exists') || errorMessage.includes('duplicate key value violates unique constraint')) {
        errorMessage = 'Este email ya está registrado. Usa otro email o inicia sesión.';
      } else if (errorMessage.includes('nickname already exists')) {
        errorMessage = 'Este nickname ya está en uso. Elige otro nickname.';
      } else if (errorMessage.includes('Database error saving new user') || errorMessage.includes('Error al registrar usuario')) {
        errorMessage = 'Error en el servidor al crear la cuenta. Por favor, inténtalo de nuevo más tarde o contacta con soporte si el problema persiste.';
      } else if (errorMessage.includes('Invalid email format')) {
        errorMessage = 'El formato del email no es válido.';
      } else if (errorMessage.includes('Password too weak')) {
        errorMessage = 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.';
      } else if (errorMessage.includes('400')) {
        errorMessage = 'Los datos proporcionados no son válidos. Verifica que todos los campos estén completos y correctos.';
      }
      
      return { 
        data: null, 
        error: { message: errorMessage } 
      };
    } finally {
      setLoading(false);
    }
  };

  // Función de inicio de sesión
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ data: any; error: AuthError | null }> => {
    try {
      setLoading(true);

      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password
        })
      });

      // Verificar si la respuesta es exitosa y tiene datos
      if (response.success && response.data) {
        const { access_token, user } = response.data;
        
        if (access_token) {
          setToken(access_token);
          setUser(user);

          // Cargar perfil del usuario
          const profile = await UserProfileService.getUserProfile(access_token);
          setUserProfile(profile);

          return { data: response.data, error: null };
        }
      }

      return { data: null, error: { message: 'Credenciales inválidas' } };
    } catch (error: any) {
      return { 
        data: null, 
        error: { message: error.message || 'Error en el inicio de sesión' } 
      };
    } finally {
      setLoading(false);
    }
  };

  // Función de cierre de sesión
  const signOut = async (): Promise<{ error: AuthError | null }> => {
    try {
      const token = getToken();
      if (token) {
        // Intentar cerrar sesión en el servidor
        await apiRequest('/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.warn('Error during server logout:', error);
    } finally {
      // Limpiar estado local siempre
      removeToken();
      setUser(null);
      setUserProfile(null);
    }

    return { error: null };
  };

  // Función para refrescar el perfil del usuario
  const refreshUserProfile = async (): Promise<void> => {
    try {
      const token = getToken();
      if (!token) return;

      const profile = await UserProfileService.getUserProfile(token);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  const isAuthenticated = !!user;

  const value: AuthContextType = useMemo(() => ({
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshUserProfile,
    isAuthenticated,
  }), [user, userProfile, loading, isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
