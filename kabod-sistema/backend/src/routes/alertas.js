const express = require("express");
const { leer } = require("../utils/almacen");
const { requiereRol } = require("../middleware/auth");

const router = express.Router();

// GET /alertas  -> productos agotados o con stock bajo (solo inventario)
router.get("/", requiereRol("inventario"), (req, res) => {
  const alertas = leer("productos")
    .filter((p) => p.stock === 0 || (p.stockMinimo > 0 && p.stock <= p.stockMinimo))
    .map((p) => ({
      codigo: p.codigo,
      nombre: p.nombre,
      categoria: p.categoria,
      stock: p.stock,
      unidad: p.unidad,
      stockMinimo: p.stockMinimo,
      alerta: p.stock === 0 ? "Agotado" : "Stock bajo",
    }));
  res.json(alertas);
});

module.exports = router;
