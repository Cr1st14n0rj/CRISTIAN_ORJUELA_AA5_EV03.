# Documentación de los servicios - Kabod API

URL base: `http://localhost:8080`

Formato: JSON en peticiones y respuestas. Salvo `/salud` y `/auth/*`, todas las rutas requieren `Authorization: Bearer <token>`.

Códigos de error comunes a las rutas protegidas:

| Código | Significado |
|---|---|
| 401 | Token ausente, alterado o expirado |
| 403 | El rol del usuario no tiene permiso para esa operación |

---

## 1. Autenticación (`/login`, `/registro` y `/auth/*`)

Son los servicios de EV01. Responden en `/login` y `/registro` (como en la evidencia anterior) y también bajo `/auth/login` y `/auth/registro`.

Reglas:
- Las contraseñas se guardan encriptadas con bcrypt.
- Los roles válidos son `inventario` y `facturacion`.
- Al iniciar por primera vez se crean dos usuarios: `inventario` / `inv123` y `facturacion` / `fac123`.
- Un registro público siempre crea un usuario con rol `facturacion`. El campo `rol` solo se respeta si la petición trae el token de un usuario de inventario.

### POST /registro
Crea un usuario.

Body:
```json
{ "usuario": "juan", "contrasena": "1234" }
```
Con token de inventario también se puede enviar `"rol": "inventario"`.

| Código | Mensaje |
|---|---|
| 201 | Usuario registrado correctamente |
| 400 | Debe enviar usuario y contrasena / El rol debe ser inventario o facturacion |
| 409 | El usuario ya existe |

### POST /login
Body: `{ "usuario": "inventario", "contrasena": "inv123" }`

Respuesta 200:
```json
{ "mensaje": "Autenticación satisfactoria", "token": "eyJ...", "rol": "inventario" }
```

| Código | Mensaje |
|---|---|
| 200 | Autenticación satisfactoria |
| 400 | Debe enviar usuario y contrasena |
| 401 | Error en la autenticación |

---

## 2. Productos (`/productos`)

Lectura para ambos roles. Crear, actualizar y eliminar solo para `inventario`.

Modelo:

| Campo | Tipo | Regla |
|---|---|---|
| codigo | texto | Obligatorio, único |
| nombre | texto | Obligatorio |
| categoria | texto | `Masculino`, `Femenino` o `Unisex` |
| stock | entero | Obligatorio, mayor o igual a 0 |
| unidad | texto | `und` (por defecto) o `caja` |
| costo | entero | Obligatorio, mayor o igual a 0 |
| stockMinimo | entero | Opcional, por defecto 0 |

El campo calculado `estado` vale `Agotado` (stock 0), `Stock bajo` (stock menor o igual al mínimo) o `Normal`.

| Método y ruta | Descripción | Códigos |
|---|---|---|
| GET /productos?buscar=texto&categoria=Unisex | Lista con filtros opcionales | 200 |
| GET /productos/:codigo | Consulta un producto | 200, 404 |
| POST /productos | Registra un producto | 201, 400, 403, 409 |
| PUT /productos/:codigo | Actualiza campos del producto | 200, 400, 403, 404 |
| DELETE /productos/:codigo | Elimina el producto | 200, 403, 404 |

Ejemplo POST:
```json
{ "codigo": "M-001", "nombre": "Bodys en polilycra embonada", "categoria": "Femenino",
  "stock": 10, "unidad": "und", "costo": 20000, "stockMinimo": 3 }
```

---

## 3. Movimientos de inventario (`/movimientos`)

Solo `inventario`. Cada movimiento actualiza el stock: una **Entrada** suma y una **Salida** resta.

| Método y ruta | Descripción | Códigos |
|---|---|---|
| GET /movimientos?tipo=Entrada | Lista movimientos, más recientes primero | 200, 403 |
| POST /movimientos | Registra un movimiento y ajusta el stock | 201, 400, 403, 404, 409 |
| DELETE /movimientos/:id | Elimina el registro (no revierte el stock) | 200, 403, 404 |

Body del POST:
```json
{ "tipo": "Entrada", "fecha": "2026-11-07", "codigoProducto": "M-001",
  "cantidad": 5, "responsable": "Ana Pérez" }
```

Reglas: `tipo` es `Entrada` o `Salida`; `cantidad` es un entero mayor a 0; una salida no puede superar el stock disponible (409 con el mensaje `Stock insuficiente. Disponible: N`).

---

## 4. Proveedores (`/proveedores`)

Solo `inventario`. Identificados por NIT.

