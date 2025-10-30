// Interfaz para una tienda
export interface Store {
  id: string;
  
  // Datos de identificación
  store_name: string;
  legal_name: string;
  cif_nif: string;
  contact_email: string;
  phone_number?: string;
  website_url?: string;
  verified: boolean;
  
  // Datos de perfil público
  logo_url?: string;
  short_description?: string;
  location?: string;
  
  // Relación con usuario
  admin_user_id: string;
  
  // Auditoría
  created_at?: string;
  updated_at?: string;
}

// Interfaz para crear una tienda
export interface CreateStoreRequest {
  store_name: string;
  legal_name: string;
  cif_nif: string;
  contact_email: string;
  phone_number?: string;
  website_url?: string;
  logo_url?: string;
  short_description?: string;
  location?: string;
}

// Interfaz para actualizar una tienda
export interface UpdateStoreRequest {
  store_name?: string;
  legal_name?: string;
  cif_nif?: string;
  contact_email?: string;
  phone_number?: string;
  website_url?: string;
  logo_url?: string;
  short_description?: string;
  location?: string;
}

// Interfaz para el registro de tienda
export interface StoreRegistrationRequest extends CreateStoreRequest {
  // Datos del usuario admin de la tienda
  email: string;
  password: string;
  nickname: string;
  full_name?: string;
}
