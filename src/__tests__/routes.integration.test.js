const http = require("http");

// Mock Prisma antes de cargar la app
jest.mock("../config/db", () => ({
  usuarios: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() },
  clientes: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  vendedores: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  seriales_erp: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  ventas: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  activaciones: { findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  pagos: { findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  $queryRaw: jest.fn(),
}));

process.env.JWT_SECRET = "test-secret-for-integration";

const app = require("../app");

describe("Rutas de integración", () => {
  describe("GET /", () => {
    it("retorna mensaje de salud", async () => {
      const server = http.createServer(app);
      const result = await new Promise((resolve, reject) => {
        server.listen(0, () => {
          const port = server.address().port;
          http
            .get(`http://localhost:${port}/`, (res) => {
              let data = "";
              res.on("data", (chunk) => (data += chunk));
              res.on("end", () => {
                server.close();
                try {
                  resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch {
                  resolve({ status: res.statusCode, body: data });
                }
              });
            })
            .on("error", (err) => {
              server.close();
              reject(err);
            });
        });
      });

      expect(result.status).toBe(200);
      expect(result.body).toHaveProperty("message", "Exógena Backend corriendo correctamente");
      expect(result.body).toHaveProperty("port");
      expect(result.body).toHaveProperty("timestamp");
    });
  });

  describe("POST /api/auth/login", () => {
    it("retorna 400 sin body", async () => {
      const server = http.createServer(app);
      const result = await new Promise((resolve, reject) => {
        server.listen(0, () => {
          const port = server.address().port;
          const postData = JSON.stringify({});
          const req = http.request(
            {
              hostname: "localhost",
              port,
              path: "/api/auth/login",
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(postData),
              },
            },
            (res) => {
              let data = "";
              res.on("data", (chunk) => (data += chunk));
              res.on("end", () => {
                server.close();
                try {
                  resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch {
                  resolve({ status: res.statusCode, body: {} });
                }
              });
            }
          );
          req.on("error", () => {
            server.close();
            reject();
          });
          req.write(postData);
          req.end();
        });
      });

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("error", "Email y contraseña son obligatorios");
    });
  });

  describe("Rutas protegidas sin token", () => {
    it("GET /api/clientes retorna 401", async () => {
      const server = http.createServer(app);
      const result = await new Promise((resolve, reject) => {
        server.listen(0, () => {
          const port = server.address().port;
          http
            .get(`http://localhost:${port}/api/clientes`, (res) => {
              let data = "";
              res.on("data", (chunk) => (data += chunk));
              res.on("end", () => {
                server.close();
                try {
                  resolve({ status: res.statusCode, body: JSON.parse(data || "{}") });
                } catch {
                  resolve({ status: res.statusCode, body: {} });
                }
              });
            })
            .on("error", (err) => {
              server.close();
              reject(err);
            });
        });
      });
      expect(result.status).toBe(401);
    });
  });

  describe("Ruta no encontrada", () => {
    it("retorna 404 para ruta inexistente", async () => {
      const server = http.createServer(app);
      const result = await new Promise((resolve, reject) => {
        server.listen(0, () => {
          const port = server.address().port;
          http
            .get(`http://localhost:${port}/api/ruta-que-no-existe`, (res) => {
              let data = "";
              res.on("data", (chunk) => (data += chunk));
              res.on("end", () => {
                server.close();
                try {
                  resolve({ status: res.statusCode, body: JSON.parse(data || "{}") });
                } catch {
                  resolve({ status: res.statusCode, body: {} });
                }
              });
            })
            .on("error", (err) => {
              server.close();
              reject(err);
            });
        });
      });

      expect(result.status).toBe(404);
      expect(result.body).toHaveProperty("error", "Ruta no encontrada");
      expect(result.body).toHaveProperty("path");
      expect(result.body).toHaveProperty("method");
    });
  });
});
