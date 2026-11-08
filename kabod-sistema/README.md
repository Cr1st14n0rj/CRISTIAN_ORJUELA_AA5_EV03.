# Kabod - Sistema de inventario y facturación

Evidencia GA7-220501096-AA5-EV03 - Diseño y desarrollo de servicios web (proyecto).

Proyecto formado por dos partes que trabajan juntas:

| Parte | Carpeta | Tecnología | Puerto |
|---|---|---|---|
| API REST (evolución del servicio de EV01) | `backend/` | Node.js, Express, bcrypt | 8081 |
| Aplicación web (interfaz del proyecto formativo) | `frontend/` | React, Vite, nginx | 3000 |

El frontend ya no guarda datos en memoria ni tiene claves fijas: inicia sesión, consulta y guarda todo a través de la API.

## Ejecutar con Docker (recomendado)

```bash
docker compose up --build
```

- Aplicación web: http://localhost:3000
- API directa (Postman): http://localhost:8081

Usuarios iniciales: `inventario` / `inv123` y `facturacion` / `fac123`. Los datos se guardan en un volumen de Docker (`kabod-datos`), así que se conservan al reiniciar. Para empezar de cero: `docker compose down -v`.

En Docker, nginx sirve el frontend y reenvía las peticiones `/api/*` a la API, por lo que no hay problemas de CORS.

## Ejecutar sin Docker

Terminal 1, la API:
```bash
cd backend
npm install
npm start
```

Terminal 2, la aplicación web (el servidor de desarrollo reenvía `/api` a `localhost:8081`):
```bash
cd frontend
npm install
npm run dev
```

## Cómo se conectan

| Pantalla del frontend | Servicio de la API |
|---|---|
| Login | `POST /login` |
| Productos | `/productos` |
| Movimientos | `/movimientos` (actualiza el stock) |
| Proveedores | `/proveedores` |
| Alertas de stock | calculadas con `/productos` (también existe `/alertas`) |
| Clientes | `/clientes` |
| Facturas y Nueva factura | `/facturas` (descuenta stock y registra salidas) |
| Reporte de ventas | `/reportes/ventas` |

El archivo `frontend/src/api.js` concentra todas las llamadas a la API.

## Documentación

- [`docs/SERVICIOS.md`](docs/SERVICIOS.md): cada servicio con sus campos, reglas, ejemplos y códigos de respuesta.
- [`docs/GUIA_GIT.md`](docs/GUIA_GIT.md): flujo de ramas y commits del proyecto.
