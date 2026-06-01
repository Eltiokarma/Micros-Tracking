// ============================================================================
//  socket.js  —  Cliente WebSocket (un solo "telefono" para toda la app)
// ============================================================================
//
//  POR QUE UN "SINGLETON":
//  Un singleton es un modulo del que existe UNA sola instancia en toda la app.
//  Aca eso importa: si cada pantalla (Ruta, Mapa, Chat) abriera su propia
//  conexion, el servidor veria 3 choferes distintos para una sola persona.
//  En cambio, abrimos UNA conexion aca y todas las pantallas se "asoman"
//  a ella suscribiendose. Por eso este archivo exporta funciones (connect,
//  sendGps, subscribe...) en vez de un componente de React.
//
//  EL PROTOCOLO (lo que descubrimos leyendo el servidor):
//    Enviamos:  { type:'identify', unitId, driverName }   <- al conectar
//               { type:'gps', lat, lng, speed, routeProgress }  <- cada ~3s
//    Recibimos: { type:'state', units, gaps, totalOnRoute, timestamp }
//               { type:'unit_joined', unitId }
//               { type:'unit_left', unitId }
// ============================================================================

const WS_URL = 'wss://prototipo-celular-rastreo-01-production.up.railway.app';

// --- Estado interno del modulo (privado, nadie lo toca desde afuera) --------
let ws = null;                 // la conexion WebSocket actual (o null)
let unitId = null;             // mi nombre/ID, lo guardamos para re-identificar
let driverName = null;
let reconnectAttempts = 0;     // cuantas veces seguidas fallo (para el backoff)
let reconnectTimer = null;     // referencia al timer de reconexion
let manualClose = false;       // true cuando NOSOTROS cerramos (logout): no reconectar

// "listeners" = funciones que otras partes de la app nos dan para que las
// llamemos cuando pasa algo. Es el patron "publicador/suscriptor".
const listeners = new Set();

// Ultimo estado recibido del servidor. Lo guardamos para que una pantalla
// que se monta tarde pueda pedir "dame lo ultimo que sabes" sin esperar.
let lastState = { units: [], gaps: {}, totalOnRoute: 0, timestamp: 0 };

let connected = false;

// ---------------------------------------------------------------------------
//  emit(): avisa a TODOS los suscriptores que paso algo.
//  Cada evento tiene un "type" para que el suscriptor decida si le interesa.
// ---------------------------------------------------------------------------
function emit(event) {
  listeners.forEach((fn) => {
    try {
      fn(event);
    } catch (e) {
      // Si un listener falla, no queremos que tumbe a los demas.
      console.warn('[socket] listener fallo:', e);
    }
  });
}

// ---------------------------------------------------------------------------
//  connect(): abre la conexion e "identifica" al chofer.
//  Se llama una vez en el login. Si ya hay conexion, no abre otra.
// ---------------------------------------------------------------------------
export function connect(myUnitId, myDriverName) {
  unitId = myUnitId;
  driverName = myDriverName || 'Conductor';
  manualClose = false;

  // Si ya estamos conectados o conectando, no abrimos una segunda conexion.
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  ws = new WebSocket(WS_URL);

  // --- Cuando la conexion se abre con exito ---
  ws.onopen = () => {
    connected = true;
    reconnectAttempts = 0; // reseteamos el backoff: la red volvio a estar bien
    // Lo primero al conectar: decir quien soy (igual que el cliente web).
    send({ type: 'identify', unitId, driverName });
    emit({ type: 'status', connected: true });
  };

  // --- Cuando llega un mensaje del servidor ---
  ws.onmessage = (e) => {
    let msg;
    try {
      msg = JSON.parse(e.data);
    } catch {
      return; // ignorar lo que no sea JSON valido
    }

    if (msg.type === 'state') {
      // Guardamos el ultimo estado y lo repartimos a las pantallas.
      lastState = {
        units: msg.units || [],
        gaps: msg.gaps || {},
        totalOnRoute: msg.totalOnRoute || 0,
        timestamp: msg.timestamp || Date.now(),
      };
      emit({ type: 'state', state: lastState });
    } else if (msg.type === 'unit_joined' || msg.type === 'unit_left') {
      // Los reenviamos por si una pantalla quiere mostrar un aviso.
      emit({ type: msg.type, unitId: msg.unitId });
    }
  };

  // --- Cuando la conexion se cierra (red caida, servidor reiniciado, etc.) ---
  ws.onclose = () => {
    connected = false;
    emit({ type: 'status', connected: false });
    ws = null;
    // Solo reconectamos si el cierre NO fue intencional (logout).
    if (!manualClose) scheduleReconnect();
  };

  ws.onerror = () => {
    // En React Native, un error suele ir seguido de onclose; dejamos que
    // onclose maneje la reconexion para no duplicar timers.
  };
}

// ---------------------------------------------------------------------------
//  scheduleReconnect(): reintenta con "exponential backoff".
//  POR QUE: si el servidor esta caido, reintentar cada 100ms lo ahoga (a el
//  y a la bateria del celular). En cambio esperamos cada vez un poco mas:
//  2s, 4s, 8s, 16s... con un tope de 30s. Asi somos amables con la red.
// ---------------------------------------------------------------------------
function scheduleReconnect() {
  if (reconnectTimer) return; // ya hay uno programado
  reconnectAttempts += 1;
  const delay = Math.min(2000 * 2 ** (reconnectAttempts - 1), 30000);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (!manualClose && unitId) connect(unitId, driverName);
  }, delay);
}

// ---------------------------------------------------------------------------
//  send(): envia un objeto como JSON, solo si la conexion esta abierta.
//  Es privada: las pantallas usan sendGps(), no send() directo.
// ---------------------------------------------------------------------------
function send(obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
    return true;
  }
  return false; // no conectado: el mensaje se pierde (el GPS manda otro en 3s)
}

// ---------------------------------------------------------------------------
//  sendGps(): manda una posicion. Lo llama el servicio de ubicacion.
// ---------------------------------------------------------------------------
export function sendGps({ lat, lng, speed = 0, routeProgress = 0 }) {
  return send({ type: 'gps', lat, lng, speed, routeProgress });
}

// ---------------------------------------------------------------------------
//  subscribe(): una pantalla llama esto para empezar a recibir eventos.
//  Devuelve una funcion "unsubscribe" para dejar de escuchar cuando la
//  pantalla se desmonta (evita fugas de memoria). Patron clasico de useEffect.
// ---------------------------------------------------------------------------
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ---------------------------------------------------------------------------
//  Helpers de lectura para quien se conecta tarde.
// ---------------------------------------------------------------------------
export function getLastState() {
  return lastState;
}

export function isConnected() {
  return connected;
}

// ---------------------------------------------------------------------------
//  disconnect(): cierre intencional (logout). Marca manualClose para que
//  onclose NO intente reconectar.
// ---------------------------------------------------------------------------
export function disconnect() {
  manualClose = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
  connected = false;
}

export default { connect, disconnect, sendGps, subscribe, getLastState, isConnected };
