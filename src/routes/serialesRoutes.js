const express = require("express");
const router = express.Router();
const serialesController = require("../controllers/serialesController");
const verifyToken = require("../middlewares/authMiddleware");

router.use(verifyToken);

router.get("/", serialesController.getAll);
router.get("/cliente/:clienteId", serialesController.getByCliente);
router.post("/", serialesController.create);
router.delete("/:id", serialesController.delete);
router.put("/:id", serialesController.update);

module.exports = router;
