// ============================================================================
//  sharedStatus.js  —  Puente entre la tarea de fondo y la UI
// ============================================================================
//  PROBLEMA QUE RESUELVE:
//  La tarea de GPS (background) y la interfaz corren en CONTEXTOS JavaScript
//  SEPARADOS. La variable del WebSocket que usa la tarea NO es la misma que ve
//  la UI. Por eso la pantalla mostraba "sin conexion" aunque la tarea estuviera
//  enviando con ws.conectado=true.
//
//  SOLUCION: la tarea escribe su ultimo estado (conectado, ultimo envio,
//  progreso, parada) en un ARCHIVO del dispositivo. La UI lee ese archivo cada
//  pocos segundos. El archivo es compartido por ambos contextos (mismo sandbox
//  de la app), asi que es un "store comun" simple y sin dependencias nuevas.
// ============================================================================

import * as FileSystem from 'expo-file-system';

const ARCHIVO = (FileSystem.documentDirectory || '') + 'r14-status.json';

// La tarea de fondo llama esto en cada lectura de GPS (fire-and-forget).
export async function escribirEstado(obj) {
  try {
    await FileSystem.writeAsStringAsync(ARCHIVO, JSON.stringify(obj));
  } catch (e) {
    console.warn('[status] no se pudo escribir el estado:', e?.message || e);
  }
}

// La UI llama esto cada pocos segundos. Devuelve el objeto o null si aun no hay
// nada / el archivo estaba a medio escribir (en cuyo caso se reintenta luego).
export async function leerEstado() {
  try {
    const info = await FileSystem.getInfoAsync(ARCHIVO);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(ARCHIVO);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default { escribirEstado, leerEstado };
