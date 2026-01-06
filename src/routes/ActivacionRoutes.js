const express = require("express");
const router = express.Router();
const ActivacionController = require("../controllers/ActivacionController");
const verifyToken = require("../middlewares/authMiddleware");

router.use(verifyToken);

router.get("/", ActivacionController.getAll);
router.get("/venta/:venta_id", ActivacionController.getByVenta);
router.post("/", ActivacionController.create);
router.delete("/:id", ActivacionController.delete);

module.exports = router;
