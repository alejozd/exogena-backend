jest.mock("../../config/db", () => ({
  seriales_erp: { findFirst: jest.fn() },
  ventas: { findFirst: jest.fn() },
  activaciones: { create: jest.fn() },
}));

const crypto = require("crypto");
const prisma = require("../../config/db");
const claveMediosController = require("../claveMediosController");

// Helper para generar serial válido: Base64(serialERP + "ZS8Q5TKU0" + ano + "|" + mac)
const pistaDos = "ZS8Q5TKU0";
const buildSerial = (serialERP, ano, mac) => {
  const data = `${serialERP}${pistaDos}${ano}|${mac}`;
  return Buffer.from(data, "utf-8").toString("base64");
};

describe("claveMediosController - generarClaveDesdeSerial", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      headers: {},
      socket: { remoteAddress: "127.0.0.1" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("retorna 400 si no hay serial en body", async () => {
    req.body = {};

    await claveMediosController.generarClaveDesdeSerial(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "El serial es requerido." });
  });

  it("retorna 400 si el formato del serial es inválido", async () => {
    req.body = { serial: Buffer.from("datos-invalidos-sin-separador", "utf-8").toString("base64") };

    await claveMediosController.generarClaveDesdeSerial(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Formato de serial inválido." });
  });

  it("retorna 404 si el serial ERP no existe", async () => {
    const serial = buildSerial("SERIAL999", "2024", "AA:BB:CC:DD:EE:FF");
    req.body = { serial };
    prisma.seriales_erp.findFirst.mockResolvedValue(null);

    await claveMediosController.generarClaveDesdeSerial(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "El Serial [SERIAL999] no existe en el sistema.",
    });
  });

  it("retorna 404 si no hay venta para el año", async () => {
    const serial = buildSerial("SERIAL1", "2024", "AA:BB:CC:DD:EE:FF");
    req.body = { serial };
    prisma.seriales_erp.findFirst.mockResolvedValue({
      id: BigInt(1),
      serial_erp: "SERIAL1",
      clientes: { razon_social: "Cliente Test" },
    });
    prisma.ventas.findFirst.mockResolvedValue(null);

    await claveMediosController.generarClaveDesdeSerial(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining("No existe venta registrada"),
      })
    );
  });

  it("genera clave y guarda activación con datos válidos", async () => {
    const serialERP = "SERIAL1";
    const ano = "2024";
    const mac = "AABBCCDDEEFF";
    const serial = buildSerial(serialERP, ano, mac);
    req.body = { serial };

    const ventaId = BigInt(10);
    prisma.seriales_erp.findFirst.mockResolvedValue({
      id: BigInt(1),
      serial_erp: serialERP,
      clientes: { razon_social: "Cliente Test" },
    });
    prisma.ventas.findFirst.mockResolvedValue({ id: ventaId });
    prisma.activaciones.create.mockResolvedValue({});

    await claveMediosController.generarClaveDesdeSerial(req, res);

    const datosConcatenados = `${serialERP}${pistaDos}${ano}|${mac}`;
    const claveEsperada = crypto
      .createHash("md5")
      .update(datosConcatenados)
      .digest("hex")
      .toUpperCase();

    expect(prisma.activaciones.create).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      serialERP,
      anoMedios: ano,
      macServidor: mac,
      claveGenerada: claveEsperada,
      clienteNombre: "Cliente Test",
      info: "Activación registrada con éxito.",
    });
  });
});
