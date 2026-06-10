// ============================================================================
//  fantasmas.js  —  6 conductores FANTASMA con velocidades y descansos (PRUEBA)
// ============================================================================
//  6 unidades que recorren la ruta en bucle ida -> (descanso) -> vuelta ->
//  (descanso) -> ida..., cada una a una velocidad distinta, asi se alcanzan y
//  separan de forma realista. Al llegar a cada terminal descansan un rato
//  aleatorio (quietas), lo que hace que la maquina de estados las marque
//  EN ESPERA (amarillo). Posicion calculada por tiempo (no tienen GPS real).
//
//  >>> PARA QUITARLOS: poné MODO_PRUEBA_FANTASMAS en false. <<<
// ============================================================================

import { puntoEnDistancia, largoRuta } from '../services/routeProgress';

export const MODO_PRUEBA_FANTASMAS = true;

// Velocidades distintas (km/h) -> tambien define cuantos fantasmas hay (6).
export const VELOCIDADES_FANTASMAS = [8, 9, 10, 11, 12, 13];
export const CANTIDAD_FANTASMAS = VELOCIDADES_FANTASMAS.length;

// Descansos en terminal (minutos). Aleatorio (deterministico) entre los dos.
export const DESCANSO_IDA_MIN = [5, 7];     // al terminar la IDA (terminal Apurimac)
export const DESCANSO_VUELTA_MIN = [4, 8];  // al terminar la VUELTA (terminal Circunvalacion)

// Fallback de velocidad para el ETA del usuario cuando aun no hay GPS real.
export const VELOCIDAD_PRUEBA_KMH = 5;

// Opcional: dejar el ULTIMO fantasma parado fijo en un terminal para probar
// los estados ROJO/FUERA (los descansos normales solo llegan a amarillo).
export const FANTASMA_PARADO_PRUEBA = false;
const TERMINAL_PRUEBA = { lat: -15.493430121555079, lng: -70.1290088220023, sentido: 'ida' }; // Apurimac

// Referencia de tiempo: arranque del modulo (para no usar el epoch gigante).
const T0 = Date.now();

// Pseudo-aleatorio DETERMINISTICO en [0,1) a partir de dos enteros.
function seudoAzar(a, b) {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
}
function descansoIdaS(i, cycle) {
  return (seudoAzar(i + 1, cycle * 2 + 1) < 0.5 ? DESCANSO_IDA_MIN[0] : DESCANSO_IDA_MIN[1]) * 60;
}
function descansoVueltaS(i, cycle) {
  return (seudoAzar(i + 7, cycle * 2 + 5) < 0.5 ? DESCANSO_VUELTA_MIN[0] : DESCANSO_VUELTA_MIN[1]) * 60;
}

// PURA (testeable): posicion del fantasma i a `elapsedS` segundos del arranque.
// Devuelve { lat, lng, sentido, parado }.
export function simularFantasma(i, elapsedS) {
  const vMps = (VELOCIDADES_FANTASMAS[i] * 1000) / 3600;
  const idaLen = largoRuta('ida');
  const vueltaLen = largoRuta('vuelta');
  const tIda = idaLen / vMps;
  const tVuelta = vueltaLen / vMps;

  // Offset inicial para repartirlos a lo largo del recorrido.
  const offset = (i / CANTIDAD_FANTASMAS) * (tIda + tVuelta);
  let t = elapsedS + offset;
  if (t < 0) t = 0;

  for (let cycle = 0; cycle < 100000; cycle++) {
    // 1) Viaje de IDA
    if (t < tIda) {
      const p = puntoEnDistancia('ida', t * vMps);
      return { lat: p.lat, lng: p.lng, sentido: 'ida', parado: false };
    }
    t -= tIda;
    // 2) Descanso en terminal de IDA (Apurimac = fin de la ida)
    const rI = descansoIdaS(i, cycle);
    if (t < rI) {
      const p = puntoEnDistancia('ida', idaLen);
      return { lat: p.lat, lng: p.lng, sentido: 'ida', parado: true };
    }
    t -= rI;
    // 3) Viaje de VUELTA
    if (t < tVuelta) {
      const p = puntoEnDistancia('vuelta', t * vMps);
      return { lat: p.lat, lng: p.lng, sentido: 'vuelta', parado: false };
    }
    t -= tVuelta;
    // 4) Descanso en terminal de VUELTA (Circunvalacion = fin de la vuelta)
    const rV = descansoVueltaS(i, cycle);
    if (t < rV) {
      const p = puntoEnDistancia('vuelta', vueltaLen);
      return { lat: p.lat, lng: p.lng, sentido: 'vuelta', parado: true };
    }
    t -= rV;
  }
  const p = puntoEnDistancia('ida', 0);
  return { lat: p.lat, lng: p.lng, sentido: 'ida', parado: false };
}

// Devuelve los fantasmas con su posicion ACTUAL.
export function fantasmasEnVivo(now = Date.now()) {
  if (!MODO_PRUEBA_FANTASMAS) return [];
  const elapsedS = (now - T0) / 1000;
  const out = [];
  for (let i = 0; i < CANTIDAD_FANTASMAS; i++) {
    if (FANTASMA_PARADO_PRUEBA && i === CANTIDAD_FANTASMAS - 1) {
      out.push({
        unitId: `Fantasma ${i + 1}`,
        driverName: `Fantasma ${i + 1} (parado)`,
        lat: TERMINAL_PRUEBA.lat,
        lng: TERMINAL_PRUEBA.lng,
        sentido: TERMINAL_PRUEBA.sentido,
        fantasma: true,
      });
      continue;
    }
    const s = simularFantasma(i, elapsedS);
    out.push({
      unitId: `Fantasma ${i + 1}`,
      driverName: `Fantasma ${i + 1}`,
      lat: s.lat,
      lng: s.lng,
      sentido: s.sentido,
      fantasma: true,
    });
  }
  return out;
}

export default { MODO_PRUEBA_FANTASMAS, fantasmasEnVivo, simularFantasma, VELOCIDADES_FANTASMAS, CANTIDAD_FANTASMAS };
