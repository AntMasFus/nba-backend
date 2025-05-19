const axios = require('axios');
const db = require('../db');
require('dotenv').config();

const API_KEY = process.env.API_KEY;
const temporadas = ['2019', '2020', '2021', '2022', '2023'];
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const obtenerJugadores = async () => {
  let jugadores = [];
  let page = 1;

  while (true) {
    const res = await axios.get(`https://api.balldontlie.io/v1/players?per_page=100&page=${page}`, {
      headers: {
        Authorization: API_KEY
      }
    });

    jugadores = jugadores.concat(res.data.data);

    if (!res.data.meta.next_page) break;
    page++;
  }

  return jugadores;
};

const obtenerPuntosTotales = async (playerId, temporada) => {
  let page = 1;
  let totalPuntos = 0;
  let requestCount = 0;

  while (true) {
    const url = `https://api.balldontlie.io/v1/stats?player_ids[]=${playerId}&seasons[]=${temporada}&per_page=100&page=${page}`;
    const res = await axios.get(url, {
      headers: {
        Authorization: API_KEY
      }
    });

    const stats = res.data.data;
    if (stats.length === 0) break;

    stats.forEach(partido => {
      totalPuntos += partido.pts;
    });

    if (!res.data.meta.next_page) break;
    page++;

    requestCount++;
    if (requestCount >= 10) {
      await sleep(1000); // espera 1 segundo por cada 10 requests
      requestCount = 0;
    }
  }

  return totalPuntos;
};

const guardarPuntosTotales = async () => {
  try {
    const jugadores = await obtenerJugadores();
    let contadorRequests = 0;

    for (const temporada of temporadas) {
      console.log(`📊 Procesando temporada ${temporada}...`);

      for (let i = 0; i < jugadores.length; i++) {
        const jugador = jugadores[i];

        try {
          const puntos = await obtenerPuntosTotales(jugador.id, temporada);

          if (puntos > 0) {
            await db.query(
              'INSERT INTO puntos_totales (player_id, nombre, temporada, total_puntos) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE total_puntos = ?',
              [jugador.id, `${jugador.first_name} ${jugador.last_name}`, temporada, puntos, puntos]
            );
            console.log(`✓ ${jugador.first_name} ${jugador.last_name} (${temporada}): ${puntos}`);
          }

          contadorRequests++;
          if (contadorRequests >= 580) {
            console.log('⏳ Límite cercano alcanzado. Esperando 60 segundos...');
            await sleep(60000);
            contadorRequests = 0;
          }

          await sleep(100); // espera breve entre jugadores

        } catch (err) {
          console.warn(`⚠️ Error con ${jugador.first_name} ${jugador.last_name}: ${err.message}`);
        }
      }
    }

    console.log('✅ Carga completa.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error al guardar puntos:', error.message);
    process.exit(1);
  }
};

guardarPuntosTotales();
