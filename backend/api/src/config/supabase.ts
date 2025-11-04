import logger from "../config/logger";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

// Obtener las variables de entorno
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Allow tests to run without credentials (they will skip if not configured)
const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

// Validate that environment variables are available (except in tests)
if (!isTestEnvironment) {
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL environment variable is required");
  }

  if (!supabaseServiceKey && !supabaseAnonKey) {
    throw new Error(
      "Either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable is required"
    );
  }
}

// Use the service role key if available (for administrative operations)
// Or use the anon key for normal operations
const supabaseKey = supabaseServiceKey || supabaseAnonKey || '';

// Create Supabase client with optimized configuration for the API
// En entorno de test sin credenciales, crear un cliente dummy
export const supabase: SupabaseClient = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
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
      // Optimized configuration for high volume
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });

// Administrative client with service role (if available)
export const supabaseAdmin: SupabaseClient | null = (supabaseUrl && supabaseServiceKey)
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

// Function to verify Supabase connection
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: unknown;
}> {
  try {
    // Try a simple query
    const { data, error } = await supabase
      .from("rackets")
      .select("id")
      .limit(1);

    if (error) {
      return {
        success: false,
        message: "Database connection failed",
        details: error,
      };
    }

    return {
      success: true,
      message: "Supabase connection successful",
      details: { recordsFound: data?.length || 0 },
    };
  } catch (error) {
    return {
      success: false,
      message: "Connection test failed",
      details: error,
    };
  }
}

// Configuration logging
logger.info("📊 Supabase config loaded:", {
  url: supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  hasAnonKey: !!supabaseAnonKey,
  usingServiceKey: !!supabaseServiceKey,
});

export default supabase;