| Campo | Regla |
|---|---|
| nit | Obligatorio, único |
| nombre | Obligatorio |
| especialidad, contacto, estado | Opcionales |

| Método y ruta | Descripción | Códigos |
|---|---|---|
| GET /proveedores?buscar=texto | Lista, buscando por nombre o NIT | 200, 403 |
| GET /proveedores/:nit | Consulta uno | 200, 403, 404 |
| POST /proveedores | Registra | 201, 400, 403, 409 |
| PUT /proveedores/:nit | Actualiza (el NIT no cambia) | 200, 403, 404 |
| DELETE /proveedores/:nit | Elimina | 200, 403, 404 |

---

## 5. Alertas de stock (`/alertas`)

### GET /alertas
Solo `inventario`. Devuelve los productos agotados o con stock por debajo del mínimo.

```json
[ { "codigo": "M-001", "nombre": "Bodys en polilycra embonada", "categoria": "Femenino",
    "stock": 0, "unidad": "und", "stockMinimo": 3, "alerta": "Agotado" } ]
```

Códigos: 200, 403.

---

## 6. Clientes (`/clientes`)

Solo `facturacion`. Identificados por NIT. La respuesta incluye `facturas`, la cantidad de facturas emitidas al cliente.

| Campo | Regla |
|---|---|
| nit | Obligatorio, único |
| nombre | Obligatorio (razón social) |
| ciudad, contacto | Opcionales |

| Método y ruta | Descripción | Códigos |
|---|---|---|
| GET /clientes?buscar=texto | Lista | 200, 403 |
| GET /clientes/:nit | Consulta uno | 200, 403, 404 |
| POST /clientes | Registra | 201, 400, 403, 409 |
| PUT /clientes/:nit | Actualiza | 200, 403, 404 |
| DELETE /clientes/:nit | Elimina | 200, 403, 404 |

---

## 7. Facturas (`/facturas`)

Solo `facturacion`.

### POST /facturas
Emite una factura. Body:
```json
{ "nitCliente": "800222", "fecha": "2026-11-07", "condicionPago": "30 días",
  "lineas": [ { "codigoProducto": "M-001", "cantidad": 4, "iva": 19 } ] }
```

Reglas de negocio (las mismas del frontend):
- El precio de cada línea es el costo del producto. El `iva` puede ser 0, 5 o 19 (por defecto 19).
- Número consecutivo `FV-0001`, `FV-0002`, etc.
- `condicionPago` es `Contado`, `15 días`, `30 días` o `45 días`, igual que la pantalla Nueva factura. `Contado` queda en estado `Pagada` y las demás en `Pendiente`.
- Vencimiento: la fecha de emisión más los días de la condición de pago (`Contado` vence el mismo día).
- Descuenta el stock de cada producto y registra un movimiento de **Salida** por línea.
- Se rechaza si el cliente o un producto no existen, o si la cantidad supera el stock.

Respuesta 201:
```json
{ "mensaje": "Factura emitida correctamente",
  "factura": { "numero": "FV-0001", "cliente": "Boutique Luna", "nitCliente": "800222",
    "fecha": "2026-11-07", "vencimiento": "2026-12-07", "condicionPago": "30 días",
    "estado": "Pendiente", "subtotal": 100000, "iva": 19000, "total": 119000,
    "lineas": [ { "codigoProducto": "M-001", "nombre": "...", "cantidad": 4, "precio": 25000, "iva": 19 } ] } }
```

| Método y ruta | Descripción | Códigos |
|---|---|---|
| GET /facturas?estado=Pendiente | Lista facturas | 200, 403 |
| GET /facturas/:numero | Consulta una factura | 200, 403, 404 |
| POST /facturas | Emite factura | 201, 400, 403, 404, 409 |
| PATCH /facturas/:numero/pagar | Marca una factura como pagada | 200, 403, 404, 409 |
| DELETE /facturas/:numero | Elimina el registro (no revierte el stock) | 200, 403, 404 |

---

## 8. Reporte de ventas (`/reportes/ventas`)

### GET /reportes/ventas
Solo `facturacion`. Agrupa las facturas por mes (`AAAA-MM`).

```json
{ "totalAcumulado": 119000, "promedioMensual": 119000, "mejorMes": "2026-11",
  "ventasPorMes": [ { "mes": "2026-11", "facturas": 1, "ventasBrutas": 100000,
                      "iva": 19000, "totalNeto": 119000 } ] }
```

Códigos: 200, 403.

---

## 9. Salud (`/salud`)

### GET /salud
Público. Responde `{ "estado": "ok", "servicio": "kabod-api" }` para verificar que el servicio está activo.
