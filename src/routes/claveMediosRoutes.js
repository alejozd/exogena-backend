const express = require("express");
const router = express.Router();
const claveController = require("../controllers/claveMediosController");
const verifyToken = require("../middlewares/authMiddleware");

router.use(verifyToken);
// Esta ruta servirá para los dos:
// 1. El Front (usando el token del usuario logueado)
// 2. Delphi (usando el token del usuario 'exogena')
router.post("/generar-clave", claveController.generarClaveDesdeSerial);

module.exports = router;
