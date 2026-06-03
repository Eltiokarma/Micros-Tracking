// ============================================================================
//  MapScreen: mapa Leaflet en WebView con la ruta de prueba dibujada encima.
// ============================================================================
//  - Tiles oscuros minimalistas (CartoDB dark) para reducir datos y combinar
//    con el tema. Calles reales, pero estilo liviano.
//  - Dibuja la polilinea de la ruta + los paraderos como puntos.
//  - Unidades: mi posicion (punto blanco) y las demas/fantasmas (azules).
//  - DATOS: el WebView solo se monta/refresca cuando estas en la pestaña del
//    mapa (prop `active`), no todo el tiempo en segundo plano.
//  - Abajo: timers de tiempo estimado a cada conductor fantasma (modo prueba).
// ============================================================================

import React, { useRef, useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFleet } from '../context/FleetContext';
import { PARADAS } from '../services/routeProgress';
import { MODO_PRUEBA_FANTASMAS } from '../config/fantasmas';
import GhostTimers from '../components/GhostTimers';
import colors from '../theme/colors';
import { mono } from '../theme/fonts';

// La ruta como lista de coordenadas, y los paraderos (sin duplicar el final).
const RUTA_JSON = JSON.stringify(PARADAS.map((p) => [p.lat, p.lng]));
const PARADEROS_JSON = JSON.stringify(
  PARADAS.slice(0, -1).map((p) => ({ nombre: p.nombre, lat: p.lat, lng: p.lng }))
);

const HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { margin: 0; height: 100%; width: 100%; background: ${colors.bg}; }
    .yo { width: 18px; height: 18px; border-radius: 50%; background: ${colors.white};
      border: 3px solid ${colors.bg}; box-shadow: 0 0 0 2px ${colors.white}, 0 0 12px ${colors.white}; }
    .otro { width: 16px; height: 16px; border-radius: 50%; background: ${colors.bright};
      border: 2px solid #fff; box-shadow: 0 0 8px ${colors.bright}; }
    .leaflet-tooltip { background: ${colors.panel}; color: ${colors.white}; border: 1px solid ${colors.line}; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false });

    // Tiles oscuros minimalistas (mas livianos visualmente que OSM estandar).
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
      subdomains: 'abcd', maxZoom: 19
    }).addTo(map);

    // --- Ruta de prueba dibujada encima ---
    var ruta = ${RUTA_JSON};
    var linea = L.polyline(ruta, { color: '${colors.bright}', weight: 4, opacity: 0.85 }).addTo(map);
    var paraderos = ${PARADEROS_JSON};
    paraderos.forEach(function (p) {
      L.circleMarker([p.lat, p.lng], {
        radius: 5, color: '#fff', weight: 2, fillColor: '${colors.brand}', fillOpacity: 1
      }).addTo(map).bindTooltip(p.nombre, { direction: 'top' });
    });

    var iconYo = L.divIcon({ className: '', html: '<div class="yo"></div>', iconSize: [18,18], iconAnchor: [9,9] });
    function iconOtro() { return L.divIcon({ className: '', html: '<div class="otro"></div>', iconSize: [16,16], iconAnchor: [8,8] }); }

    var meMarker = null;
    var otrosMarkers = {};
    var centrado = true; // arrancamos viendo TODA la ruta; no recentrar en cada GPS
    map.fitBounds(linea.getBounds(), { padding: [40, 40] });

    window.setMe = function (lat, lng) {
      if (!meMarker) meMarker = L.marker([lat, lng], { icon: iconYo, zIndexOffset: 1000 }).addTo(map);
      else meMarker.setLatLng([lat, lng]);
    };

    window.setOthers = function (lista) {
      var vistos = {};
      lista.forEach(function (u) {
        if (u.lat == null || u.lng == null) return;
        vistos[u.unitId] = true;
        if (otrosMarkers[u.unitId]) otrosMarkers[u.unitId].setLatLng([u.lat, u.lng]);
        else otrosMarkers[u.unitId] = L.marker([u.lat, u.lng], { icon: iconOtro() })
          .addTo(map).bindTooltip(u.unitId, { direction: 'top' });
      });
      Object.keys(otrosMarkers).forEach(function (id) {
        if (!vistos[id]) { map.removeLayer(otrosMarkers[id]); delete otrosMarkers[id]; }
      });
    };

    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage('ready');

    // --- GESTOS: vertical = paneo mapa; horizontal = se reenvia al carrusel (bonus). ---
    map.dragging.disable();
    (function () {
      var sx = 0, sy = 0, lastY = 0, eje = null, activo = false;
      var cont = document.getElementById('map');
      cont.addEventListener('touchstart', function (e) {
        if (e.touches.length !== 1) { activo = false; return; }
        activo = true; eje = null; sx = e.touches[0].clientX; sy = e.touches[0].clientY; lastY = sy;
      }, { passive: true });
      cont.addEventListener('touchmove', function (e) {
        if (!activo || e.touches.length !== 1) return;
        var x = e.touches[0].clientX, y = e.touches[0].clientY, dx = x - sx, dy = y - sy;
        if (!eje && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) eje = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (eje === 'y') { map.panBy([0, lastY - y], { animate: false }); lastY = y; }
      }, { passive: true });
      cont.addEventListener('touchend', function (e) {
        if (!activo) return; activo = false;
        var ex = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : sx;
        var dx = ex - sx;
        if (eje === 'x' && Math.abs(dx) > 50 && window.ReactNativeWebView)
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'swipe', dir: dx < 0 ? 'next' : 'prev' }));
      }, { passive: true });
    })();
  </script>
