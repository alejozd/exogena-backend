jest.mock("../../config/db", () => ({
  activaciones: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

const prisma = require("../../config/db");
const activacionController = require("../activacionController");

describe("activacionController", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("retorna 400 si faltan datos obligatorios", async () => {
      req.body = { venta_id: 1 };

      await activacionController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Faltan datos obligatorios" });
      expect(prisma.activaciones.create).not.toHaveBeenCalled();
    });

    it("crea activación con datos válidos", async () => {
      req.body = {
        venta_id: 1,
        mac_servidor: "AA:BB:CC:DD:EE:FF",
        clave_generada: "abc123",
      };
      prisma.activaciones.create.mockResolvedValue({ id: 1 });

      await activacionController.create(req, res);

      expect(prisma.activaciones.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          venta_id: BigInt(1),
          mac_servidor: "AA:BB:CC:DD:EE:FF",
          clave_generada: "abc123",
        }),
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: "Activación registrada con éxito" });
    });
  });

  describe("delete", () => {
    it("ejecuta borrado lógico", async () => {
      req.params = { id: "5" };
      prisma.activaciones.update.mockResolvedValue({});

      await activacionController.delete(req, res);

      expect(prisma.activaciones.update).toHaveBeenCalledWith({
        where: { id: BigInt(5) },
        data: { deleted_at: expect.any(Date) },
      });
      expect(res.json).toHaveBeenCalledWith({ message: "Activación eliminada" });
    });
  });

  describe("getAll", () => {
    it("retorna lista serializada con BigInt convertidos", async () => {
      const mockData = [{ id: BigInt(1), venta_id: BigInt(10) }];
      prisma.activaciones.findMany.mockResolvedValue(mockData);

      await activacionController.getAll(req, res);

      expect(res.json).toHaveBeenCalledWith([{ id: "1", venta_id: "10" }]);
    });
  });

  describe("getByVenta", () => {
    it("filtra por venta_id", async () => {
      req.params = { venta_id: "99" };
      prisma.activaciones.findMany.mockResolvedValue([]);

      await activacionController.getByVenta(req, res);

      expect(prisma.activaciones.findMany).toHaveBeenCalledWith({
        where: { venta_id: BigInt(99), deleted_at: null },
        orderBy: { fecha_activacion: "desc" },
      });
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });
});
