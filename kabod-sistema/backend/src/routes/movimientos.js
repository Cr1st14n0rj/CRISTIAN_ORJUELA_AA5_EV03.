const express = require("express");
const { leer, guardar } = require("../utils/almacen");
const { requiereRol } = require("../middleware/auth");

const router = express.Router();

// GET /movimientos?tipo=Entrada  (solo inventario)
router.get("/", requiereRol("inventario"), (req, res) => {
  let lista = leer("movimientos");
  if (req.query.tipo) lista = lista.filter((m) => m.tipo === req.query.tipo);
  res.json(lista);
});

// POST /movimientos  { tipo, fecha, codigoProducto, cantidad, responsable }
// Actualiza el stock del producto: Entrada suma, Salida resta.
router.post("/", requiereRol("inventario"), (req, res) => {
  const { tipo, fecha, codigoProducto, cantidad, responsable } = req.body;
  if (!tipo || !fecha || !codigoProducto || !cantidad || !responsable) {
    return res.status(400).json({
      mensaje: "Debe enviar tipo, fecha, codigoProducto, cantidad y responsable",
    });
  }
  if (!["Entrada", "Salida"].includes(tipo)) {
    return res.status(400).json({ mensaje: "Tipo debe ser Entrada o Salida" });
  }
  if (!Number.isInteger(cantidad) || cantidad < 1) {
    return res.status(400).json({ mensaje: "La cantidad debe ser un entero mayor a 0" });
  }
  const productos = leer("productos");
  const producto = productos.find((p) => p.codigo === codigoProducto);
  if (!producto) return res.status(404).json({ mensaje: "Producto no encontrado" });
  if (tipo === "Salida" && cantidad > producto.stock) {
    return res.status(409).json({ mensaje: `Stock insuficiente. Disponible: ${producto.stock}` });
  }
  producto.stock += tipo === "Entrada" ? cantidad : -cantidad;
  guardar("productos", productos);

  const movimientos = leer("movimientos");
  const nuevo = {
    id: `MOV-${String(movimientos.length + 1).padStart(4, "0")}`,
    tipo,
    fecha,
    codigoProducto,
    producto: producto.nombre,
    categoria: producto.categoria,
    cantidad,
    responsable: responsable.trim(),
  };
  movimientos.unshift(nuevo);
  guardar("movimientos", movimientos);
  res.status(201).json({ mensaje: "Movimiento registrado correctamente", movimiento: nuevo });
});

// DELETE /movimientos/:id  (solo elimina el registro, no revierte el stock)
router.delete("/:id", requiereRol("inventario"), (req, res) => {
  const movimientos = leer("movimientos");
  const restantes = movimientos.filter((m) => m.id !== req.params.id);
  if (restantes.length === movimientos.length) {
    return res.status(404).json({ mensaje: "Movimiento no encontrado" });
  }
  guardar("movimientos", restantes);
  res.json({ mensaje: "Movimiento eliminado correctamente" });
});

module.exports = router;
