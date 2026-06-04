// ============================================================================
//  chatStore.js  —  Persistencia LIGERA de los mensajes del DIA (jornada)
// ============================================================================
//  El chat es para avisos del momento, no historial permanente. Guardamos los
//  mensajes junto con la fecha de HOY; al abrir, si la fecha guardada no es la
//  de hoy, se descartan (limpieza automatica de dias anteriores).
//  Usa expo-file-system (ya enlazado) -> NO agrega modulos nativos nuevos.
// ============================================================================

import * as FileSystem from 'expo-file-system';

const ARCHIVO = (FileSystem.documentDirectory || '') + 'r14-chat.json';

// Fecha local "YYYY-MM-DD" (no UTC, para que la "jornada" sea la del chofer).
function hoyStr() {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

export async function guardarMensajes(mensajes) {
  try {
    await FileSystem.writeAsStringAsync(ARCHIVO, JSON.stringify({ fecha: hoyStr(), mensajes }));
  } catch (e) {
    console.warn('[chat] no se pudo guardar:', e?.message || e);
  }
}

// Devuelve los mensajes SOLO si son de hoy; si son de otro dia, los borra.
export async function leerMensajesDeHoy() {
  try {
    const info = await FileSystem.getInfoAsync(ARCHIVO);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(ARCHIVO);
    const obj = JSON.parse(raw);
    if (obj && obj.fecha === hoyStr() && Array.isArray(obj.mensajes)) {
      return obj.mensajes;
    }
    // Dia distinto: limpiamos para empezar la jornada de cero.
    await FileSystem.deleteAsync(ARCHIVO, { idempotent: true });
    return [];
  } catch {
    return [];
  }
}

export default { guardarMensajes, leerMensajesDeHoy };
