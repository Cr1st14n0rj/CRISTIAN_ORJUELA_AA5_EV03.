// Fabrica de CRUD para directorios identificados por NIT (proveedores y clientes)
const express = require("express");
const { leer, guardar } = require("../utils/almacen");
const { requiereRol } = require("../middleware/auth");

function crearDirectorio({ coleccion, rol, singular, camposObligatorios, camposPermitidos, extra }) {
  const router = express.Router();

  router.get("/", requiereRol(rol), (req, res) => {
    let lista = leer(coleccion);
    if (req.query.buscar) {
      const t = req.query.buscar.toLowerCase();
      lista = lista.filter((x) => x.nombre.toLowerCase().includes(t) || x.nit.includes(t));
    }
    res.json(extra ? lista.map(extra) : lista);
  });

  router.get("/:nit", requiereRol(rol), (req, res) => {
    const item = leer(coleccion).find((x) => x.nit === req.params.nit);
    if (!item) return res.status(404).json({ mensaje: `${singular} no encontrado` });
    res.json(extra ? extra(item) : item);
  });

  router.post("/", requiereRol(rol), (req, res) => {
    const faltan = camposObligatorios.filter((c) => !req.body[c]);
    if (faltan.length) {
      return res.status(400).json({ mensaje: `Debe enviar: ${camposObligatorios.join(", ")}` });
    }
    const lista = leer(coleccion);
    if (lista.find((x) => x.nit === req.body.nit)) {
      return res.status(409).json({ mensaje: `Ya existe un ${singular.toLowerCase()} con ese NIT` });
    }
    const nuevo = {};
    camposPermitidos.forEach((c) => {
      if (req.body[c] !== undefined) nuevo[c] = req.body[c];
    });
    lista.push(nuevo);
    guardar(coleccion, lista);
    res.status(201).json({ mensaje: `${singular} registrado correctamente`, [singular.toLowerCase()]: nuevo });
  });

  router.put("/:nit", requiereRol(rol), (req, res) => {
    const lista = leer(coleccion);
    const i = lista.findIndex((x) => x.nit === req.params.nit);
    if (i === -1) return res.status(404).json({ mensaje: `${singular} no encontrado` });
    camposPermitidos.forEach((c) => {
      if (c !== "nit" && req.body[c] !== undefined) lista[i][c] = req.body[c];
    });
    guardar(coleccion, lista);
    res.json({ mensaje: `${singular} actualizado correctamente`, [singular.toLowerCase()]: lista[i] });
  });

  router.delete("/:nit", requiereRol(rol), (req, res) => {
    const lista = leer(coleccion);
    const restantes = lista.filter((x) => x.nit !== req.params.nit);
    if (restantes.length === lista.length) {
      return res.status(404).json({ mensaje: `${singular} no encontrado` });
    }
    guardar(coleccion, restantes);
    res.json({ mensaje: `${singular} eliminado correctamente` });
  });

  return router;
}

module.exports = crearDirectorio;
