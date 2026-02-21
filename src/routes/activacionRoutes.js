const express = require("express");
const router = express.Router();
const activacionController = require("../controllers/activacionController");
const verifyToken = require("../middlewares/authMiddleware");

router.use(verifyToken);

router.get("/", activacionController.getAll);
router.get("/venta/:venta_id", activacionController.getByVenta);
router.get("/:id", activacionController.getById);
router.post("/", activacionController.create);
router.delete("/:id", activacionController.delete);

module.exports = router;
