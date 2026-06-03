// ============================================================================
//  session.js  —  Recordar la sesion del chofer entre aperturas
// ============================================================================
//  Guarda el nombre de usuario en un archivo local para que, al reabrir la
//  app, entre directo sin volver a escribirlo. Usamos expo-file-system (que ya
//  es dependencia y esta enlazado/funcionando) en vez de AsyncStorage para NO
//  agregar otro modulo nativo y no arriesgar el build.
// ============================================================================

import * as FileSystem from 'expo-file-system';

const ARCHIVO = (FileSystem.documentDirectory || '') + 'r14-session.json';

export async function guardarSesion(nombre) {
  try {
    await FileSystem.writeAsStringAsync(ARCHIVO, JSON.stringify({ nombre }));
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
    return obj && obj.nombre ? obj.nombre : null;
  } catch {
    return null;
  }
}

export async function borrarSesion() {
  try {
    await FileSystem.deleteAsync(ARCHIVO, { idempotent: true });
  } catch {
    // si no existe, no pasa nada
  }
}

export default { guardarSesion, leerSesion, borrarSesion };
