# Articulos Ferreteros EH

Tienda online inspirada en la estructura de Angeles Beauty, ahora adaptada a rubro ferretero.

## Incluye

- Catalogo publico con Firebase Firestore
- Buscador y filtros por categoria
- Tarjetas dinamicas con multiples imagenes
- Botones directos de WhatsApp por producto
- Login admin con Firebase Auth
- Panel admin CRUD con Firebase Firestore + Storage
- Sitio responsive para movil, tablet y escritorio
- PWA basica (manifest + service worker)
- Arquitectura modular para escalar nuevas funciones

## Estructura

- `index.html`: tienda publica
- `nosotros.html`: informacion de negocio
- `login.html`: acceso admin
- `admin.html`: panel CRUD productos
- `css/style.css`: estilos globales responsive
- `js/config.js`: configuracion de tienda y Firebase
- `js/firebase-init.js`: inicializacion Firebase
- `js/storefront.js`: carga y render de productos
- `js/admin.js`: gestion de productos y sesion

## Configurar Firebase

1. Crea o usa un proyecto Firebase.
2. Activa estos servicios:
   - Authentication (Email/Password)
   - Firestore Database
   - Storage
3. Abre `js/config.js` y reemplaza `FIREBASE_CONFIG` por tu configuracion.
4. Publica reglas iniciales seguras con los archivos:
   - `firebase-firestore.rules`
   - `firebase-storage.rules`
5. Crea al menos un usuario administrador en Authentication.

## Modelo recomendado de producto (coleccion `productos`)

```json
{
  "nombre": "Taladro Inalambrico 18V",
  "precio": "C$ 2,500",
  "categoria": "Herramientas Electricas",
  "descripcion": "Incluye 2 baterias y cargador.",
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
- Integracion con pasarela de pago
- Roles admin (superadmin, vendedor)
- Analitica de productos mas consultados
