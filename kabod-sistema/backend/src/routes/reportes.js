const express = require("express");
const { leer } = require("../utils/almacen");
const { requiereRol } = require("../middleware/auth");

const router = express.Router();

// GET /reportes/ventas  (solo facturacion)
router.get("/ventas", requiereRol("facturacion"), (req, res) => {
  const porMes = {};
  leer("facturas").forEach((f) => {
    const mes = f.fecha.slice(0, 7); // AAAA-MM
    porMes[mes] = porMes[mes] || { mes, facturas: 0, ventasBrutas: 0, iva: 0, totalNeto: 0 };
    porMes[mes].facturas += 1;
    porMes[mes].ventasBrutas += f.subtotal;
    porMes[mes].iva += f.iva;
    porMes[mes].totalNeto += f.total;
  });
  const meses = Object.values(porMes).sort((a, b) => a.mes.localeCompare(b.mes));
  const totalAcumulado = meses.reduce((s, m) => s + m.totalNeto, 0);
  const mejor = meses.reduce((b, m) => (!b || m.totalNeto > b.totalNeto ? m : b), null);
  res.json({
    totalAcumulado,
    promedioMensual: meses.length ? Math.round(totalAcumulado / meses.length) : 0,
    mejorMes: mejor ? mejor.mes : null,
    ventasPorMes: meses,
  });
});

module.exports = router;
