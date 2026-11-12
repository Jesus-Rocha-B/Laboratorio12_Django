# Laboratorio 12 — Peticiones Ajax con ReactJS y Django REST Framework

- **Curso:** Desarrollo de Aplicaciones Empresariales — Tecsup, 2026-II
- **Integrantes:**
  - Erick Arturo Gamarra Mundaca
  - Jesús Enrique Rocha Bobadilla
- **Repositorio:** https://github.com/Jesus-Rocha-B/Laboratorio12_Django

---

## Descripción del Proyecto

Este laboratorio conecta el front-end de React (desarrollado con Vite) con el backend de Django REST Framework de la Semana 8. Se reemplazan los datos estáticos por peticiones asíncronas HTTP (AJAX) utilizando **Axios** y hooks de React (**`useEffect`**, **`useState`**, **`useCallback`**), implementando el ciclo completo CRUD con validación de negocio y estados de carga y error.

La aplicación consta de dos secciones principales:
1. **Parte 1 — Práctica (`frontend/src/practica/ListaPractica.jsx`):** Consumo del recurso simple `Prenda` (`/api/prendas/`) probando solicitudes GET con estados de carga/error, POST con validación 400 (`validate_precio`), DELETE (204) y PATCH (200), además de búsqueda con `?search=`.
2. **Parte 2 — Panel de Insumos Textiles (`frontend/src/components/PanelMateriales.jsx`):** Gestión integral de la entidad `Material` del módulo `logistics` con listado dinámico, alta controlada (POST 201), edición (PATCH 200), eliminación con confirmación (DELETE 204 / 404), filtros combinados (`?search=` y `?categoria=`) y cancelación de peticiones con `AbortController`.

---

## Cómo ejecutar el proyecto (Django y React en simultáneo)

El proyecto requiere ejecutar dos terminales en paralelo:

### Terminal 1 — Backend (Django en puerto 8000)

```powershell
# 1. Posicionarse en la carpeta src del backend
cd src

# 2. Verificar o aplicar migraciones
python manage.py migrate

# 3. Levantar el servidor de desarrollo en http://127.0.0.1:8000/
python manage.py runserver
```

### Terminal 2 — Frontend (React + Vite en puerto 5173)

```powershell
# 1. Posicionarse en la carpeta frontend
cd frontend

# 2. Instalar dependencias (React, Vite, Axios)
npm install

# 3. Iniciar el servidor de desarrollo en http://localhost:5173/
npm run dev

# 4. Validar reglas de estilo y compilar para producción
npm run lint    # oxlint: 0 advertencias, 0 errores
npm run build   # vite build: genera compilado limpio
```

---

## Configuración de CORS en Django

Dado que el frontend corre en `http://localhost:5173` y el backend en `http://127.0.0.1:8000`, se configuró `django-cors-headers` para permitir que el navegador no bloquee las peticiones Ajax por la política del mismo origen (SOP):

1. **Instalación:**
   ```powershell
   pip install django-cors-headers
   ```
2. **Registro en `settings.py`:**
   ```python
   INSTALLED_APPS = [
       # ...
       'corsheaders',
       'rest_framework',
       'store',
       'logistics',
   ]

   MIDDLEWARE = [
       'corsheaders.middleware.CorsMiddleware',  # En la parte más alta
       'django.middleware.security.SecurityMiddleware',
       # ...
   ]

   # Orígenes autorizados para peticiones Ajax
   CORS_ALLOWED_ORIGINS = [
       'http://localhost:5173',
       'http://127.0.0.1:5173',
   ]
   ```

---

## Endpoints de la API REST utilizados

| Recurso / Entidad | Método HTTP | Endpoint | Código de Estado | Descripción / Parámetros |
| :--- | :---: | :--- | :---: | :--- |
| **Prendas** (Práctica) | `GET` | `/api/prendas/` | `200 OK` | Lista de prendas. Soporta `?search=<texto>`. |
| **Prendas** (Práctica) | `POST` | `/api/prendas/` | `201 Created` / `400 Bad Request` | Alta de prenda. Valida `precio > 0`. |
| **Prendas** (Práctica) | `PATCH` | `/api/prendas/<id>/` | `200 OK` | Modificación parcial de stock. |
| **Prendas** (Práctica) | `DELETE` | `/api/prendas/<id>/` | `204 No Content` | Eliminación de registro. |
| **Materiales** (Panel) | `GET` | `/api/materiales/` | `200 OK` | Lista de insumos. Soporta `?search=` y `?categoria=`. |
| **Materiales** (Panel) | `POST` | `/api/materiales/` | `201 Created` / `400 Bad Request` | Alta de insumo. Valida `precio_unitario > 0`. |
| **Materiales** (Panel) | `PATCH` | `/api/materiales/<id>/` | `200 OK` | Edición de campos y reabastecimiento de stock. |
| **Materiales** (Panel) | `DELETE` | `/api/materiales/<id>/` | `204 No Content` / `404 Not Found` | Eliminación con confirmación previa. |

---

## Recorrido de una Petición HTTP (Arquitectura)

```
Usuario (interacción o carga de página)
  └──> Componente React (useEffect / handleSubmit / onClick)
         └──> Instancia Axios (api.get, api.post, api.patch, api.delete en src/api.js)
                └──> Red HTTP (con encabezados CORS autorizados)
                       └──> Django: URL -> Router -> ViewSet (SearchFilter / OrderingFilter)
                              └──> Serializer (Validación validate_<campo> / Transformación JSON)
                                     └──> Django ORM (QuerySet) -> Base de datos SQLite
                                            └──> Response (Datos JSON + Código 200, 201, 204 o 400)
                                                   └──> setState (Actualización inmutable con spread, map o filter)
                                                          └──> React vuelve a dibujar la interfaz en el DOM
```

---

## Estructura del Proyecto

```
Laboratorio12_Django/
├── frontend/
│   ├── src/
│   │   ├── api.js                   # Instancia centralizada de Axios (baseURL: http://127.0.0.1:8000/api)
│   │   ├── practica/
│   │   │   └── ListaPractica.jsx    # Parte 1: CRUD de prendas con GET, POST, PATCH, DELETE y búsqueda
│   │   ├── components/
│   │   │   ├── PanelMateriales.jsx  # Parte 2: Padre del panel de insumos textiles con API real
│   │   │   ├── FormularioMaterial.jsx # Formulario controlado para alta (POST) y edición (PATCH)
│   │   │   ├── ListadoMateriales.jsx  # Tabla de insumos con acciones
│   │   │   ├── FilaMaterial.jsx     # Fila con botones Editar, Reponer y Eliminar (window.confirm)
│   │   │   ├── FiltroMateriales.jsx # Buscador y filtro por categoría conectados a query params
│   │   │   ├── ResumenMateriales.jsx# Estadísticas automáticas calculadas con datos de la API
│   │   │   └── Notificacion.jsx     # Avisos temporizados con temporizador limpio
│   │   ├── App.jsx                  # Navegación principal entre vistas
│   │   └── App.css                  # Estilos visuales del sistema
│   ├── package.json                 # Dependencias (incluye axios, react 19, vite)
│   └── .gitignore                   # Excluye node_modules/ y dist/
├── src/
│   ├── config/                      # Configuración Django (settings.py con CORS, api_urls.py)
│   ├── store/                       # Módulo tienda (PrendaViewSet, PrendaSerializer)
│   ├── logistics/                   # Módulo logística (MaterialViewSet con filtrado ?categoria=)
│   └── manage.py
├── requirements.txt                 # Dependencias Python (incluye django-cors-headers)
└── README.md
```
