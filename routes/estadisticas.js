const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener top 10 jugadores con más puntos en una temporada
router.get('/puntos/:temporada', async (req, res) => {
  const { temporada } = req.params;
  try {
    const [resultados] = await db.query(
      `SELECT player_id, nombre, total_puntos AS total 
       FROM puntos_totales 
       WHERE temporada = ? 
       ORDER BY total_puntos DESC 
       LIMIT 10`,
      [temporada]
    );
    res.json(resultados);
  } catch (error) {
    console.error('Error al obtener puntos:', error);
    res.status(500).json({ error: 'Error al obtener puntos' });
  }
});

// Obtener top 10 jugadores con más asistencias en una temporada
router.get('/asistencias/:temporada', async (req, res) => {
  const { temporada } = req.params;
  try {
    const [resultados] = await db.query(
      `SELECT player_id, nombre, total_asistencias AS total 
       FROM asistencias_totales 
       WHERE temporada = ? 
       ORDER BY total_asistencias DESC 
       LIMIT 10`,
      [temporada]
    );
    res.json(resultados);
  } catch (error) {
    console.error('Error al obtener asistencias:', error);
    res.status(500).json({ error: 'Error al obtener asistencias' });
  }
});

// Obtener top 10 jugadores con más rebotes en una temporada
router.get('/rebotes/:temporada', async (req, res) => {
  const { temporada } = req.params;
  try {
    const [resultados] = await db.query(
      `SELECT player_id, nombre, total_rebotes AS total 
       FROM rebotes_totales 
       WHERE temporada = ? 
       ORDER BY total_rebotes DESC 
       LIMIT 10`,
      [temporada]
    );
    res.json(resultados);
  } catch (error) {
    console.error('Error al obtener rebotes:', error);
    res.status(500).json({ error: 'Error al obtener rebotes' });
  }
});

module.exports = router;
// Este archivo define las rutas para obtener estadísticas de jugadores en la NBA.