// ============================================================================
//  FleetContext.js  —  El "cerebro" compartido de la app
// ============================================================================
//
//  QUE ES UN CONTEXT (concepto nuevo):
//  Ya sabes pasar datos de padre a hijo con props. Pero aca tenemos 3
//  pantallas (Chat, Ruta, Mapa) que necesitan LOS MISMOS datos del servidor.
//  Pasar props por toda la app seria un lio ("prop drilling").
//
//  React Context resuelve esto: es como una "pizarra" global. Un componente
//  de arriba (el Provider) escribe en la pizarra, y CUALQUIER componente de
//  abajo la lee con un hook, sin importar que tan profundo este.
//
//  Aca el FleetProvider:
//    - guarda quien soy (mi unitId / nombre)
//    - se conecta al socket y arranca el GPS al hacer login
//    - escucha el estado de la flota (units, gaps) y MI posicion
//    - lo expone todo via el hook useFleet()
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as socket from './../services/socket';
import * as location from './../services/location';
import { leerEstado } from './../services/sharedStatus';
import { guardarSesion, leerSesion, borrarSesion } from './../services/session';
import { FANTASMAS, MODO_PRUEBA_FANTASMAS } from './../config/fantasmas';

// 1) Creamos el contexto (la "pizarra" vacia).
const FleetContext = createContext(null);

