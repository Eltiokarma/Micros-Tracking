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

  // --- Aviso si el chofer NO dio permiso de background ---
  const [backgroundOk, setBackgroundOk] = useState(true);

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
      } else if (event.type === 'status') {
        setConnected(event.connected);
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
  //  login(): el chofer escribe su nombre y entra.
  //  El nombre ES el ID en el servidor (asi lo definiste).
  // ------------------------------------------------------------------
  const login = useCallback(async (nombre) => {
    const id = nombre.trim();
    if (!id) return;

    setUnitId(id);
    setDriverName(id);

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
    await location.detenerRastreo();
    socket.disconnect();
    setUnitId(null);
    setDriverName(null);
    setUnits([]);
    setGaps({});
    setTotalOnRoute(0);
    setMyPosition(null);
    setConnected(false);
  }, []);

  // ------------------------------------------------------------------
  //  Atajos utiles para las pantallas:
  //  miGap = mis brechas (toAhead / toBehind) buscadas por mi unitId.
  //  otros = las demas combis (para los puntos azules del mapa).
  // ------------------------------------------------------------------
  const miGap = unitId ? gaps[unitId] || null : null;
  const otros = units.filter((u) => u.unitId !== unitId);

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
    login,
    logout,
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
