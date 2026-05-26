// ══════════════════════════════════════════════════════════════════════
//  MULTIESTUDIOS – Backend Proxy
//  Protege la clave API de DeepSeek: nunca llega al navegador.
//  El frontend llama a /api/chat → este servidor llama a DeepSeek.
// ══════════════════════════════════════════════════════════════════════
require('dotenv').config();

const express    = require('express');
const rateLimit  = require('express-rate-limit');
const helmet     = require('helmet');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Seguridad básica de cabeceras HTTP ──────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false  // deshabilitado para que el HTML inline funcione
}));

// ── Parseo de JSON ───────────────────────────────────────────────────
app.use(express.json({ limit: '50kb' }));

// ── Servir el frontend desde /public ────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Rate limiting: máx 20 peticiones por minuto por IP ──────────────
const limiter = rateLimit({
  windowMs : 60 * 1000,   // 1 minuto
  max      : 20,
  standardHeaders: true,
  legacyHeaders  : false,
  message  : { error: 'Demasiadas peticiones. Espere un momento.' }
});
app.use('/api/', limiter);

// ══════════════════════════════════════════════════════════════════════
//  ENDPOINT PROXY  →  POST /api/chat
//  Recibe: { messages, temperature, max_tokens }
//  Llama a DeepSeek con la clave desde .env
//  Devuelve: la respuesta de DeepSeek tal cual
// ══════════════════════════════════════════════════════════════════════
app.post('/api/chat', async (req, res) => {
  const { messages, temperature = 0.7, max_tokens = 2000 } = req.body;

  // Validación básica
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'El campo "messages" es requerido y debe ser un array.' });
  }

  // Comprobar que la clave existe en el entorno
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('⚠️  DEEPSEEK_API_KEY no está definida en las variables de entorno.');
    return res.status(500).json({ error: 'Configuración del servidor incompleta.' });
  }

  try {
    // Llamada a DeepSeek desde el servidor (la clave NUNCA sale al cliente)
    const upstream = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method : 'POST',
      headers: {
        'Content-Type' : 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model      : 'deepseek-chat',
        messages,
        temperature: Math.min(Math.max(Number(temperature) || 0.7, 0), 1),
        max_tokens : Math.min(Number(max_tokens) || 2000, 32000)
      })
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error(`Error DeepSeek ${upstream.status}:`, errText);
      return res.status(upstream.status).json({ error: `Error del modelo IA: ${upstream.status}` });
    }

    const data = await upstream.json();
    return res.json(data);

  } catch (err) {
    console.error('Error de red al llamar a DeepSeek:', err.message);
    return res.status(502).json({ error: 'No se pudo conectar con el servicio de IA.' });
  }
});

// ── Health check (útil para Render / Railway) ────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── Fallback: cualquier ruta desconocida sirve el index.html ─────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Arranque ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Servidor Multiestudios corriendo en http://localhost:${PORT}`);
  console.log(`🔑  Clave API cargada: ${process.env.DEEPSEEK_API_KEY ? 'SÍ' : 'NO ⚠️'}`);
});
