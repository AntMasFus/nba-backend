const express = require('express');
const db = require('../db');
const router = express.Router();
const axios = require('axios');

// Ruta para enviar un comentario a otro usuario
router.post('/comentarios', async (req, res) => {
  const { emisor_id, receptor_id, contenido } = req.body;

  console.log('Comentario recibido:', req.body);
  if (!emisor_id || !receptor_id || !contenido) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  try {
      await db.query(
      'INSERT INTO comentarios (emisor_id, receptor_id, contenido) VALUES (?, ?, ?)',
      [emisor_id, receptor_id, contenido]  
    );



    res.status(201).json({ mensaje: 'Comentario enviado correctamente' });
  } catch (error) {
    console.error('Error al guardar comentario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para obtener los comentarios de un usuario
router.get('/comentarios/:receptor_id', async (req, res) => {
  const { receptor_id } = req.params;

  try {
    const [comentarios] = await db.query(
      `SELECT c.id, c.contenido, c.fecha, u.nickname AS autor
       FROM comentarios c
       JOIN usuarios u ON c.emisor_id = u.id
       WHERE c.receptor_id = ?
       ORDER BY c.fecha DESC`,
      [receptor_id]
    );

    res.json(comentarios);
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
});

// Eliminar un comentario por ID
router.delete('/comentarios/:comentario_id', async (req, res) => {
  const { comentario_id } = req.params;

  try {
    await db.query('DELETE FROM comentarios WHERE id = ?', [comentario_id]);
    res.json({ mensaje: 'Comentario eliminado' });
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    res.status(500).json({ error: 'Error al eliminar comentario' });
  }
});




// Obtener todos los usuarios con sus equipos y quintetos
router.get('/', async (req, res) => {
  try {
    const [usuarios] = await db.query('SELECT id, nickname FROM usuarios');

    // Llamamos una sola vez a la API de equipos
    const apiResponse = await axios.get('https://api.balldontlie.io/v1/teams', {
      headers: {
        Authorization: process.env.API_KEY
      }
    });

    const equiposApi = apiResponse.data.data;

    const resultados = await Promise.all(
      usuarios.map(async (usuario) => {
        // Buscar equipo favorito
        const [favoritoRes] = await db.query('SELECT equipo_id FROM equipos_favoritos WHERE usuario_id = ?', [usuario.id]);
        const equipoId = favoritoRes.length > 0 ? favoritoRes[0].equipo_id : null;

            console.log(`Usuario: ${usuario.nickname}, equipo_id: ${equipoId}`);


        let nombreEquipo = 'No asignado';
        if (equipoId) {
          const equipoInfo = equiposApi.find(eq => eq.id === equipoId);
                console.log('Equipo encontrado en API:', equipoInfo?.full_name || 'NO ENCONTRADO');

          if (equipoInfo) {
            nombreEquipo = equipoInfo.full_name;
          }
        }

        // Buscar quinteto favorito
        const [[quinteto]] = await db.query(`
          SELECT base, escolta, alero, alapivot, pivot
          FROM quintetos_favoritos
          WHERE usuario_id = ?
        `, [usuario.id]);

        return {
          id: usuario.id,
          nickname: usuario.nickname,
          equipo_favorito: nombreEquipo,
          quinteto: quinteto || {}
        };
      })
    );

    res.json(resultados);
  } catch (error) {
    console.error('Error al obtener datos de comunidad:', error.message);
    res.status(500).json({ error: 'Error al obtener datos de comunidad' });
  }
});

module.exports = router;