</body>
</html>
`;

export default function MapScreen({ onSwipe, active }) {
  const { userPos, otros, totalOnRoute, connected } = useFleet();
  const webRef = useRef(null);
  const [ready, setReady] = useState(false);

  // Montaje perezoso: el WebView (y sus tiles) NO se cargan hasta que entras
  // por primera vez a la pestaña del mapa. Despues queda montado.
  const [everActive, setEverActive] = useState(false);
  useEffect(() => {
    if (active) setEverActive(true);
  }, [active]);

  // Inyectar MI posicion (solo cuando el mapa esta visible -> ahorra datos/trabajo).
  useEffect(() => {
    if (active && ready && userPos && webRef.current) {
      webRef.current.injectJavaScript(`window.setMe(${userPos.lat}, ${userPos.lng}); true;`);
    }
  }, [active, ready, userPos]);

  // Inyectar las demas unidades (incluye los fantasmas) cuando el mapa esta visible.
  useEffect(() => {
    if (active && ready && webRef.current) {
      const lista = otros
        .filter((u) => u.lat != null && u.lng != null)
        .map((u) => ({ unitId: u.unitId, lat: u.lat, lng: u.lng }));
      webRef.current.injectJavaScript(`window.setOthers(${JSON.stringify(lista)}); true;`);
    }
  }, [active, ready, otros]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {everActive ? (
        <WebView
          ref={webRef}
          originWhitelist={['*']}
          source={{ html: HTML }}
          onMessage={(e) => {
            const data = e.nativeEvent.data;
            if (data === 'ready') {
              setReady(true);
              return;
            }
            try {
              const msg = JSON.parse(data);
              if (msg.type === 'swipe' && onSwipe) onSwipe(msg.dir);
            } catch {
              // ignorar mensajes que no sean JSON
            }
          }}
          style={{ flex: 1, backgroundColor: colors.bg }}
        />
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.bg }} />
      )}

      {/* Chip flotante: estado de conexion + N en ruta */}
      <View
        style={{
          position: 'absolute',
          top: 56,
          alignSelf: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingVertical: 7,
          paddingHorizontal: 14,
          borderRadius: 100,
          backgroundColor: colors.panel,
          borderWidth: 1,
          borderColor: colors.line,
          elevation: 4,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: connected ? colors.green : colors.red,
          }}
        />
        <Text
          style={{
            fontFamily: mono,
            fontSize: 11,
            letterSpacing: 1,
            color: colors.white,
            textTransform: 'uppercase',
          }}
        >
          {connected ? 'En vivo' : 'Sin conexion'} · {totalOnRoute} en ruta
        </Text>
      </View>

      {/* Timers de prueba hacia cada fantasma (abajo) */}
      {MODO_PRUEBA_FANTASMAS && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          <GhostTimers userPos={userPos} />
        </View>
      )}
    </View>
  );
}
