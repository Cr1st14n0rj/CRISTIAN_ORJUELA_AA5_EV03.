// Crea los usuarios iniciales si todavia no existe ninguno.
// Son los mismos accesos que antes estaban fijos en el frontend.
const bcrypt = require("bcryptjs");
const { leer, guardar } = require("./almacen");

async function crearUsuariosIniciales() {
  if (leer("usuarios").length > 0) return;
  const iniciales = [
    { usuario: "inventario", contrasena: "inv123", rol: "inventario" },
    { usuario: "facturacion", contrasena: "fac123", rol: "facturacion" },
  ];
  const usuarios = [];
  for (const u of iniciales) {
    usuarios.push({ usuario: u.usuario, contrasena: await bcrypt.hash(u.contrasena, 10), rol: u.rol });
  }
  guardar("usuarios", usuarios);
  console.log("Usuarios iniciales creados: inventario y facturacion");
}

module.exports = { crearUsuariosIniciales };
