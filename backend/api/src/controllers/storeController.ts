import { Response } from "express";
import { RequestWithUser } from "../types";
import { storeService } from "../services/storeService";

export const storeController = {
  /**
   * Crear una nueva solicitud de tienda
   */
  async createStoreRequest(req: RequestWithUser, res: Response) {
    try {
      console.log("📝 Store request received");
      const userId = req.user?.id;
      console.log("👤 User ID:", userId);

      if (!userId) {
        console.log("❌ No user ID found");
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      // Verificar si el usuario ya tiene una tienda
      const existingStore = await storeService.getStoreByOwnerId(userId);
      console.log("🏪 Existing store:", existingStore ? "Found" : "None");
      
      if (existingStore) {
        console.log("❌ User already has a store");
        return res
          .status(400)
          .json({ error: "Ya tienes una tienda registrada" });
      }

      const {
        store_name,
        legal_name,
        cif_nif,
        contact_email,
        phone_number,
        website_url,
        logo_url,
        short_description,
        location,
      } = req.body;

      console.log("📋 Store data received:", {
        store_name,
        legal_name,
        cif_nif,
        contact_email,
        phone_number,
        location,
      });

      // Validar campos requeridos
      if (
        !store_name ||
        !legal_name ||
        !cif_nif ||
        !contact_email ||
        !phone_number ||
        !location
      ) {
        console.log("❌ Missing required fields");
        return res.status(400).json({
          error: "Faltan campos requeridos",
        });
      }

      console.log("✅ Creating store...");
      const store = await storeService.createStore({
        store_name,
        legal_name,
        cif_nif,
        contact_email,
        phone_number,
        website_url,
        logo_url,
        short_description,
        location,
        admin_user_id: userId,
      });

      console.log("✅ Store created successfully:", store.id);
      return res.status(201).json({
        success: true,
        message:
          "Solicitud de tienda creada. Pendiente de verificación por un administrador",
        store,
      });
    } catch (error: any) {
      console.error("❌ Error creating store request:", error);
      console.error("Error details:", error.message);
      return res.status(500).json({ 
        error: "Error al crear la tienda",
        details: error.message 
      });
    }
  },

  /**
   * Obtener todas las tiendas (filtrar por verified)
   */
  async getAllStores(req: RequestWithUser, res: Response) {
    try {
      const { verified } = req.query;
      const verifiedFilter =
        verified === "true" ? true : verified === "false" ? false : undefined;

      const stores = await storeService.getAllStores(verifiedFilter);

      return res.status(200).json(stores);
    } catch (error) {
      console.error("Error fetching stores:", error);
      return res.status(500).json({ error: "Error al obtener las tiendas" });
    }
  },

  /**
   * Obtener tienda por ID
   */
  async getStoreById(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;

      const store = await storeService.getStoreById(id);

      if (!store) {
        return res.status(404).json({ error: "Tienda no encontrada" });
      }

      return res.status(200).json(store);
    } catch (error) {
      console.error("Error fetching store:", error);
      return res.status(500).json({ error: "Error al obtener la tienda" });
    }
  },

  /**
   * Obtener la tienda del usuario actual
   */
  async getMyStore(req: RequestWithUser, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const store = await storeService.getStoreByOwnerId(userId);

      if (!store) {
        return res.status(404).json({ error: "No tienes una tienda registrada" });
      }

      return res.status(200).json(store);
    } catch (error) {
      console.error("Error fetching my store:", error);
      return res.status(500).json({ error: "Error al obtener tu tienda" });
    }
  },

  /**
   * Actualizar tienda (solo el propietario o admin)
   */
  async updateStore(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const store = await storeService.getStoreById(id);

      if (!store) {
        return res.status(404).json({ error: "Tienda no encontrada" });
      }

      // Verificar permisos: debe ser el propietario o admin
      if (
        store.admin_user_id !== userId &&
        userRole?.toLowerCase() !== "admin"
      ) {
        return res
          .status(403)
          .json({ error: "No tienes permiso para actualizar esta tienda" });
      }

      const updates = req.body;
      const updatedStore = await storeService.updateStore(id, updates);

      return res.status(200).json(updatedStore);
    } catch (error) {
      console.error("Error updating store:", error);
      return res.status(500).json({ error: "Error al actualizar la tienda" });
    }
  },

  /**
   * Eliminar tienda (solo el propietario o admin)
   */
  async deleteStore(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const store = await storeService.getStoreById(id);

      if (!store) {
        return res.status(404).json({ error: "Tienda no encontrada" });
      }

      // Verificar permisos: debe ser el propietario o admin
      if (
        store.admin_user_id !== userId &&
        userRole?.toLowerCase() !== "admin"
      ) {
        return res
          .status(403)
          .json({ error: "No tienes permiso para eliminar esta tienda" });
      }

      await storeService.deleteStore(id);

      return res.status(200).json({ message: "Tienda eliminada exitosamente" });
    } catch (error) {
      console.error("Error deleting store:", error);
      return res.status(500).json({ error: "Error al eliminar la tienda" });
    }
  },
};
