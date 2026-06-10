// ============================================================================
//  session.js  —  Recordar la sesion de la UNIDAD (larga duracion, ~1 mes)
// ============================================================================
//  Guarda usuario de unidad + rol + apodo + fecha. Al reabrir, entra directo
//  si la sesion tiene menos de DURACION_SESION_MS (30 dias). El boton de cerrar
//  sesion manual sigue funcionando (borrarSesion). Usa expo-file-system.
// ============================================================================

import * as FileSystem from 'expo-file-system';

const ARCHIVO = (FileSystem.documentDirectory || '') + 'r14-session.json';

export const DURACION_SESION_MS = 30 * 24 * 60 * 60 * 1000; // ~1 mes

// datos = { usuario, rol, apodo }
export async function guardarSesion(datos) {
  try {
    await FileSystem.writeAsStringAsync(ARCHIVO, JSON.stringify({ ...datos, ts: Date.now() }));
  } catch (e) {
    console.warn('[session] no se pudo guardar:', e?.message || e);
  }
}

// Devuelve { usuario, rol, apodo } o null (si no hay o vencio).
export async function leerSesion() {
  try {
    const info = await FileSystem.getInfoAsync(ARCHIVO);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(ARCHIVO);
    const obj = JSON.parse(raw);
    if (!obj || !obj.usuario) return null;
    if (obj.ts && Date.now() - obj.ts > DURACION_SESION_MS) {
      await FileSystem.deleteAsync(ARCHIVO, { idempotent: true });
      return null;
    }
    return { usuario: obj.usuario, rol: obj.rol, apodo: obj.apodo };
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
