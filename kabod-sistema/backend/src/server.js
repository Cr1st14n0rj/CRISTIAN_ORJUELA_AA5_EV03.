// =====================================================
// Evidencia GA7-220501096-AA5-EV03
// API REST del proyecto Kabod S.A.S. (inventario y facturacion)
// =====================================================
const express = require("express");
const { requiereSesion } = require("./middleware/auth");
const { crearUsuariosIniciales } = require("./utils/semilla");

const app = express();
const PUERTO = process.env.PORT || 8081;

app.use(express.json());

// CORS basico para que el frontend (Vite, puerto 5173) pueda consumir la API
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.ORIGEN_PERMITIDO || "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Ruta publica
app.get("/salud", (req, res) => res.json({ estado: "ok", servicio: "kabod-api" }));
// /login y /registro (EV01) y las mismas rutas bajo /auth
app.use("/auth", require("./routes/auth"));
app.use("/", require("./routes/auth"));

// Rutas protegidas (requieren token)
app.use("/productos", requiereSesion, require("./routes/productos"));
app.use("/movimientos", requiereSesion, require("./routes/movimientos"));
app.use("/proveedores", requiereSesion, require("./routes/proveedores"));
app.use("/alertas", requiereSesion, require("./routes/alertas"));
app.use("/clientes", requiereSesion, require("./routes/clientes"));
app.use("/facturas", requiereSesion, require("./routes/facturas"));
app.use("/reportes", requiereSesion, require("./routes/reportes"));

// Manejo de rutas inexistentes y de errores
app.use((req, res) => res.status(404).json({ mensaje: "Ruta no encontrada" }));
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ mensaje: "El cuerpo de la peticion no es un JSON valido" });
  }
  console.error(err);
  res.status(500).json({ mensaje: "Error interno del servidor" });
});

crearUsuariosIniciales().then(() => {
  app.listen(PUERTO, () => {
    console.log(`Servidor Kabod corriendo en http://localhost:${PUERTO}`);
  });
});
