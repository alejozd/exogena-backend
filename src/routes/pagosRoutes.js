const express = require("express");
const router = express.Router();
const pagosController = require("../controllers/pagosController");
const verifyToken = require("../middlewares/authMiddleware");

router.use(verifyToken);

router.get("/", pagosController.getAll);
router.get("/venta/:ventaId", pagosController.getByVenta);
router.post("/", pagosController.create);

module.exports = router;
