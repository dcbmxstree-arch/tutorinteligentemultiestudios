# Multiestudios – Backend Proxy

Servidor Node.js que actúa como intermediario entre el frontend y la API de DeepSeek,
**manteniendo la clave API completamente oculta al navegador**.

## Estructura del proyecto

```
multiestudios-backend/
├── server.js          ← Servidor Express (proxy)
├── package.json
├── .env.example       ← Plantilla de variables de entorno
├── .env               ← TU archivo real (NO subir a Git)
├── .gitignore
├── render.yaml        ← Config para Render.com
└── public/
    └── index.html     ← El archivo multiestudios.html renombrado
```

---

## Instalación local (en tu PC)

### Requisitos
- Node.js 18 o superior → https://nodejs.org
- Una cuenta gratuita en Render.com o Railway.app para producción

### Pasos

```bash
# 1. Entra a la carpeta del proyecto
cd multiestudios-backend

# 2. Instala las dependencias
npm install

# 3. Crea tu archivo .env con tu clave real
cp .env.example .env
# Edita .env y coloca tu clave DeepSeek:
# DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# 4. Crea la carpeta public y coloca el HTML ahí
mkdir -p public
# Copia multiestudios.html dentro de public/ y renómbralo index.html

# 5. Arranca el servidor
npm start
# → Servidor corriendo en http://localhost:3000
```

Abre http://localhost:3000 en tu navegador. ¡Listo!

---

## Despliegue en Render.com (gratis, recomendado)

### Paso 1 – Subir el proyecto a GitHub

```bash
git init
git add .
git commit -m "Primer commit Multiestudios"
# Crea un repositorio en github.com y sigue las instrucciones
git remote add origin https://github.com/TU_USUARIO/multiestudios.git
git push -u origin main
```

> ⚠️ Asegúrate de que `.env` esté en `.gitignore` antes de hacer push.
> La clave API NUNCA debe aparecer en GitHub.

### Paso 2 – Crear el servicio en Render

1. Ve a https://render.com y crea una cuenta gratuita
2. Haz clic en **New → Web Service**
3. Conecta tu repositorio de GitHub
4. Render detecta `render.yaml` automáticamente
5. En la sección **Environment Variables** añade:
   - Clave: `DEEPSEEK_API_KEY`
   - Valor: `sk-xxxxxxxxxxxxxxxxxxxxxxxx` (tu clave real)
6. Haz clic en **Create Web Service**
7. Render construye e inicia el servidor (~2 minutos)
8. Tu URL pública será: `https://multiestudios.onrender.com`

---

## Despliegue en Railway.app (alternativa)

1. Ve a https://railway.app
2. **New Project → Deploy from GitHub repo**
3. Selecciona tu repositorio
4. En **Variables** añade `DEEPSEEK_API_KEY` con tu valor real
5. Railway detecta Node.js automáticamente y despliega

---

## ¿Cómo añadir una nueva carrera?

Solo edita `public/index.html` en la sección **REGISTRO CENTRAL DE CARRERAS**:

```javascript
// 1. Añadir la carrera
CARRERAS["Nombre de la Carrera"] = {
  area: "Nombre del Área",        // agrupa en el selector de login
  temario: [
    "1. Tema uno...",
    "2. Tema dos...",
    // ... hasta 50 temas
  ],
  casoBanco: {
    enunciado: "...",
    preguntas: ["pregunta 1", "pregunta 2", "pregunta 3"],
    solucion: "..."
  },
  casoMuestra: {          // opcional, si no se pone usa casoBanco
    enunciado: "...",
    preguntas: ["..."],
    solucion: "..."
  },
  promptExtra: "Instrucciones adicionales para la IA (opcional)"
};

// 2. Añadir usuarios autorizados
USUARIOS.push({ cedula: "1234567890", carrera: "Nombre de la Carrera" });
```

¡No hay que tocar nada más! El motor de la app es 100% genérico.

---

## Seguridad implementada

| Capa | Detalle |
|---|---|
| **Proxy API** | La clave DeepSeek vive en `.env` del servidor, nunca llega al navegador |
| **Rate limiting** | Máximo 20 peticiones por minuto por IP |
| **Helmet** | Cabeceras HTTP de seguridad automáticas |
| **Validación** | Se verifica que `messages` sea un array antes de llamar a la API |
| **Límites** | `temperature` entre 0-1, `max_tokens` máximo 32.000 |

---

## Notas del plan gratuito de Render

- El servidor se **suspende** tras 15 minutos de inactividad
- La primera petición después de la suspensión tarda ~30 segundos (cold start)
- Para evitarlo: actualiza al plan Starter ($7/mes) o usa Railway que tiene menos cold starts

