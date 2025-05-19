const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

const puerto = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json()); // para leer JSON del body

// Rutas
app.use('/api', require('./routes/auth')); // para /api/register y /api/login
app.use('/api/equipos', require('./routes/equipos'));
app.use('/api/estadisticas', require('./routes/estadisticas'));
app.use('/api/perfil', require('./routes/perfil'));
app.use('/api/comunidad', require('./routes/comunidad'));

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ mensaje: 'Servidor funcionando correctamente' });
});

// Iniciar servidor
app.listen(puerto, () => {
  console.log(`Servidor escuchando en http://localhost:${puerto}`);
});
