const crearDirectorio = require("./directorio");
const { leer } = require("../utils/almacen");

// Campos de la pantalla Clientes: NIT, Razon social, Ciudad, Contacto, Facturas
module.exports = crearDirectorio({
  coleccion: "clientes",
  rol: "facturacion",
  singular: "Cliente",
  camposObligatorios: ["nit", "nombre"],
  camposPermitidos: ["nit", "nombre", "ciudad", "contacto"],
  extra: (c) => ({
    ...c,
    facturas: leer("facturas").filter((f) => f.nitCliente === c.nit).length,
  }),
});
