const rateLimit = require("express-rate-limit");

/**
 * Rate limit para login: 5 intentos por minuto por IP
 * Previene fuerza bruta en credenciales
 */
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5,
  message: {
    error: "Demasiados intentos de login. Intente nuevamente en un minuto.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter };
