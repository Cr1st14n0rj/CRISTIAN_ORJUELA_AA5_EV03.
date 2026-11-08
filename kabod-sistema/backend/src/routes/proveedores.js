const crearDirectorio = require("./directorio");

// Campos de la pantalla Proveedores: NIT, Proveedor, Especialidad, Contacto, Estado
module.exports = crearDirectorio({
  coleccion: "proveedores",
  rol: "inventario",
  singular: "Proveedor",
  camposObligatorios: ["nit", "nombre"],
  camposPermitidos: ["nit", "nombre", "especialidad", "contacto", "estado"],
});
