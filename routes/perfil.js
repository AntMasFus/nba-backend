const express = require('express');
const db = require('../db');
const router = express.Router();




// =========================
// GUARDAR EQUIPO FAVORITO
// =========================
router.post('/equipo-favorito', async (req, res) => {
  const { usuario_id, equipo_id } = req.body;

  if (!usuario_id || !equipo_id) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const [existente] = await db.query('SELECT * FROM equipos_favoritos WHERE usuario_id = ?', [usuario_id]);

    if (existente.length > 0) {
      await db.query('UPDATE equipos_favoritos SET equipo_id = ? WHERE usuario_id = ?', [equipo_id, usuario_id]);
    } else {
      await db.query('INSERT INTO equipos_favoritos (usuario_id, equipo_id) VALUES (?, ?)', [usuario_id, equipo_id]);
    }

    res.json({ mensaje: 'Equipo favorito guardado correctamente' });
  } catch (error) {
    console.error('Error al guardar equipo favorito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// OBTENER EQUIPO FAVORITO
// =========================
router.get('/equipo-favorito/:usuarioId', async (req, res) => {
  const { usuarioId } = req.params;

  try {
    const [resultado] = await db.query('SELECT equipo_id FROM equipos_favoritos WHERE usuario_id = ?', [usuarioId]);

    if (resultado.length === 0) {
      return res.json({ equipo_id: null });
    }

    res.json({ equipo_id: resultado[0].equipo_id });
  } catch (error) {
    console.error('Error al obtener equipo favorito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// GUARDAR QUINTETO FAVORITO
// =========================
router.post('/quinteto-favorito', async (req, res) => {
  const { usuario_id, base, escolta, alero, alapivot, pivot } = req.body;

  if (!usuario_id) {
    return res.status(400).json({ error: 'Usuario no especificado' });
  }

  try {
    const [existing] = await db.query('SELECT * FROM quintetos_favoritos WHERE usuario_id = ?', [usuario_id]);

    if (existing.length > 0) {
      await db.query(`
        UPDATE quintetos_favoritos
        SET base = ?, escolta = ?, alero = ?, alapivot = ?, pivot = ?
        WHERE usuario_id = ?
      `, [base, escolta, alero, alapivot, pivot, usuario_id]);
    } else {
      await db.query(`
        INSERT INTO quintetos_favoritos (usuario_id, base, escolta, alero, alapivot, pivot)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [usuario_id, base, escolta, alero, alapivot, pivot]);
    }

    res.json({ mensaje: 'Quinteto guardado correctamente' });
  } catch (error) {
    console.error('Error al guardar quinteto:', error);
    res.status(500).json({ error: 'Error al guardar quinteto' });
  }
});

// =========================
// OBTENER QUINTETO FAVORITO
// =========================
router.get('/quinteto-favorito/:usuario_id', async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const [rows] = await db.query('SELECT * FROM quintetos_favoritos WHERE usuario_id = ?', [usuario_id]);

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.json({});
    }
  } catch (error) {
    console.error('Error al obtener quinteto:', error);
    res.status(500).json({ error: 'Error al obtener quinteto' });
  }
});

// GET - Comentarios recibidos por un usuario
router.get('/comentarios/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;

  try {
    const [comentarios] = await db.query(`
      SELECT c.comentario, u.nickname AS autor
      FROM comentarios c
      JOIN usuarios u ON c.autor_id = u.id
      WHERE c.receptor_id = ?
      ORDER BY c.fecha DESC
    `, [usuario_id]);

    res.json(comentarios);
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
});

// Eliminar cuenta del usuario
router.delete('/eliminar-cuenta/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;

  try {
    // Elimina primero datos relacionados (por integridad referencial)
    await db.query('DELETE FROM comentarios WHERE emisor_id = ? OR receptor_id = ?', [usuario_id, usuario_id]);
    await db.query('DELETE FROM quintetos_favoritos WHERE usuario_id = ?', [usuario_id]);
    await db.query('DELETE FROM equipos_favoritos WHERE usuario_id = ?', [usuario_id]);

    // Finalmente, elimina al usuario
    await db.query('DELETE FROM usuarios WHERE id = ?', [usuario_id]);

    res.json({ mensaje: 'Cuenta eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({ error: 'Error al eliminar la cuenta' });
  }
});



module.exports = router;
