// Persistencia en un solo archivo JSON: datos.json
const fs = require("fs");
const path = require("path");

const ARCHIVO = path.join(__dirname, "..", "data", "datos.json");

function leerTodo() {
  if (!fs.existsSync(ARCHIVO)) return {};
  const contenido = fs.readFileSync(ARCHIVO, "utf8");
  return contenido ? JSON.parse(contenido) : {};
}

function existe(nombre) {
  return nombre in leerTodo();
}

function leer(nombre) {
  return leerTodo()[nombre] || [];
}

function guardar(nombre, datos) {
  const todo = leerTodo();
  todo[nombre] = datos;
  fs.writeFileSync(ARCHIVO, JSON.stringify(todo, null, 2));
}

module.exports = { existe, leer, guardar };