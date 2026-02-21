const express = require("express");
const router = express.Router();
const claveMediosController = require("../controllers/claveMediosController");
const verifyToken = require("../middlewares/authMiddleware");

router.use(verifyToken);
router.post("/", claveMediosController.generarClaveDesdeSerial);

module.exports = router;
