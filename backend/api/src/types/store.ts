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
  
  // Public profile data
  logo_url?: string;
  short_description?: string;
  location?: string;
  
  // User relationship
  admin_user_id: string; // UUID of the owner user
  
  // Audit
  created_at?: string;
  updated_at?: string;
}

// Interface for creating a store
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

// Interface for updating a store
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

// Interface for store registration
export interface StoreRegistrationRequest extends CreateStoreRequest {
  // Store admin user data
  email: string;
  password: string;
  nickname: string;
  full_name?: string;
}