// 2) El Provider: envuelve a toda la app y llena la pizarra.
export function FleetProvider({ children }) {
  // --- Quien soy ---
  const [unitId, setUnitId] = useState(null);     // null = no he iniciado sesion
  const [driverName, setDriverName] = useState(null);

  // --- Estado de la flota (lo que manda el servidor) ---
  const [units, setUnits] = useState([]);         // todas las combis con GPS activo
  const [gaps, setGaps] = useState({});           // brechas por unitId
  const [totalOnRoute, setTotalOnRoute] = useState(0);
  const [connected, setConnected] = useState(false); // true = "EN VIVO"

  // --- Mi posicion local (para el punto blanco del mapa) ---
  const [myPosition, setMyPosition] = useState(null);

  // --- Chat y alertas SOS ---
  const [messages, setMessages] = useState([]); // historial de chat de la sesion
  const [sosAlert, setSosAlert] = useState(null); // ultima alerta recibida

  // --- Aviso si el chofer NO dio permiso de background ---
  const [backgroundOk, setBackgroundOk] = useState(true);

  // --- Datos que vienen de la tarea de fondo via store compartido ---
  const [parada, setParada] = useState(null);   // parada mas cercana
  const [avgSpeed, setAvgSpeed] = useState(0);   // velocidad reportada por la tarea
  const [userPos, setUserPos] = useState(null);  // mi posicion {lat,lng} (cruza contextos)

  // --- Sesion recordada: false hasta que terminamos de leer la sesion guardada ---
  const [sessionChecked, setSessionChecked] = useState(false);

  // ------------------------------------------------------------------
  //  Escuchamos al socket SOLO mientras hay sesion iniciada.
  //  Cuando unitId cambia (login), nos suscribimos; al salir, limpiamos.
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!unitId) return; // sin login no escuchamos nada

    const unsubSocket = socket.subscribe((event) => {
      if (event.type === 'state') {
        setUnits(event.state.units);
        setGaps(event.state.gaps);
        setTotalOnRoute(event.state.totalOnRoute);
      } else if (event.type === 'sos_alert') {
        // id unico para que la pantalla detecte "llego una alerta nueva".
        setSosAlert({ ...event, id: `${event.unitId}-${event.timestamp}` });
      } else if (event.type === 'chat_msg') {
        setMessages((prev) => {
          // Evitar duplicar el eco local del propio mensaje: el servidor
          // reenvia el chat_msg conservando unitId + timestamp + text.
          const yaEsta = prev.some(
            (m) => m.unitId === event.unitId && m.timestamp === event.timestamp && m.text === event.text
          );
          if (yaEsta) {
            // marcamos el local como confirmado (deja de ser "optimista")
            return prev.map((m) =>
              m.local && m.unitId === event.unitId && m.timestamp === event.timestamp
                ? { ...m, local: false }
                : m
            );
          }
          return [
            ...prev,
            {
              unitId: event.unitId,
              driverName: event.driverName,
              text: event.text,
              timestamp: event.timestamp,
            },
          ];
        });
      }
    });

    const unsubPos = location.subscribePosition((pos) => {
      setMyPosition(pos);
    });

    // La funcion de limpieza de useEffect: se ejecuta al salir/cambiar unitId.
    return () => {
      unsubSocket();
      unsubPos();
    };
  }, [unitId]);

  // ------------------------------------------------------------------
  //  Conexion REAL desde la tarea de fondo (que vive en otro contexto JS).
  //  La tarea escribe su ultimo envio en un archivo; aca lo leemos cada 3s.
  //  "EN VIVO" = hubo un envio exitoso en los ultimos 10 segundos.
  //  Asi el indicador refleja lo que de verdad esta enviando la tarea,
  //  no el socket (distinto) de la UI.
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!unitId) return undefined;
    let activo = true;
    const revisar = async () => {
      const est = await leerEstado();
      if (!activo || !est) return; // sin lectura valida, mantenemos lo anterior
      const reciente = !!est.enviado && Date.now() - (est.ts || 0) < 10000;
      setConnected(reciente);
      if (est.parada) setParada(est.parada);
      if (typeof est.speed === 'number') setAvgSpeed(est.speed);
      if (est.lat != null && est.lng != null) {
        setUserPos({ lat: est.lat, lng: est.lng, routeProgress: est.routeProgress, speed: est.speed });
      }
    };
    revisar();
    const id = setInterval(revisar, 3000);
    return () => {
      activo = false;
      clearInterval(id);
    };
  }, [unitId]);

  // ------------------------------------------------------------------
  //  login(): el chofer escribe su nombre y entra.
  //  El nombre ES el ID en el servidor (asi lo definiste).
  // ------------------------------------------------------------------
  const login = useCallback(async (nombre) => {
    const id = nombre.trim();
    if (!id) return;

    setUnitId(id);
    setDriverName(id);

    // 0) Recordamos la sesion para entrar directo la proxima vez.
    guardarSesion(id);

    // 1) Abrimos el WebSocket y nos identificamos.
    socket.connect(id, id);

    // 2) Arrancamos el GPS en segundo plano (pide permisos).
    const res = await location.iniciarRastreo();
    setBackgroundOk(res.ok && res.background !== false);
  }, []);

  // ------------------------------------------------------------------
  //  logout(): cerramos todo de forma ordenada.
  // ------------------------------------------------------------------
  const logout = useCallback(async () => {
    await borrarSesion(); // olvidar la sesion para que pida usuario de nuevo
    await location.detenerRastreo();
    socket.disconnect();
    setUnitId(null);
    setDriverName(null);
    setUnits([]);
    setGaps({});
    setTotalOnRoute(0);
    setMyPosition(null);
    setConnected(false);
    setMessages([]);
    setSosAlert(null);
    setParada(null);
    setAvgSpeed(0);
    setUserPos(null);
  }, []);

  // ------------------------------------------------------------------
  //  Restaurar sesion al abrir la app: si hay un nombre guardado, entramos
  //  directo (sin volver a escribir el usuario). No bloqueamos: marcamos
  //  sessionChecked y disparamos el login en segundo plano.
  // ------------------------------------------------------------------
  useEffect(() => {
    let activo = true;
    (async () => {
      const nombre = await leerSesion();
      if (!activo) return;
      if (nombre) login(nombre); // arranca conexion + GPS; setUnitId muestra el main
      setSessionChecked(true);
    })();
    return () => {
      activo = false;
    };
  }, [login]);

  // ------------------------------------------------------------------
  //  Acciones de SOS y chat (usan mi posicion local actual).
  // ------------------------------------------------------------------
  const sendSos = useCallback(() => {
    const p = location.getLastPosition();
    const ok = socket.sendSos({ lat: p?.lat ?? null, lng: p?.lng ?? null });
    // [DIAG] confirma si el socket de la UI (distinto al de la tarea) envia.
    console.log('[diag] sendSos via UI socket | ws.conectado=' + socket.isConnected() + ' | enviado=' + ok);
  }, []);

  const sendChat = useCallback((text) => {
    const limpio = (text || '').trim();
    if (!limpio) return;
    const ts = Date.now();
    const ok = socket.sendChat(limpio, ts);
    // Eco local OPTIMISTA: mostramos el mensaje propio al instante, sin esperar
    // el rebote del servidor (que con una sola unidad podria no llegar nunca).
    setMessages((prev) => [
      ...prev,
      { unitId, driverName, text: limpio, timestamp: ts, local: true },
    ]);
    console.log('[diag] sendChat via UI socket | ws.conectado=' + socket.isConnected() + ' | enviado=' + ok);
  }, [unitId, driverName]);

  // ------------------------------------------------------------------
  //  Atajos utiles para las pantallas:
  //  miGap = mis brechas (toAhead / toBehind) buscadas por mi unitId.
  //  otros = las demas combis (para los puntos azules del mapa).
  // ------------------------------------------------------------------
  const miGap = unitId ? gaps[unitId] || null : null;
  const otrosReales = units.filter((u) => u.unitId !== unitId);
  // En modo prueba agregamos los conductores fantasma (estaticos) a la flota.
  const otros = MODO_PRUEBA_FANTASMAS ? [...otrosReales, ...FANTASMAS] : otrosReales;

  // El "value" es lo que queda escrito en la pizarra para todos.
  const value = {
    unitId,
    driverName,
    units,
    otros,
    gaps,
    miGap,
    totalOnRoute,
    connected,
    myPosition,
    backgroundOk,
    parada,
    avgSpeed,
    userPos,
    sessionChecked,
    messages,
    sosAlert,
    login,
    logout,
    sendSos,
    sendChat,
  };

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
}

// 3) El hook que usaran las pantallas: const { miGap, connected } = useFleet();
export function useFleet() {
  const ctx = useContext(FleetContext);
  if (!ctx) {
    throw new Error('useFleet() debe usarse dentro de un <FleetProvider>');
  }
  return ctx;
}

export default FleetContext;
