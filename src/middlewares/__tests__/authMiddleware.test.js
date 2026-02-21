const jwt = require("jsonwebtoken");

jest.mock("jsonwebtoken");

const verifyToken = require("../authMiddleware");

describe("authMiddleware - verifyToken", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    process.env.JWT_SECRET = "test-secret";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("retorna 401 si no hay token", () => {
    req.headers.authorization = undefined;

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Acceso denegado. Token no proporcionado.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("retorna 401 si el header Authorization está vacío", () => {
    req.headers.authorization = "";

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("llama a next() si el token es válido", () => {
    const decoded = { id: 1, rol: "admin" };
    jwt.verify.mockReturnValue(decoded);
    req.headers.authorization = "Bearer valid-token";

    verifyToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith("valid-token", "test-secret");
    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("retorna 401 si el token es inválido", () => {
    jwt.verify.mockImplementation(() => {
      throw new Error("invalid token");
    });
    req.headers.authorization = "Bearer invalid-token";

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Token inválido o expirado.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("extrae correctamente el token del formato Bearer", () => {
    const decoded = { id: 2 };
    jwt.verify.mockReturnValue(decoded);
    req.headers.authorization = "Bearer mi-token-abc123";

    verifyToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith("mi-token-abc123", "test-secret");
    expect(req.user).toEqual(decoded);
  });
});
