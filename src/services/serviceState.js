// ============================================================================
//  serviceState.js  —  Estado de servicio automatico por unidad
// ============================================================================
//  Detecta si una combi quedo "fantasma" (app prendida al terminar el turno),
//  distinguiendo "fuera de servicio" de "atascada en trafico".
//
//  Estados:
//    EN_SERVICIO        -> se mueve por la ruta (verde). Normal.
//    DETENIDA_EN_RUTA   -> quieta PERO en medio de la ruta (trafico/semaforo).
//                          NUNCA pasa a fuera de servicio; sigue visible.
//    ESPERA_AMARILLO    -> quieta en un TERMINAL hasta 25 min (descanso normal).
//    ESPERA_ROJO        -> quieta en un terminal 25-30 min (lleva mucho).
//    FUERA_DE_SERVICIO  -> quieta en un terminal mas de 30 min (turno terminado).
//
//  Re-activacion automatica: si una unidad en espera/fuera vuelve a MOVERSE,
//  pasa sola a EN_SERVICIO (resuelve el chofer que almuerza 15' y sale directo).
//
//  Vive 100% en el cliente, sobre las unidades que ya llegan. NO toca el envio
//  GPS, el foreground service ni el servidor.
// ============================================================================

import { distanciaMetros } from '../utils/eta';

export const ESTADOS = {
  EN_SERVICIO: 'en_servicio',
  DETENIDA_EN_RUTA: 'detenida_en_ruta',
  ESPERA_AMARILLO: 'espera_amarillo',
  ESPERA_ROJO: 'espera_rojo',
  FUERA_DE_SERVICIO: 'fuera_de_servicio',
};

// --- CONSTANTES AJUSTABLES (calibrar en la calle) ---------------------------
export const UMBRAL_VEL_KMH = 3;        // por debajo de esto = "quieta"
export const MIN_INTERVALO_S = 2;       // recalcular como mucho cada 2 s
export const RADIO_TERMINAL_M = 100;    // radio de zona terminal  <-- CALIBRAR
export const T_ESPERA_AMARILLO_MS = 25 * 60 * 1000; // hasta 25 min: amarillo
export const T_ESPERA_ROJO_MS = 30 * 60 * 1000;     // 25-30: rojo; >30: fuera

// Si true, las FUERA_DE_SERVICIO se ocultan del mapa; si false, se ven atenuadas.
export const OCULTAR_FUERA_DE_SERVICIO = false;

// Terminales de la ruta (Apurimac y Circunvalacion).
export const TERMINALES = [
  { nombre: 'Apurímac', lat: -15.493430121555079, lng: -70.1290088220023 },
  { nombre: 'Circunvalación', lat: -15.491641494357753, lng: -70.12169544995002 },
];

export function enZonaTerminal(lat, lng, radio = RADIO_TERMINAL_M) {
  return TERMINALES.some((t) => distanciaMetros(lat, lng, t.lat, t.lng) <= radio);
}

// PURA (testeable): calcula el siguiente registro/estado a partir del anterior.
// rec = { lastLat, lastLng, lastTs, quietaDesde, estado } o null (primera vez).
export function siguienteEstado(rec, lat, lng, now) {
  if (!rec) {
    return { lastLat: lat, lastLng: lng, lastTs: now, quietaDesde: null, estado: ESTADOS.EN_SERVICIO };
  }

  const dt = (now - rec.lastTs) / 1000;
  if (dt < MIN_INTERVALO_S) return rec; // demasiado seguido: sin cambios (idempotente)

  const dist = distanciaMetros(rec.lastLat, rec.lastLng, lat, lng);
  const velKmh = dt > 0 ? (dist / dt) * 3.6 : 0;
  const moviendo = velKmh >= UMBRAL_VEL_KMH;

  const nuevo = {
    lastLat: lat,
    lastLng: lng,
    lastTs: now,
    quietaDesde: rec.quietaDesde,
    estado: rec.estado,
  };

  if (moviendo) {
    // Re-activacion automatica.
    nuevo.quietaDesde = null;
    nuevo.estado = ESTADOS.EN_SERVICIO;
    return nuevo;
  }

  // Quieta:
  if (nuevo.quietaDesde == null) nuevo.quietaDesde = now;
  const quietaMs = now - nuevo.quietaDesde;

  if (!enZonaTerminal(lat, lng)) {
    nuevo.estado = ESTADOS.DETENIDA_EN_RUTA; // quieta en ruta: NUNCA fuera de servicio
  } else if (quietaMs <= T_ESPERA_AMARILLO_MS) {
    nuevo.estado = ESTADOS.ESPERA_AMARILLO;
  } else if (quietaMs <= T_ESPERA_ROJO_MS) {
    nuevo.estado = ESTADOS.ESPERA_ROJO;
  } else {
    nuevo.estado = ESTADOS.FUERA_DE_SERVICIO;
  }
  return nuevo;
}

// Gestor singleton: mantiene un registro por unitId.
function crearGestor() {
  const mapa = new Map();
  return {
    estado(unitId, lat, lng, now = Date.now()) {
      const rec = siguienteEstado(mapa.get(unitId) || null, lat, lng, now);
      mapa.set(unitId, rec);
      return rec.estado;
    },
    reset() {
      mapa.clear();
    },
  };
}

const gestor = crearGestor();
export default gestor;
export { crearGestor };
