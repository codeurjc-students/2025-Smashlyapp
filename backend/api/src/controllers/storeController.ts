import { Response } from "express";
import { RequestWithUser } from "../types";
import logger from "../config/logger";
import { storeService } from "../services/storeService";

// Helper functions to reduce complexity
const validateStoreData = (storeData: unknown) => {
  const {
    store_name,
    legal_name,
    cif_nif,
    contact_email,
    phone_number,
    location,
  } = storeData as Record<string, unknown>;

  return !!(
    store_name &&
    legal_name &&
    cif_nif &&
    contact_email &&
    phone_number &&
    location
  );
};

const checkUserAuthentication = (userId: string | undefined, res: Response) => {
  if (!userId) {
    logger.info("❌ No user ID found");
    res.status(401).json({ error: "Usuario no autenticado" });
    return false;
  }
  return true;
};

const checkExistingStore = async (userId: string, res: Response) => {
  const existingStore = await storeService.getStoreByOwnerId(userId);
  logger.info("🏪 Existing store:", existingStore ? "Found" : "None");
  
  if (existingStore) {
    logger.info("❌ User already has a store");
    res.status(400).json({ error: "Ya tienes una tienda registrada" });
    return false;
  }
  return true;
};

export const storeController = {
  /**
   * Crear una nueva solicitud de tienda
   */
  async createStoreRequest(req: RequestWithUser, res: Response) {
    try {
      logger.info("📝 Store request received");
      const userId = req.user?.id;
      logger.info("👤 User ID:", userId);

      if (!checkUserAuthentication(userId, res)) return;
      if (!(await checkExistingStore(userId!, res))) return;

      const storeData = req.body;
      logger.info("📋 Store data received:", storeData);

      if (!validateStoreData(storeData)) {
        logger.info("❌ Missing required fields");
        return res.status(400).json({
          error: "Faltan campos requeridos",
        });
      }

      logger.info("✅ Creating store...");
      const store = await storeService.createStore({
        ...storeData,
        admin_user_id: userId,
      });

      logger.info("✅ Store created successfully:", store.id);
      return res.status(201).json({
        success: true,
        message:
        "Store request created. Pending verification by an administrator",
        store,
      });
    } catch (error: unknown) {
      logger.error("❌ Error creating store request:", error);
      return res.status(500).json({ 
        error: "Error al crear la tienda",
        details: (error as Error).message 
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
      logger.error("Error fetching stores:", error);
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
      logger.error("Error fetching store:", error);
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
      logger.error("Error fetching my store:", error);
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
      logger.error("Error updating store:", error);
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
      logger.error("Error deleting store:", error);
      return res.status(500).json({ error: "Error al eliminar la tienda" });
    }
  },
};
