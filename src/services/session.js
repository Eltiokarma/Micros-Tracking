// ============================================================================
//  session.js  —  Recordar la sesion del chofer (larga duracion, ~1 mes)
// ============================================================================
//  Guarda el nombre de usuario + la fecha. Al reabrir, entra directo si la
//  sesion tiene menos de DURACION_SESION_MS (30 dias). El boton de cerrar
//  sesion manual sigue funcionando (borrarSesion). Usa expo-file-system.
// ============================================================================

import * as FileSystem from 'expo-file-system';

const ARCHIVO = (FileSystem.documentDirectory || '') + 'r14-session.json';

// Duracion de la sesion recordada: ~1 mes.
export const DURACION_SESION_MS = 30 * 24 * 60 * 60 * 1000;

export async function guardarSesion(nombre) {
  try {
    await FileSystem.writeAsStringAsync(ARCHIVO, JSON.stringify({ nombre, ts: Date.now() }));
  } catch (e) {
    console.warn('[session] no se pudo guardar:', e?.message || e);
  }
}

export async function leerSesion() {
  try {
    const info = await FileSystem.getInfoAsync(ARCHIVO);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(ARCHIVO);
    const obj = JSON.parse(raw);
    if (!obj || !obj.nombre) return null;
    // Si tiene fecha y ya vencio (>30 dias), la descartamos.
    if (obj.ts && Date.now() - obj.ts > DURACION_SESION_MS) {
      await FileSystem.deleteAsync(ARCHIVO, { idempotent: true });
      return null;
    }
    return obj.nombre;
  } catch {
    return null;
  }
}

export async function borrarSesion() {
  try {
    await FileSystem.deleteAsync(ARCHIVO, { idempotent: true });
  } catch {
    // si no existe, nada que hacer
  }
}

export default { guardarSesion, leerSesion, borrarSesion, DURACION_SESION_MS };
