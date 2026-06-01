// ============================================================================
//  location.js  —  GPS en segundo plano (LA pieza que resuelve el bug de la PWA)
// ============================================================================
//
//  EL PROBLEMA QUE RESUELVE:
//  En la web, al apagar la pantalla el navegador congela el JavaScript y el
//  GPS deja de actualizarse. Aca usamos dos herramientas nativas de Expo:
//
//    1) expo-task-manager: deja "registrar una tarea" con nombre, que el
//       SISTEMA OPERATIVO ejecuta aunque la app este en segundo plano.
//    2) expo-location con foregroundService: lanza un servicio en primer
//       plano (con notificacion permanente) que evita que Android mate la app.
//
//  Asi, aunque el chofer guarde el celular en el bolsillo con la pantalla
//  apagada, el sistema sigue llamando a nuestra tarea cada 3 segundos.
//
//  NOTA IMPORTANTE: esto NO funciona en la app "Expo Go". Requiere un
//  development build o el APK de EAS. Lo veremos al momento de probar.
// ============================================================================

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { sendGps } from './socket';
import { calcularRouteProgress } from './routeProgress';

// Nombre unico de la tarea. El sistema la identifica por este string.
export const LOCATION_TASK = 'r14-location-task';

// --- Estado local de MI posicion (para pintar el punto blanco "TU") ---------
// El mapa necesita mi posicion al instante, sin esperar el rebote del
// servidor (que tarda ~3s). Por eso la guardamos tambien aca, localmente.
let lastPosition = null; // { lat, lng, speed, routeProgress }
const positionListeners = new Set();

function emitPosition(pos) {
  positionListeners.forEach((fn) => {
    try { fn(pos); } catch (e) { console.warn('[location] listener fallo:', e); }
  });
}

// Una pantalla (el Mapa) se suscribe para recibir MI posicion en vivo.
// Devuelve una funcion para desuscribirse cuando se desmonta.
export function subscribePosition(listener) {
  positionListeners.add(listener);
  if (lastPosition) listener(lastPosition); // entregale lo ultimo de inmediato
  return () => positionListeners.delete(listener);
}

export function getLastPosition() {
  return lastPosition;
}

// ============================================================================
//  LA TAREA EN SEGUNDO PLANO
//  defineTask se ejecuta al cargar el modulo (por eso importamos este archivo
//  bien temprano, en App.js). Aca adentro NO uses hooks de React: esto puede
//  correr cuando la interfaz ni siquiera esta visible.
// ============================================================================
TaskManager.defineTask(LOCATION_TASK, ({ data, error }) => {
  if (error) {
    console.warn('[location] error en la tarea:', error.message);
    return;
  }
  if (!data) return;

  const { locations } = data;
  if (!locations || locations.length === 0) return;

  // El sistema puede entregar varias lecturas juntas; usamos la mas reciente.
  const { coords } = locations[locations.length - 1];

  // coords.speed viene en metros/segundo y puede ser -1 si se desconoce.
  const speedKmh = coords.speed && coords.speed > 0
    ? Math.round(coords.speed * 3.6) // m/s -> km/h
    : 0;

  const routeProgress = calcularRouteProgress(coords.latitude, coords.longitude);

  lastPosition = {
    lat: coords.latitude,
    lng: coords.longitude,
    speed: speedKmh,
    routeProgress,
  };

  // 1) Avisamos al mapa local (punto blanco).
  emitPosition(lastPosition);

  // 2) Enviamos al servidor por WebSocket (si esta conectado).
  sendGps(lastPosition);
});

// ============================================================================
//  PERMISOS
//  Android pide la ubicacion en DOS pasos: primero "mientras uso la app",
//  y despues, por separado, "todo el tiempo" (background). Necesitamos el
//  segundo si o si para que funcione con la pantalla apagada.
// ============================================================================
export async function pedirPermisos() {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') {
    return { ok: false, motivo: 'foreground' }; // sin esto no hay nada que hacer
  }

  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== 'granted') {
    // La app funciona con pantalla encendida, pero avisamos que el rastreo
    // se cortara al bloquear el celular. La UI puede mostrar este aviso.
    return { ok: true, background: false };
  }

  return { ok: true, background: true };
}

// ============================================================================
//  ARRANCAR / DETENER EL RASTREO
// ============================================================================
export async function iniciarRastreo() {
  const permisos = await pedirPermisos();
  if (!permisos.ok) return permisos;

  // Si ya estaba corriendo, no lo arrancamos dos veces.
  const yaCorriendo = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (yaCorriendo) return { ok: true, yaActivo: true };

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.High, // GPS preciso (necesario para la calle)
    timeInterval: 3000,               // cada ~3 segundos (igual que la PWA)
    distanceInterval: 0,              // 0 = no esperar a moverse X metros; manda por tiempo

    // pausesUpdatesAutomatically lo dejamos en false: iOS por su cuenta podria
    // "pausar" si cree que estas quieto. Una combi en semaforo NO debe pausar.
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true, // iOS: muestra el indicador azul

    // --- ESTO es lo que mantiene viva la app con la pantalla apagada ---
    foregroundService: {
      notificationTitle: 'R-14 en ruta',
      notificationBody: 'Compartiendo tu posicion con la cooperativa.',
      notificationColor: '#2580CF',
    },
  });

  return { ok: true, background: permisos.background };
}

export async function detenerRastreo() {
  const yaCorriendo = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (yaCorriendo) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }
  lastPosition = null;
}

export default { iniciarRastreo, detenerRastreo, subscribePosition, getLastPosition, pedirPermisos };
