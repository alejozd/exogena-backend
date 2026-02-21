const { serializeBigInt } = require("../serializeBigInt");

describe("serializeBigInt", () => {
  it("convierte BigInt a string", () => {
    const input = { id: BigInt(123), nombre: "test" };
    const result = serializeBigInt(input);
    expect(result).toEqual({ id: "123", nombre: "test" });
  });

  it("maneja arrays con BigInt", () => {
    const input = [{ id: BigInt(1) }, { id: BigInt(2) }];
    const result = serializeBigInt(input);
    expect(result).toEqual([{ id: "1" }, { id: "2" }]);
  });

  it("no modifica valores que no son BigInt", () => {
    const input = { id: 42, texto: "hola", activo: true };
    const result = serializeBigInt(input);
    expect(result).toEqual({ id: 42, texto: "hola", activo: true });
  });

  it("maneja objetos anidados con BigInt", () => {
    const input = { venta: { id: BigInt(999), cliente_id: BigInt(100) } };
    const result = serializeBigInt(input);
    expect(result).toEqual({ venta: { id: "999", cliente_id: "100" } });
  });

  it("maneja null (objeto raíz)", () => {
    // serializeBigInt con null: JSON.stringify(null) => "null", JSON.parse("null") => null
    expect(serializeBigInt(null)).toBeNull();
  });
});
