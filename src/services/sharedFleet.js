// ============================================================================
//  sharedFleet.js  —  Puente de la LISTA DE UNIDADES entre contextos JS
// ============================================================================
//  El broadcast 'state' del servidor (lista de unidades de la flota) llega al
//  socket que esta en el contexto de la TAREA de fondo, no al de la UI. Para
//  que la UI vea la flota EN VIVO, el contexto que recibe el 'state' lo escribe
//  aca (archivo), y la UI lo lee por polling. Mismo patron que sharedStatus.js
//  (pero archivo aparte; NO se toca sharedStatus.js).
//
//  Guarda { units, gaps, totalOnRoute, timestamp } tal como vienen del servidor.
//  Son solo las unidades REALES (los fantasmas se agregan en el cliente).
// ============================================================================

import * as FileSystem from 'expo-file-system';

const ARCHIVO = (FileSystem.documentDirectory || '') + 'r14-fleet.json';

// La escribe el contexto que tiene la conexion viva (socket.js, al recibir 'state').
export async function escribirFlota(state) {
  try {
    await FileSystem.writeAsStringAsync(ARCHIVO, JSON.stringify(state));
  } catch (e) {
    console.warn('[fleet] no se pudo escribir la flota:', e?.message || e);
  }
}

// La lee la UI cada pocos segundos. Devuelve el objeto o null si no hay/medio escrito.
export async function leerFlota() {
  try {
    const info = await FileSystem.getInfoAsync(ARCHIVO);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(ARCHIVO);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default { escribirFlota, leerFlota };
