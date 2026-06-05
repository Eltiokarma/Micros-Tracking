// ============================================================================
//  fantasmas.js  —  Conductores FANTASMA MOVILES (solo para PRUEBAS)
// ============================================================================
//  3 unidades que recorren la ruta en bucle ida -> vuelta -> ida a velocidad
//  constante. Su posicion se calcula segun el tiempo transcurrido (no tienen
//  GPS real). Para el resto del sistema se comportan como unidades normales
//  (aparecen en el mapa, en los relojes adelante/atras, etc.).
//
//  >>> PARA QUITARLOS: poné MODO_PRUEBA_FANTASMAS en false. <<<
// ============================================================================

import { puntoEnDistancia, largoRuta } from '../services/routeProgress';

export const MODO_PRUEBA_FANTASMAS = true;

// Velocidad de los fantasmas (km/h) y cuantos son. Faciles de cambiar.
export const VELOCIDAD_FANTASMA_KMH = 10;
export const CANTIDAD_FANTASMAS = 3;

// Si true, el ULTIMO fantasma queda PARADO en un terminal (Apurimac) para
// probar los estados de espera / fuera de servicio. Poné false para que los 3
// se muevan.
export const FANTASMA_PARADO_PRUEBA = true;
const TERMINAL_PRUEBA = { lat: -15.493430121555079, lng: -70.1290088220023, sentido: 'ida' }; // Apurimac

// Fallback de velocidad para el ETA del usuario cuando aun no hay GPS real.
export const VELOCIDAD_PRUEBA_KMH = 5;

// Reparto inicial a lo largo del bucle: uno arrancando, uno a media ruta, uno
// casi al final (fracciones del largo total del bucle ida+vuelta).
const OFFSETS = [0, 0.45, 0.85];

// Devuelve los fantasmas con su posicion ACTUAL segun el tiempo.
export function fantasmasEnVivo(now = Date.now()) {
  if (!MODO_PRUEBA_FANTASMAS) return [];
  const idaLen = largoRuta('ida');
  const vueltaLen = largoRuta('vuelta');
  const loop = idaLen + vueltaLen || 1;
  const vMps = (VELOCIDAD_FANTASMA_KMH * 1000) / 3600;
  const recorrido = (now / 1000) * vMps; // metros recorridos desde epoch

  const out = [];
  for (let i = 0; i < CANTIDAD_FANTASMAS; i++) {
    // Fantasma de prueba PARADO en un terminal (para ver los estados de espera).
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
    const off = (OFFSETS[i] != null ? OFFSETS[i] : i / CANTIDAD_FANTASMAS) * loop;
    let d = (recorrido + off) % loop;
    if (d < 0) d += loop;

    let pos;
    let sentido;
    if (d < idaLen) {
      pos = puntoEnDistancia('ida', d);
      sentido = 'ida';
    } else {
      pos = puntoEnDistancia('vuelta', d - idaLen);
      sentido = 'vuelta';
    }
    out.push({
      unitId: `Fantasma ${i + 1}`,
      driverName: `Fantasma ${i + 1}`,
      lat: pos.lat,
      lng: pos.lng,
      sentido,
      fantasma: true,
    });
  }
  return out;
}

export default { MODO_PRUEBA_FANTASMAS, fantasmasEnVivo, VELOCIDAD_FANTASMA_KMH, CANTIDAD_FANTASMAS };
