import { AuthError, Session, User } from "@supabase/supabase-js";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../config/supabase";
import {
  UserProfile,
  UserProfileService,
} from "../services/userProfileService";
import {
  detectOrphanedTokens,
  forceCleanAuthStorage,
} from "../utils/authUtils";

// Interfaces para TypeScript
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

// Proveedor del contexto
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Función utilitaria para limpiar completamente el almacenamiento de auth
  const clearAuthStorage = () => {
    forceCleanAuthStorage();
  };

  // Función para cargar el perfil del usuario
  const loadUserProfile = async (userId: string) => {
    try {
      console.log("Loading user profile for userId:", userId);
      const profile = await UserProfileService.getUserProfile(userId);

      if (!profile) {
        console.warn("No profile found for user:", userId);
        // Solo crear perfil automático durante el login, no durante el registro
        // Durante el registro, el perfil debería haberse creado ya
        setUserProfile(null);
        return;
      }

      setUserProfile(profile);
    } catch (error) {
      console.error("Error loading user profile:", error);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    // Detectar tokens huérfanos al inicializar (solo en desarrollo)
    if (import.meta.env.DEV) {
      const orphanedTokens = detectOrphanedTokens();
      if (orphanedTokens.length > 0) {
        console.warn(
          "🚨 Orphaned tokens detected during init:",
          orphanedTokens
        );
      }
    }

    // Obtener sesión actual
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error.message);
          // Si hay error obteniendo la sesión, limpiar storage por si hay tokens corruptos
          clearAuthStorage();
          setUser(null);
          setUserProfile(null);
        } else if (session?.user) {
          // Verificar que la sesión sea válida
          const now = Math.floor(Date.now() / 1000);
          const expiresAt = session.expires_at;

          if (expiresAt && expiresAt < now) {
            console.warn("Session expired, cleaning up");
            clearAuthStorage();
            setUser(null);
            setUserProfile(null);
          } else {
            setUser(session.user);
            await loadUserProfile(session.user.id);
          }
        } else {
          // No hay sesión válida, asegurar que no hay tokens huérfanos
          clearAuthStorage();
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Error in getSession:", error);
        // En caso de error crítico, limpiar todo
        clearAuthStorage();
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session: Session | null) => {
        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        } else {
          // Cuando no hay sesión, limpiar completamente
          clearAuthStorage();
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Función para registrar usuario
  const signUp = async (
    email: string,
    password: string,
    nickname: string,
    fullName?: string
  ): Promise<{ data: any; error: AuthError | null }> => {
    try {
      // Primero verificar si el nickname está disponible
      const isAvailable = await UserProfileService.isNicknameAvailable(
        nickname
      );
      if (!isAvailable) {
        return {
          data: null,
          error: { message: "El nickname ya está en uso" } as AuthError,
        };
      }

      // Crear usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { data, error };
      }

      // Si el usuario se creó correctamente, crear el perfil
      if (data.user) {
        try {
          console.log("Creating profile with nickname:", nickname);
          const profile = await UserProfileService.createUserProfile(
            data.user.id,
            email,
            nickname,
            fullName
          );
          console.log("Profile created successfully:", profile);
          setUserProfile(profile);
        } catch (profileError) {
          console.error("Error creating user profile:", profileError);
          // Opcionalmente, podrías eliminar el usuario de Auth si falla la creación del perfil
          // Pero por ahora solo logueamos el error
        }
      }

      return { data, error };
    } catch (error) {
      console.error("SignUp error:", error);
      return {
        data: null,
        error: { message: "Error inesperado durante el registro" } as AuthError,
      };
    }
  };

  // Función para iniciar sesión
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ data: any; error: AuthError | null }> => {
    try {
      console.log("Attempting to sign in with email:", email);

      // Validar que el email y password no estén vacíos
      if (!email || !password) {
        return {
          data: null,
          error: { message: "Email y contraseña son requeridos" } as AuthError,
        };
      }

      // Intentar login con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(), // Normalizar email
        password,
      });

      if (error) {
        console.error("Supabase auth error:", error);

        // Proporcionar mensajes de error más específicos
        let errorMessage = "Error durante el inicio de sesión";

        switch (error.message) {
          case "Invalid login credentials":
            errorMessage =
              "Credenciales inválidas. Verifica tu email y contraseña.";
            break;
          case "Email not confirmed":
            errorMessage =
              "Por favor confirma tu email antes de iniciar sesión.";
            break;
          case "Too many requests":
            errorMessage =
              "Demasiados intentos. Espera un momento antes de intentar de nuevo.";
            break;
          case "User not found":
            errorMessage = "No existe una cuenta con este email.";
            break;
          default:
            errorMessage = error.message;
        }

        return {
          data,
          error: { ...error, message: errorMessage } as AuthError,
        };
      }

      // Si el login es exitoso, cargar el perfil del usuario
      if (data.user && !error) {
        console.log(
          "Login successful, loading user profile for:",
          data.user.id
        );
        try {
          await loadUserProfile(data.user.id);
        } catch (profileError) {
          console.warn("Error loading user profile after login:", profileError);
          // No fallar el login si hay problemas cargando el perfil
        }
      }

      return { data, error };
    } catch (error) {
      console.error("SignIn unexpected error:", error);
      return {
        data: null,
        error: {
          message:
            "Error inesperado durante el inicio de sesión. Verifica tu conexión a internet.",
        } as AuthError,
      };
    }
  };

  // Función para recargar el perfil del usuario
  const refreshUserProfile = async (): Promise<void> => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  // Función para cerrar sesión
  const signOut = async (): Promise<{ error: AuthError | null }> => {
    try {
      // Limpiar el estado local primero
      setUser(null);
      setUserProfile(null);

      // Limpiar completamente el almacenamiento de auth
      clearAuthStorage();

      // Intentar cerrar sesión con Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.warn("Supabase signOut error, but local state cleared:", error);
        // Como ya limpiamos el estado local y el storage, considerar exitoso
        return { error: null };
      }

      return { error };
    } catch (error) {
      console.error("SignOut error:", error);

      // Aún en caso de error total, asegurar limpieza del estado local
      setUser(null);
      setUserProfile(null);
      clearAuthStorage();

      // Considerar exitoso ya que limpiamos todo localmente
      return { error: null };
    }
  };

  // Valor del contexto
  const value: AuthContextType = {
    user,
    userProfile,
    signUp,
    signIn,
    signOut,
    refreshUserProfile,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
