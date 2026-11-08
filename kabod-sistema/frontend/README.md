# Frontend - Kabod

Aplicación React (Vite) del sistema de inventario y facturación. Consume la API del directorio `../backend` a través de `src/api.js`.

```bash
npm install
npm run dev      # http://localhost:5173, reenvía /api a http://localhost:8081
npm run build    # genera dist/
```

Variables opcionales: `VITE_API_URL` (URL de la API si no se usa el proxy `/api`) y `API_URL` (destino del proxy de desarrollo).
