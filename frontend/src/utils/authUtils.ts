/**
 * Utilidades para el manejo de autenticación y limpieza de tokens
 */

/**
 * Limpia completamente todos los tokens y datos de autenticación del almacenamiento local
 * Esta función es útil para forzar un logout completo cuando hay problemas con tokens persistentes
 */
export const forceCleanAuthStorage = (): void => {
  try {
    console.log("Starting force clean of auth storage...");

    // Limpiar localStorage
    const localKeysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && isAuthRelatedKey(key)) {
        localKeysToRemove.push(key);
      }
    }

    localKeysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed localStorage key: ${key}`);
    });

    // Limpiar sessionStorage
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && isAuthRelatedKey(key)) {
        sessionKeysToRemove.push(key);
      }
    }

    sessionKeysToRemove.forEach((key) => {
      sessionStorage.removeItem(key);
      console.log(`🗑️ Removed sessionStorage key: ${key}`);
    });

    // Limpiar cookies relacionadas con auth (si las hay)
    try {
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name =
          eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (isAuthRelatedKey(name)) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          console.log(`🗑️ Removed cookie: ${name}`);
        }
      });
    } catch (cookieError) {
      console.warn("Error cleaning cookies:", cookieError);
    }

    const totalKeysRemoved =
      localKeysToRemove.length + sessionKeysToRemove.length;
    console.log(
      `✅ Force clean completed. Removed ${totalKeysRemoved} auth-related keys.`
    );

    return;
  } catch (error) {
    console.error("❌ Error during force clean of auth storage:", error);

    // Fallback: intentar limpiar las claves más comunes
    try {
      const commonAuthKeys = [
        "sb-localhost-auth-token",
        "sb-auth-token",
        "supabase.auth.token",
        "access_token",
        "refresh_token",
      ];

      commonAuthKeys.forEach((key) => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (e) {
          // Ignorar errores individuales
        }
      });

      console.log("🔄 Fallback cleanup completed");
    } catch (fallbackError) {
      console.error("❌ Even fallback cleanup failed:", fallbackError);
    }
  }
};

/**
 * Verifica si una clave del storage está relacionada con autenticación
 */
const isAuthRelatedKey = (key: string): boolean => {
  const authKeyPatterns = [
    "sb-",
    "supabase",
    "auth-token",
    "access_token",
    "refresh_token",
    "id_token",
    "session",
    "user_session",
    "auth_session",
  ];

  return authKeyPatterns.some((pattern) =>
    key.toLowerCase().includes(pattern.toLowerCase())
  );
};

/**
 * Verifica si hay tokens huérfanos en el almacenamiento
 * Útil para debugging y diagnóstico
 */
export const detectOrphanedTokens = (): string[] => {
  const orphanedKeys: string[] = [];

  try {
    // Verificar localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && isAuthRelatedKey(key)) {
        orphanedKeys.push(`localStorage.${key}`);
      }
    }

    // Verificar sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && isAuthRelatedKey(key)) {
        orphanedKeys.push(`sessionStorage.${key}`);
      }
    }

    if (orphanedKeys.length > 0) {
      console.warn(
        `🔍 Detected ${orphanedKeys.length} potential orphaned auth keys:`,
        orphanedKeys
      );
    }

    return orphanedKeys;
  } catch (error) {
    console.error("Error detecting orphaned tokens:", error);
    return [];
  }
};

/**
 * Función de diagnóstico para verificar el estado de autenticación
 */
export const diagnoseAuthState = (): void => {
  console.group("🔍 Auth State Diagnosis");

  try {
    const orphanedKeys = detectOrphanedTokens();

    console.log("📊 Storage Analysis:");
    console.log(`- LocalStorage keys: ${localStorage.length}`);
    console.log(`- SessionStorage keys: ${sessionStorage.length}`);
    console.log(`- Orphaned auth keys: ${orphanedKeys.length}`);

    if (orphanedKeys.length > 0) {
      console.log("🚨 Orphaned keys found:", orphanedKeys);
      console.log("💡 Consider calling forceCleanAuthStorage() to clean them");
    } else {
      console.log("✅ No orphaned auth keys detected");
    }
  } catch (error) {
    console.error("❌ Error during diagnosis:", error);
  }

  console.groupEnd();
};

// Función que se puede llamar desde la consola del navegador para debug
declare global {
  interface Window {
    __smashly_auth_utils: {
      forceClean: () => void;
      diagnose: () => void;
      detectOrphaned: () => string[];
    };
  }
}

