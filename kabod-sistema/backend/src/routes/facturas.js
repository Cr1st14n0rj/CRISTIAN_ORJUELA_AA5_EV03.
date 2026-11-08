const express = require("express");
const { leer, guardar } = require("../utils/almacen");
const { requiereRol } = require("../middleware/auth");

const router = express.Router();
// Condiciones de pago de la pantalla Nueva factura -> dias de plazo
const CONDICIONES = { Contado: 0, "15 días": 15, "30 días": 30, "45 días": 45 };
const IVA_PERMITIDOS = [0, 5, 19];

// GET /facturas?estado=Pendiente  (solo facturacion)
router.get("/", requiereRol("facturacion"), (req, res) => {
  let lista = leer("facturas");
  if (req.query.estado) lista = lista.filter((f) => f.estado === req.query.estado);
  res.json(lista);
});

router.get("/:numero", requiereRol("facturacion"), (req, res) => {
  const f = leer("facturas").find((x) => x.numero === req.params.numero);
  if (!f) return res.status(404).json({ mensaje: "Factura no encontrada" });
  res.json(f);
});

// POST /facturas
// { nitCliente, fecha: "2026-11-07", condicionPago,
//   lineas: [{ codigoProducto, cantidad, iva }] }
// condicionPago: "Contado" | "15 días" | "30 días" | "45 días"
// Descuenta el stock y registra un movimiento de Salida por cada linea.
router.post("/", requiereRol("facturacion"), (req, res) => {
  const { nitCliente, fecha, condicionPago, lineas } = req.body;
  if (!nitCliente || !fecha || !condicionPago || !Array.isArray(lineas) || lineas.length === 0) {
    return res.status(400).json({
      mensaje: "Debe enviar nitCliente, fecha, condicionPago y al menos una linea",
    });
  }
  if (!Object.prototype.hasOwnProperty.call(CONDICIONES, condicionPago)) {
    return res.status(400).json({ mensaje: "condicionPago debe ser Contado, 15 días, 30 días o 45 días" });
  }
  const emision = new Date(`${fecha}T12:00:00`);
  if (Number.isNaN(emision.getTime())) {
    return res.status(400).json({ mensaje: "Fecha invalida. Use el formato AAAA-MM-DD" });
  }
  const cliente = leer("clientes").find((c) => c.nit === nitCliente);
  if (!cliente) return res.status(404).json({ mensaje: "Cliente no encontrado" });

  const productos = leer("productos");
  const detalle = [];
  for (const l of lineas) {
    const producto = productos.find((p) => p.codigo === l.codigoProducto);
    if (!producto) {
      return res.status(404).json({ mensaje: `Producto ${l.codigoProducto} no encontrado` });
    }
    if (!Number.isInteger(l.cantidad) || l.cantidad < 1) {
      return res.status(400).json({ mensaje: `Cantidad invalida para ${producto.codigo}` });
    }
    const iva = l.iva === undefined ? 19 : l.iva;
    if (!IVA_PERMITIDOS.includes(iva)) {
      return res.status(400).json({ mensaje: "iva debe ser 0, 5 o 19" });
    }
    const yaPedido = detalle
      .filter((d) => d.codigoProducto === producto.codigo)
      .reduce((s, d) => s + d.cantidad, 0);
    if (l.cantidad + yaPedido > producto.stock) {
      return res.status(409).json({
        mensaje: `Stock insuficiente para ${producto.codigo}. Disponible: ${producto.stock}`,
      });
    }
    detalle.push({
      codigoProducto: producto.codigo,
      nombre: producto.nombre,
      cantidad: l.cantidad,
      precio: producto.costo,
      iva,
    });
  }

  const subtotal = detalle.reduce((s, d) => s + d.cantidad * d.precio, 0);
  const ivaTotal = detalle.reduce((s, d) => s + d.cantidad * d.precio * (d.iva / 100), 0);
  const vence = new Date(emision);
  vence.setDate(vence.getDate() + CONDICIONES[condicionPago]);

  const facturas = leer("facturas");
  const numero = `FV-${String(facturas.length + 1).padStart(4, "0")}`;
  const factura = {
    numero,
    cliente: cliente.nombre,
    nitCliente,
    fecha,
    vencimiento: vence.toISOString().split("T")[0],
    condicionPago,
    estado: condicionPago === "Contado" ? "Pagada" : "Pendiente",
    lineas: detalle,
    subtotal: Math.round(subtotal),
    iva: Math.round(ivaTotal),
    total: Math.round(subtotal + ivaTotal),
  };

  // Descontar stock y registrar salidas
  const movimientos = leer("movimientos");
  detalle.forEach((d) => {
    const p = productos.find((x) => x.codigo === d.codigoProducto);
    p.stock -= d.cantidad;
    movimientos.unshift({
      id: `MOV-${String(movimientos.length + 1).padStart(4, "0")}`,
      tipo: "Salida",
      fecha,
      codigoProducto: p.codigo,
      producto: p.nombre,
      categoria: p.categoria,
      cantidad: d.cantidad,
      responsable: `Factura ${numero} - ${cliente.nombre}`,
    });
  });
  guardar("productos", productos);
  guardar("movimientos", movimientos);
  facturas.unshift(factura);
  guardar("facturas", facturas);

  res.status(201).json({ mensaje: "Factura emitida correctamente", factura });
});

// PATCH /facturas/:numero/pagar  -> marca una factura a credito como Pagada
router.patch("/:numero/pagar", requiereRol("facturacion"), (req, res) => {
  const facturas = leer("facturas");
  const f = facturas.find((x) => x.numero === req.params.numero);
  if (!f) return res.status(404).json({ mensaje: "Factura no encontrada" });
  if (f.estado === "Pagada") return res.status(409).json({ mensaje: "La factura ya esta pagada" });
  f.estado = "Pagada";
  guardar("facturas", facturas);
  res.json({ mensaje: "Factura marcada como pagada", factura: f });
});

// DELETE /facturas/:numero  (elimina el registro, no revierte el stock)
router.delete("/:numero", requiereRol("facturacion"), (req, res) => {
  const facturas = leer("facturas");
  const restantes = facturas.filter((f) => f.numero !== req.params.numero);
  if (restantes.length === facturas.length) {
    return res.status(404).json({ mensaje: "Factura no encontrada" });
  }
  guardar("facturas", restantes);
  res.json({ mensaje: "Factura eliminada correctamente" });
});

module.exports = router;
