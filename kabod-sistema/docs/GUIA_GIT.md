# Guía de versionamiento (Git y GitHub)

El repositorio es un solo proyecto con las carpetas `backend/` y `frontend/`, y el `docker-compose.yml` en la raíz.

## Flujo de ramas

- `main`: versión estable que se entrega.
- `develop`: integración del trabajo en curso.
- `feature/<nombre>`: una rama por servicio o tarea, que se une a `develop` al terminar.

## Primer commit y publicación

```bash
git init -b main
git add .
git commit -m "feat: estructura base, autenticación y almacenamiento JSON"
git remote add origin https://github.com/Cr1st14n0rj/PROYECTO_SymriseNexus.git   # o el repositorio que vayas a entregar
git push -u origin main
git switch -c develop
git push -u origin develop
```

## Trabajar un servicio nuevo

```bash
git switch develop
git switch -c feature/productos
git add backend/src/routes/productos.js
git commit -m "feat(productos): CRUD con validaciones y estado de stock"
git switch develop
git merge --no-ff feature/productos -m "merge: servicio de productos"
git push origin develop
```

## Mensajes de commit sugeridos (uno por servicio)

```
feat(auth): registro y login con roles y token
feat(productos): CRUD con validaciones y estado de stock
feat(movimientos): entradas y salidas que actualizan el stock
feat(proveedores): CRUD de proveedores por NIT
feat(alertas): consulta de productos agotados o con stock bajo
feat(clientes): CRUD de clientes por NIT
feat(facturas): emisión de facturas con descuento de stock
feat(reportes): reporte de ventas por mes
feat(frontend): conexión del frontend con la API (api.js, login y pantallas)
docs: documentación de servicios y README
chore(docker): Dockerfile de backend y frontend, nginx y docker-compose
```

## Entrega

Cuando `develop` esté probado: `git switch main`, `git merge develop`, `git tag v1.0.0` y `git push origin main --tags`.
