const express = require("express");
const { leer, guardar } = require("../utils/almacen");
const { requiereRol } = require("../middleware/auth");

const router = express.Router();
const CATEGORIAS = ["Masculino", "Femenino", "Unisex"];
const UNIDADES = ["und", "caja"];

function estado(p) {
  if (p.stock === 0) return "Agotado";
  if (p.minStock > 0 && p.stock <= p.minStock) return "Stock bajo";
  return "Normal";
}

function validar(b) {
  if (!b.codigo || !b.nombre || !b.categoria || b.stock === undefined || b.costo === undefined) {
    return "Debe enviar codigo, nombre, categoria, stock y costo";
  }
  if (!CATEGORIAS.includes(b.categoria)) return "Categoria debe ser Masculino, Femenino o Unisex";
  if (b.unidad && !UNIDADES.includes(b.unidad)) return "Unidad debe ser und o caja";
  const nums = [b.stock, b.costo, b.stockMinimo ?? 0];
  if (nums.some((n) => !Number.isInteger(n) || n < 0)) {
    return "stock, costo y stockMinimo deben ser enteros mayores o iguales a 0";
  }
  return null;
}

// GET /productos?buscar=texto&categoria=Unisex  (ambos roles)
router.get("/", (req, res) => {
  const { buscar, categoria } = req.query;
  let lista = leer("productos");
  if (buscar) lista = lista.filter((p) => p.nombre.toLowerCase().includes(buscar.toLowerCase()));
  if (categoria) lista = lista.filter((p) => p.categoria === categoria);
  res.json(lista.map((p) => ({ ...p, estado: estado(p) })));
});

// GET /productos/:codigo
router.get("/:codigo", (req, res) => {
  const p = leer("productos").find((x) => x.codigo === req.params.codigo);
  if (!p) return res.status(404).json({ mensaje: "Producto no encontrado" });
  res.json({ ...p, estado: estado(p) });
});

// POST /productos  (solo inventario)
router.post("/", requiereRol("inventario"), (req, res) => {
  const error = validar(req.body);
  if (error) return res.status(400).json({ mensaje: error });
  const productos = leer("productos");
  if (productos.find((p) => p.codigo === req.body.codigo)) {
    return res.status(409).json({ mensaje: "Ya existe un producto con ese codigo" });
  }
  const { codigo, nombre, categoria, stock, costo } = req.body;
  const nuevo = {
    codigo: codigo.trim(),
    nombre: nombre.trim(),
    categoria,
    stock,
    unidad: req.body.unidad || "und",
    costo,
    stockMinimo: req.body.stockMinimo ?? 0,
  };
  productos.push(nuevo);
  guardar("productos", productos);
  res.status(201).json({ mensaje: "Producto registrado correctamente", producto: nuevo });
});

// PUT /productos/:codigo  (solo inventario)
router.put("/:codigo", requiereRol("inventario"), (req, res) => {
  const productos = leer("productos");
  const i = productos.findIndex((p) => p.codigo === req.params.codigo);
  if (i === -1) return res.status(404).json({ mensaje: "Producto no encontrado" });
  const combinado = { ...productos[i], ...req.body, codigo: productos[i].codigo };
  const error = validar(combinado);
  if (error) return res.status(400).json({ mensaje: error });
  productos[i] = combinado;
  guardar("productos", productos);
  res.json({ mensaje: "Producto actualizado correctamente", producto: combinado });
});

// DELETE /productos/:codigo  (solo inventario)
router.delete("/:codigo", requiereRol("inventario"), (req, res) => {
  const productos = leer("productos");
  const restantes = productos.filter((p) => p.codigo !== req.params.codigo);
  if (restantes.length === productos.length) {
    return res.status(404).json({ mensaje: "Producto no encontrado" });
  }
  guardar("productos", restantes);
  res.json({ mensaje: "Producto eliminado correctamente" });
});

module.exports = router;
