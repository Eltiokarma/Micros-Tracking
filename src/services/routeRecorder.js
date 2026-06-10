// ============================================================================
//  routeRecorder.js  —  Grabador de rutas (herramienta de trabajo)
// ============================================================================
//  Captura puntos GPS para mapear rutas reales: subirte a una combi, grabar el
//  recorrido y exportar los puntos para armar una ruta nueva.
//
//  CLAVE: guarda un punto cada vez que te DESPLAZAS ~30 m desde el ultimo punto
//  (distancia recorrida, NO tiempo) -> parar en un semaforo NO genera puntos
//  repetidos.
//
//  Reutiliza las lecturas de GPS que ya ocurren (userPos del store); NO toca el
//  envio al servidor ni el foreground service. Persiste en expo-file-system
//  (ya enlazado) -> sin modulos nativos nuevos.
// ============================================================================

import * as FileSystem from 'expo-file-system';
import { distanciaMetros } from '../utils/eta';

// Distancia minima (m) entre puntos guardados. Facil de cambiar.
export const DISTANCIA_GRABADOR_M = 30;

const ARCHIVO = (FileSystem.documentDirectory || '') + 'r14-grabacion.json';

// Agrega el punto SOLO si la lista esta vacia o si esta a >= DISTANCIA_GRABADOR_M
// del ultimo. Si no corresponde, devuelve EL MISMO array (para detectar "sin cambio").
export function agregarPunto(puntos, lat, lng) {
  if (!puntos || puntos.length === 0) return [{ lat, lng, t: Date.now() }];
  const ult = puntos[puntos.length - 1];
  const d = distanciaMetros(ult.lat, ult.lng, lat, lng);
  if (d >= DISTANCIA_GRABADOR_M) return [...puntos, { lat, lng, t: Date.now() }];
  return puntos;
}

// Texto "lat, lng" por linea (facil de copiar/pegar).
export function formatoTexto(puntos) {
  return (puntos || []).map((p) => p.lat.toFixed(6) + ', ' + p.lng.toFixed(6)).join('\n');
}

export async function guardarGrabacion(puntos) {
  try {
    await FileSystem.writeAsStringAsync(ARCHIVO, JSON.stringify({ puntos }));
  } catch (e) {
    console.warn('[rec] no se pudo guardar la grabacion:', e?.message || e);
  }
}

export async function leerGrabacion() {
  try {
    const info = await FileSystem.getInfoAsync(ARCHIVO);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(ARCHIVO);
    const obj = JSON.parse(raw);
    return Array.isArray(obj && obj.puntos) ? obj.puntos : [];
  } catch {
    return [];
  }
}

export async function limpiarGrabacion() {
  try {
    await FileSystem.deleteAsync(ARCHIVO, { idempotent: true });
  } catch {
    // si no existe, nada que hacer
  }
}

export default {
  DISTANCIA_GRABADOR_M,
  agregarPunto,
  formatoTexto,
  guardarGrabacion,
  leerGrabacion,
  limpiarGrabacion,
};
