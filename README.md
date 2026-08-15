# Artículos Ferreteros EH

Tienda online inspirada en la estructura de Angeles Beauty, ahora adaptada al rubro ferretero.

## Incluye

- Catálogo público con Firebase Firestore
- Buscador y filtros por categoría
- Tarjetas dinámicas con múltiples imágenes
- Botones directos de WhatsApp por producto
- Login admin con Firebase Auth
- Panel admin CRUD con Firebase Firestore + Storage
- Sitio responsive para móvil, tablet y escritorio
- PWA básica (manifest + service worker)
- Arquitectura modular para escalar nuevas funciones

## Estructura

- `index.html`: tienda pública
- `nosotros.html`: información de negocio
- `login.html`: acceso admin
- `admin.html`: panel CRUD productos
- `css/style.css`: estilos globales responsive
- `js/config.js`: configuración de tienda y Firebase
- `js/firebase-init.js`: inicialización Firebase
- `js/storefront.js`: carga y render de productos
- `js/admin.js`: gestión de productos y sesión

## Configurar Firebase

1. Crea o usa un proyecto Firebase.
2. Activa estos servicios:
   - Authentication (Email/Password)
   - Firestore Database
   - Storage
3. Abre `js/config.js` y reemplaza `FIREBASE_CONFIG` por tu configuración.
4. Publica reglas iniciales seguras con los archivos:
   - `firebase-firestore.rules`
   - `firebase-storage.rules`
5. Crea al menos un usuario administrador en Authentication.

## Modelo recomendado de producto (colección `productos`)

```json
{
   "nombre": "Taladro inalámbrico 18V",
  "precio": "C$ 2,500",
  "categoria": "Herramientas Electricas",
   "descripcion": "Incluye 2 baterías y cargador.",
  "imagenUrl": ["https://..."],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Publicar en GitHub Pages

1. Sube este contenido al repositorio destino.
2. En GitHub: Settings -> Pages -> Deploy from branch.
3. Selecciona rama principal y carpeta root.
4. Reemplaza URLs de `sitemap.xml` por tu dominio real.

## Mejoras futuras recomendadas

- Inventario por stock y alertas de bajo inventario
- Pedidos internos desde formulario web
- Integración con pasarela de pago
- Roles admin (superadmin, vendedor)
- Analítica de productos más consultados
