const express = require("express");
const router = express.Router();
const vendedoresController = require("../controllers/vendedoresController");
const verifyToken = require("../middlewares/authMiddleware");

// Todas las rutas de vendedores requieren token
router.use(verifyToken);

router.get("/", vendedoresController.getAll);
router.get("/:id", vendedoresController.getById);
router.post("/", vendedoresController.create);

module.exports = router;
