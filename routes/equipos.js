const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios');
require('dotenv').config();

router.get('/:id', async (req, res) => {
    const id = req.params.id;
  
    try {
      // Obtener datos desde balldontlie (API pública)
      const apiResponse = await axios.get(`https://api.balldontlie.io/v1/teams`, {
        headers: {
          Authorization: process.env.API_KEY
        }
      });
  
      const equipoAPI = apiResponse.data.data.find(eq => eq.id == id);
  
      if (!equipoAPI) {
        return res.status(404).json({ error: 'Equipo no encontrado en la API' });
      }
  
      // Obtener datos extra desde MySQL
      const [rows] = await db.query('SELECT * FROM equipos_extra WHERE id = ?', [id]);
      const equipoExtra = rows.length > 0 ? rows[0] : {};
  
      // Unir resultados
      const equipoCompleto = { ...equipoAPI, ...equipoExtra };
  
      res.json(equipoCompleto);
    } catch (error) {
      console.error('Error al obtener equipo:', error.message);
      res.status(500).json({ error: 'Error interno' });
    }
  })

  // Obtener todos los equipos con datos extra desde la base de datos
router.get('/', async (req, res) => {
    try {
      // primero llamada a la API de balldontlie para obtener todos los equipos
      const response = await axios.get('https://api.balldontlie.io/v1/teams', {
        headers: {
          Authorization: process.env.API_KEY
        }
      });
  
      const equiposApi = response.data.data;
  
      // Luego la consulta local a todos los registros de equipos_extra
      const [equiposExtra] = await db.query('SELECT * FROM equipos_extra');
  
      // combinamos por iDs
      const equiposCombinados = equiposApi
      .filter(e => e.conference && e.conference.trim().length > 0)
      .map(equipo => {
        const extra = equiposExtra.find(e => e.id === equipo.id) || {};
        return { ...equipo, ...extra };
      });
  
      res.json(equiposCombinados);
    } catch (error) {
      console.error('Error al obtener equipos:', error);
      res.status(500).json({ error: 'Error al obtener los equipos' });
    }
  });
  
  
  module.exports = router;