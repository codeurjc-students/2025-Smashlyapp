import { Router } from "express";
import { authenticateUser } from "../middleware/auth";
import { validatePagination } from "../middleware/validation";
import { storeController as StoreController } from "../controllers/storeController";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateUser);

/**
 * @route   POST /api/v1/stores
 * @desc    Create a new store request
 * @access  Private (authenticated users)
 */
router.post("/", authenticateUser, StoreController.createStoreRequest);

/**
 * @route   GET /api/v1/stores
 * @desc    Get all stores (query param: verified=true/false)
 * @access  Public
 */
router.get("/", validatePagination, StoreController.getAllStores);

/**
 * @route   GET /api/v1/stores/me
 * @desc    Get current user's store
 * @access  Private
 */
router.get("/me", authenticateUser, StoreController.getMyStore);

/**
 * @route   GET /api/v1/stores/:id
 * @desc    Get a store by ID
 * @access  Public
 */
router.get("/:id", StoreController.getStoreById);

/**
 * @route   PUT /api/v1/stores/:id
 * @desc    Update a store (owner or admin)
 * @access  Private
 */
router.put("/:id", authenticateUser, StoreController.updateStore);

/**
 * @route   DELETE /api/v1/stores/:id
 * @desc    Delete a store (owner or admin)
 * @access  Private
 */
router.delete("/:id", StoreController.deleteStore);

export default router;
