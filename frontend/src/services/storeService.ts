import { API_ENDPOINTS, API_URL } from "../config/api";

export interface Store {
  id: string;
  store_name: string;
  legal_name: string;
  cif_nif: string;
  contact_email: string;
  phone_number: string;
  website_url?: string;
  logo_url?: string;
  short_description?: string;
  location: string;
  verified: boolean;
  admin_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStoreRequest {
  store_name: string;
  legal_name: string;
  cif_nif: string;
  contact_email: string;
  phone_number: string;
  website_url?: string;
  logo_url?: string;
  short_description?: string;
  location: string;
}

const storeService = {
  /**
   * Crear una nueva solicitud de tienda
   */
  async createStoreRequest(
    storeData: CreateStoreRequest,
    token: string
  ): Promise<Store> {
    const response = await fetch(`${API_URL}${API_ENDPOINTS.STORES}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(storeData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al crear la tienda");
    }

    const data = await response.json();
    return data.store;
  },

  /**
   * Obtener todas las tiendas
   */
  async getAllStores(verified?: boolean, token?: string): Promise<Store[]> {
    const url = new URL(`${API_URL}${API_ENDPOINTS.STORES}`);
    if (verified !== undefined) {
      url.searchParams.append("verified", String(verified));
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al obtener las tiendas");
    }

    return response.json();
  },

  /**
   * Obtener una tienda por ID
   */
  async getStoreById(storeId: string, token: string): Promise<Store> {
    const response = await fetch(
      `${API_URL}${API_ENDPOINTS.STORES_BY_ID(storeId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al obtener la tienda");
    }

    return response.json();
  },

  /**
   * Obtener la tienda del usuario actual
   */
  async getMyStore(token: string): Promise<Store | null> {
    try {
      const response = await fetch(
        `${API_URL}${API_ENDPOINTS.STORES_MY_STORE}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al obtener tu tienda");
      }

      return response.json();
    } catch (error: any) {
      if (error.message === "Error al obtener tu tienda") {
        throw error;
      }
      return null;
    }
  },

  /**
   * Actualizar una tienda
   */
  async updateStore(
    storeId: string,
    updates: Partial<CreateStoreRequest>,
    token: string
  ): Promise<Store> {
    const response = await fetch(
      `${API_URL}${API_ENDPOINTS.STORES_BY_ID(storeId)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al actualizar la tienda");
    }

    return response.json();
  },

  /**
   * Eliminar una tienda
   */
  async deleteStore(storeId: string, token: string): Promise<void> {
    const response = await fetch(
      `${API_URL}${API_ENDPOINTS.STORES_BY_ID(storeId)}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al eliminar la tienda");
    }
  },
};

export default storeService;
