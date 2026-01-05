const express = require("express");
const router = express.Router();
const clientesController = require("../controllers/clientesController");
const verifyToken = require("../middlewares/authMiddleware");

// Todas las rutas de clientes quedan protegidas
router.use(verifyToken);

router.get("/", clientesController.getAll);
router.get("/:nit", clientesController.getByNit);
router.post("/", clientesController.create);
router.put("/:id", clientesController.update);
router.delete("/:id", clientesController.delete);

module.exports = router;
