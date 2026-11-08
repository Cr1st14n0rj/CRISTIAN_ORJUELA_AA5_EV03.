const express = require("express");
const bcrypt = require("bcryptjs");
const { leer, guardar } = require("../utils/almacen");
const { crearToken, verificarToken } = require("../utils/token");

const router = express.Router();
const ROLES = ["inventario", "facturacion"];

// POST /registro  (tambien /auth/registro)
// Body: { usuario, contrasena, rol? }
// Compatible con EV01: solo usuario y contrasena. El rol solo se respeta si
// quien registra envia un token de un usuario de inventario; en otro caso el
// usuario nuevo queda con rol "facturacion".
router.post("/registro", async (req, res) => {
  const { usuario, contrasena, rol } = req.body;
  if (!usuario || !contrasena) {
    return res.status(400).json({ mensaje: "Debe enviar usuario y contrasena" });
  }
  if (rol !== undefined && !ROLES.includes(rol)) {
    return res.status(400).json({ mensaje: "El rol debe ser inventario o facturacion" });
  }
  const encabezado = req.headers.authorization || "";
  const sesion = verificarToken(encabezado.startsWith("Bearer ") ? encabezado.slice(7) : null);
  const rolFinal = sesion && sesion.rol === "inventario" && rol ? rol : "facturacion";

  const usuarios = leer("usuarios");
  if (usuarios.find((u) => u.usuario === usuario)) {
    return res.status(409).json({ mensaje: "El usuario ya existe" });
  }
  const hash = await bcrypt.hash(contrasena, 10);
  usuarios.push({ usuario, contrasena: hash, rol: rolFinal });
  guardar("usuarios", usuarios);
  res.status(201).json({ mensaje: "Usuario registrado correctamente" });
});

// POST /login  (tambien /auth/login)
// Body: { usuario, contrasena }
router.post("/login", async (req, res) => {
  const { usuario, contrasena } = req.body;
  if (!usuario || !contrasena) {
    return res.status(400).json({ mensaje: "Debe enviar usuario y contrasena" });
  }
  const encontrado = leer("usuarios").find((u) => u.usuario === usuario);
  const coincide = encontrado && (await bcrypt.compare(contrasena, encontrado.contrasena));
  if (!coincide) {
    return res.status(401).json({ mensaje: "Error en la autenticación" });
  }
  const token = crearToken({ usuario: encontrado.usuario, rol: encontrado.rol });
  res.status(200).json({ mensaje: "Autenticación satisfactoria", token, rol: encontrado.rol });
});

module.exports = router;
