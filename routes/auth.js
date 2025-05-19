const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
require('dotenv').config();

const router = express.Router();
const SALT_ROUNDS = 10;

// Ruta de registro
router.post('/register', async (req, res) => {
  const { nombre, nickname, email, password } = req.body;

  if (!nombre || !nickname || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    // Verificar si el usuario ya existe
    const [existing] = await db.query('SELECT * FROM usuarios WHERE email = ? OR nickname = ?', [email, nickname]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email o nickname ya en uso' });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insertar el nuevo usuario
    await db.query(
      'INSERT INTO usuarios (nombre, nickname, email, password_hash) VALUES (?, ?, ?, ?)',
      [nombre, nickname, email, hashedPassword]
    );

    res.status(201).json({ mensaje: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta de login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [usuarios] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (usuarios.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = usuarios[0];
    const esValida = await bcrypt.compare(password, usuario.password_hash);

    if (!esValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar JWT
    const token = jwt.sign(
      { id: usuario.id, nickname: usuario.nickname },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, nickname: usuario.nickname, email: usuario.email } });
  } catch (error) {
    console.error('Error al hacer login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
