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
