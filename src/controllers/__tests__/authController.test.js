const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

jest.mock("../../config/db", () => ({
  usuarios: {
    findUnique: jest.fn(),
  },
  $queryRaw: jest.fn(),
}));

const prisma = require("../../config/db");
const authController = require("../authController");

describe("authController - login", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    process.env.JWT_SECRET = "test-secret";
    jest.clearAllMocks();
  });

  it("retorna 400 si faltan email o password", async () => {
    req.body = {};

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Email y contraseña son obligatorios",
    });
  });

  it("retorna 400 si email está vacío", async () => {
    req.body = { email: "   ", password: "pass123" };

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("retorna 500 si JWT_SECRET no está configurado", async () => {
    delete process.env.JWT_SECRET;
    req.body = { email: "user@test.com", password: "pass" };

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    process.env.JWT_SECRET = "test-secret";
  });

  it("retorna 401 si el usuario no existe", async () => {
    prisma.usuarios.findUnique.mockResolvedValue(null);
    prisma.$queryRaw.mockResolvedValue([]);
    req.body = { email: "noexiste@test.com", password: "pass" };

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Credenciales inválidas" });
  });

  it("retorna 401 si el usuario está inactivo", async () => {
    prisma.usuarios.findUnique.mockResolvedValue({
      id: 1,
      nombre: "Test",
      email: "test@test.com",
      password: await bcrypt.hash("pass123", 10),
      rol: "admin",
      activo: false,
    });
    prisma.$queryRaw.mockResolvedValue([]);
    req.body = { email: "test@test.com", password: "pass123" };

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Credenciales inválidas" });
  });

  it("retorna token y usuario si las credenciales son correctas", async () => {
    const hashedPassword = await bcrypt.hash("pass123", 10);
    prisma.usuarios.findUnique.mockResolvedValue({
      id: 1,
      nombre: "Usuario Test",
      email: "test@test.com",
      password: hashedPassword,
      rol: "admin",
      activo: true,
    });
    jwt.sign = jest.fn().mockReturnValue("jwt-token-mock");
    req.body = { email: "test@test.com", password: "pass123" };

    await authController.login(req, res);

    expect(res.json).toHaveBeenCalledWith({
      token: "jwt-token-mock",
      usuario: {
        nombre: "Usuario Test",
        email: "test@test.com",
        rol: "admin",
      },
    });
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 1, rol: "admin" },
      "test-secret",
      expect.objectContaining({ expiresIn: expect.any(String) })
    );
  });

  it("retorna 401 si la contraseña es incorrecta", async () => {
    const hashedPassword = await bcrypt.hash("correcta", 10);
    prisma.usuarios.findUnique.mockResolvedValue({
      id: 1,
      nombre: "Test",
      email: "test@test.com",
      password: hashedPassword,
      rol: "admin",
      activo: true,
    });
    req.body = { email: "test@test.com", password: "incorrecta" };

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Credenciales inválidas" });
  });
});
