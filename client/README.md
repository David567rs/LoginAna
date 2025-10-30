# Frontend de Login (cliente)

Este es un frontend mínimo (HTML/CSS/JS puro) para iniciar sesión contra un backend. Por defecto apunta a `http://localhost:3000` y espera un endpoint `POST /auth/login` que devuelva un JSON con un token (por ejemplo `{\"access_token\": \"...\"}`).

## Estructura

- `index.html`: formulario de login
- `dashboard.html`: página simple posterior al login (muestra token y permite logout)
- `styles.css`: estilos básicos
- `config.js`: configuración con `API_BASE`
- `app.js`: lógica del formulario y llamada a la API

## Configurar API

Edita `client/config.js` y ajusta:

```
window.APP_CONFIG = { API_BASE: 'http://localhost:3000' };
```

## Ejecutar

Opciones:
- Abrir `client/index.html` en el navegador (recomendado usar una extensión tipo “Live Server” en VS Code para evitar restricciones del esquema `file://`).
- Servir estáticos con cualquier servidor simple (por ejemplo, `npx serve`), y navegar a `http://localhost:PORT`.

## Backend esperado

- Endpoint: `POST /auth/login`
- Body JSON: `{ "email": string, "password": string }`
- Respuesta exitosa: `{ "access_token": string }` (también soporta `token` o `jwt`).

Asegúrate de habilitar CORS en tu backend si el frontend corre en un origen distinto.

