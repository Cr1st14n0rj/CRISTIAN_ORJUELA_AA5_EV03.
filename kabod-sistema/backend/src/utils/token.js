// Token firmado con HMAC-SHA256 usando solo módulos nativos de Node
const crypto = require("crypto");

const SECRETO = process.env.TOKEN_SECRETO || "kabod-secreto-desarrollo";
const DURACION_MS = 8 * 60 * 60 * 1000; // 8 horas

function b64(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

function firmar(contenido) {
  return crypto.createHmac("sha256", SECRETO).update(contenido).digest("base64url");
}

function crearToken(datos) {
  const cuerpo = b64({ ...datos, exp: Date.now() + DURACION_MS });
  return `${cuerpo}.${firmar(cuerpo)}`;
}

function verificarToken(token) {
  if (!token || !token.includes(".")) return null;
  const [cuerpo, firma] = token.split(".");
  const esperada = firmar(cuerpo);
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const datos = JSON.parse(Buffer.from(cuerpo, "base64url").toString("utf8"));
  if (datos.exp < Date.now()) return null;
  return datos;
}

module.exports = { crearToken, verificarToken };
