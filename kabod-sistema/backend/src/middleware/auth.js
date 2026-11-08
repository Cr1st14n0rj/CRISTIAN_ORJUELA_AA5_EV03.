const { verificarToken } = require("../utils/token");

// Exige un token válido en el encabezado: Authorization: Bearer <token>
function requiereSesion(req, res, next) {
  const encabezado = req.headers.authorization || "";
  const token = encabezado.startsWith("Bearer ") ? encabezado.slice(7) : null;
  const datos = verificarToken(token);
  if (!datos) {
    return res.status(401).json({ mensaje: "Sesión no válida o expirada" });
  }
  req.usuario = datos;
  next();
}

// Exige que el rol del usuario esté entre los permitidos
function requiereRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: "No tiene permisos para esta operación" });
    }
    next();
  };
}

module.exports = { requiereSesion, requiereRol };
