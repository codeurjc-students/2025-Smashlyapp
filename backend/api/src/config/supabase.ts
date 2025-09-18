import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

// Obtener las variables de entorno
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Validar que las variables de entorno estén disponibles
if (!supabaseUrl) {
  throw new Error("SUPABASE_URL environment variable is required");
}

if (!supabaseServiceKey && !supabaseAnonKey) {
  throw new Error(
    "Either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable is required"
  );
}

// Usar la service role key si está disponible (para operaciones administrativas)
// O usar la anon key para operaciones normales
const supabaseKey = supabaseServiceKey || supabaseAnonKey!;

// Crear cliente de Supabase con configuración optimizada para la API
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false, // No necesario en el servidor
    persistSession: false, // No persistir sesiones en el servidor
    detectSessionInUrl: false, // No detectar sesiones en URLs
  },
  global: {
    headers: {
      "X-Client-Info": "smashly-api@1.0.0",
    },
  },
  // Configuración optimizada para alto volumen
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Cliente administrativo con service role (si está disponible)
export const supabaseAdmin: SupabaseClient | null = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          "X-Client-Info": "smashly-api-admin@1.0.0",
        },
      },
    })
  : null;

// Función para verificar la conexión con Supabase
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("rackets")
      .select("id")
      .limit(1);

    if (error) {
      console.error("❌ Supabase connection test failed:", error.message);
      return false;
    }

    console.log("✅ Supabase connection successful");
    return true;
  } catch (error) {
    console.error("❌ Supabase connection test error:", error);
    return false;
  }
}

// Log de configuración
console.log("📊 Supabase config loaded:", {
  url: supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  hasAnonKey: !!supabaseAnonKey,
  usingServiceKey: !!supabaseServiceKey,
});

export default supabase;
