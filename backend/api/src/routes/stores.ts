import { Router } from "express";
import { authenticateUser } from "../middleware/auth";
import { storeController } from "../controllers/storeController";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateUser);

/**
 * @route   POST /api/v1/stores
 * @desc    Crear una nueva solicitud de tienda
 * @access  Private (usuarios autenticados)
 */
router.post("/", storeController.createStoreRequest);

/**
 * @route   GET /api/v1/stores
 * @desc    Obtener todas las tiendas (query param: verified=true/false)
 * @access  Private
 */
router.get("/", storeController.getAllStores);

/**
 * @route   GET /api/v1/stores/my-store
 * @desc    Obtener la tienda del usuario actual
 * @access  Private
 */
router.get("/my-store", storeController.getMyStore);

/**
 * @route   GET /api/v1/stores/:id
 * @desc    Obtener una tienda por ID
 * @access  Private
 */
router.get("/:id", storeController.getStoreById);

/**
 * @route   PUT /api/v1/stores/:id
 * @desc    Actualizar una tienda (propietario o admin)
 * @access  Private
 */
router.put("/:id", storeController.updateStore);

/**
 * @route   DELETE /api/v1/stores/:id
 * @desc    Eliminar una tienda (propietario o admin)
 * @access  Private
 */
router.delete("/:id", storeController.deleteStore);

export default router;
