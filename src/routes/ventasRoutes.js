const express = require("express");
const router = express.Router();
const ventasController = require("../controllers/ventasController");
const verifyToken = require("../middlewares/authMiddleware");

router.use(verifyToken);

router.get("/", ventasController.getAll);
router.get("/cliente/:clienteId", ventasController.getByCliente);
router.get("/:id", ventasController.getById);
router.post("/", ventasController.create);
router.put("/:id", ventasController.update);

module.exports = router;
