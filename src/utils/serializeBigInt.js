/**
 * Convierte objetos con BigInt a JSON-serializables (BigInt -> string)
 */
const serializeBigInt = (obj) =>
  JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );

module.exports = { serializeBigInt };
