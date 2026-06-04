// ============================================================================
//  MapScreen: mapa Leaflet con DOS modos para resolver el conflicto de gestos.
// ============================================================================
//  - PREVIEW (chico): el mapa se VE pero no captura gestos. Una capa encima
//    deja que el carrusel reciba el swipe y, al TOCAR, abre el mapa grande.
//  - PANTALLA COMPLETA: el mapa es 100% interactivo (paneo + zoom nativos de
//    Leaflet). Un boton "X" cierra y vuelve al preview. (En App.js se desactiva
//    el swipe del carrusel mientras esta en pantalla completa.)
//  - Al tocar una unidad (real o fantasma) en pantalla completa, mostramos una
//    tarjeta con nombre, ETA desde mi posicion y el paradero mas cercano.
//  - DATOS: el WebView solo se monta/refresca cuando estas en la pestaña.
// ============================================================================

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFleet } from '../context/FleetContext';
import { PARADAS, paradaMasCercana, distanciaConFallback } from '../services/routeProgress';
import { etaSegundos, formatoMMSS, velocidadParaEta } from '../utils/eta';
import { VELOCIDAD_PRUEBA_KMH } from '../config/fantasmas';
import RutaRecorder from '../components/RutaRecorder';
import colors from '../theme/colors';
import { mono, black } from '../theme/fonts';

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
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
      subdomains: 'abcd', maxZoom: 19
    }).addTo(map);

    var ruta = ${RUTA_JSON};
    var linea = L.polyline(ruta, { color: '${colors.bright}', weight: 4, opacity: 0.85 }).addTo(map);
    var paraderos = ${PARADEROS_JSON};
    paraderos.forEach(function (p) {
      L.circleMarker([p.lat, p.lng], {
        radius: 5, color: '#fff', weight: 2, fillColor: '${colors.brand}', fillOpacity: 1
      }).addTo(map).bindTooltip(p.nombre, { direction: 'top' });
    });
    map.fitBounds(linea.getBounds(), { padding: [40, 40] });

    var iconYo = L.divIcon({ className: '', html: '<div class="yo"></div>', iconSize: [18,18], iconAnchor: [9,9] });
    function iconOtro() { return L.divIcon({ className: '', html: '<div class="otro"></div>', iconSize: [16,16], iconAnchor: [8,8] }); }

    var meMarker = null;
    var otrosMarkers = {};

    window.setMe = function (lat, lng) {
      if (!meMarker) meMarker = L.marker([lat, lng], { icon: iconYo, zIndexOffset: 1000 }).addTo(map);
      else meMarker.setLatLng([lat, lng]);
    };

    function avisarUnidad(u) {
      if (window.ReactNativeWebView)
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'unit', unitId: u.unitId, lat: u.lat, lng: u.lng }));
    }

    window.setOthers = function (lista) {
      var vistos = {};
      lista.forEach(function (u) {
        if (u.lat == null || u.lng == null) return;
        vistos[u.unitId] = true;
        if (otrosMarkers[u.unitId]) {
          otrosMarkers[u.unitId].setLatLng([u.lat, u.lng]);
        } else {
          var m = L.marker([u.lat, u.lng], { icon: iconOtro() }).addTo(map).bindTooltip(u.unitId, { direction: 'top' });
          m.on('click', function () { avisarUnidad(u); });
          otrosMarkers[u.unitId] = m;
        }
      });
      Object.keys(otrosMarkers).forEach(function (id) {
        if (!vistos[id]) { map.removeLayer(otrosMarkers[id]); delete otrosMarkers[id]; }
      });
    };

    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage('ready');
  </script>
</body>
</html>
`;

export default function MapScreen({ active, fullscreen, onToggleFullscreen }) {
  const { userPos, otros, totalOnRoute, connected } = useFleet();
  const webRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState(null); // unidad tocada {unitId,lat,lng}
  const [grabadorVisible, setGrabadorVisible] = useState(false); // grabador de rutas

  // Montaje perezoso: el WebView (y sus tiles) no cargan hasta entrar al mapa.
  const [everActive, setEverActive] = useState(false);
  useEffect(() => {
    if (active) setEverActive(true);
  }, [active]);

  // Al salir de pantalla completa, cerramos la tarjeta de info.
  useEffect(() => {
    if (!fullscreen) setSelected(null);
  }, [fullscreen]);

  // Inyectar mi posicion (solo cuando el mapa esta visible).
  useEffect(() => {
    if (active && ready && userPos && webRef.current) {
      webRef.current.injectJavaScript(`window.setMe(${userPos.lat}, ${userPos.lng}); true;`);
    }
  }, [active, ready, userPos]);

  // Inyectar las demas unidades (incluye fantasmas) cuando el mapa esta visible.
  useEffect(() => {
    if (active && ready && webRef.current) {
      const lista = otros
        .filter((u) => u.lat != null && u.lng != null)
        .map((u) => ({ unitId: u.unitId, lat: u.lat, lng: u.lng }));
      webRef.current.injectJavaScript(`window.setOthers(${JSON.stringify(lista)}); true;`);
    }
  }, [active, ready, otros]);

  // ETA + paradero para la tarjeta de la unidad tocada (reusa la logica existente).
  // Velocidad real (con piso) y distancia a lo largo de la ruta (con fallback).
  const velSel = velocidadParaEta(userPos?.speed, VELOCIDAD_PRUEBA_KMH);
  const etaSel =
    selected && userPos
      ? formatoMMSS(etaSegundos(distanciaConFallback(userPos.lat, userPos.lng, selected.lat, selected.lng), velSel))
      : '--:--';
  const stopSel = selected ? paradaMasCercana(selected.lat, selected.lng) : null;

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
              if (msg.type === 'unit') setSelected({ unitId: msg.unitId, lat: msg.lat, lng: msg.lng });
            } catch {
              // ignorar
            }
          }}
          style={{ flex: 1, backgroundColor: colors.bg }}
        />
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.bg }} />
      )}

      {/* Chip de estado (arriba) */}
      <View style={styles.chip}>
        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: connected ? colors.green : colors.red }} />
        <Text style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1, color: colors.white, textTransform: 'uppercase' }}>
          {connected ? 'En vivo' : 'Sin conexion'} · {totalOnRoute} en ruta
        </Text>
      </View>

      {/* PREVIEW: capa que no deja al mapa comerse el gesto. Tocar = ampliar. */}
      {!fullscreen && (
        <Pressable style={StyleSheet.absoluteFill} onPress={() => onToggleFullscreen(true)}>
          <View pointerEvents="none" style={styles.previewHintCenter}>
            <Text style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1, color: colors.white, textTransform: 'uppercase' }}>
              Tocá para ampliar el mapa
            </Text>
          </View>
          {/* Franja inferior: recordatorio de que se puede deslizar para cambiar de tarjeta */}
          <View pointerEvents="none" style={styles.swipeStrip}>
            <Text style={{ fontFamily: mono, fontSize: 11, letterSpacing: 2, color: colors.dim }}>
              ‹  deslizá para cambiar de tarjeta  ›
            </Text>
          </View>
        </Pressable>
      )}

      {/* PANTALLA COMPLETA: boton para cerrar */}
      {fullscreen && (
        <Pressable style={styles.closeBtn} onPress={() => onToggleFullscreen(false)}>
          <Text style={{ fontFamily: black, color: colors.white, fontSize: 20 }}>✕</Text>
        </Pressable>
      )}

      {/* Tarjeta de info de la unidad tocada */}
      {selected && (
        <View style={styles.infoCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text numberOfLines={1} style={{ fontFamily: black, fontSize: 16, color: colors.white, flex: 1 }}>
              {selected.unitId}
            </Text>
            <Pressable onPress={() => setSelected(null)} hitSlop={10}>
              <Text style={{ fontFamily: black, color: colors.dim, fontSize: 16 }}>✕</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 4 }}>
            <Text style={{ fontFamily: black, fontSize: 34, color: colors.bright, fontVariant: ['tabular-nums'] }}>
              {etaSel}
            </Text>
            <Text style={{ fontFamily: mono, fontSize: 11, color: colors.dim, marginBottom: 6 }}>
              ETA ({VELOCIDAD_PRUEBA_KMH} km/h)
            </Text>
          </View>
          <Text style={{ fontFamily: mono, fontSize: 11, color: colors.mute, marginTop: 2 }}>
            Paradero mas cercano: <Text style={{ color: colors.white }}>{stopSel || '--'}</Text>
          </Text>
        </View>
      )}

      {/* Boton discreto: grabador de rutas (herramienta de trabajo). Va por
          encima de la capa de preview para que se pueda tocar sin ampliar. */}
      <Pressable style={styles.recBtn} onPress={() => setGrabadorVisible(true)}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red }} />
        <Text style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1, color: colors.white }}>REC</Text>
      </Pressable>

      <RutaRecorder visible={grabadorVisible} onClose={() => setGrabadorVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
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
  },
  previewHintCenter: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(10,26,46,0.85)',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  swipeStrip: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(10,26,46,0.8)',
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  recBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    elevation: 5,
  },
  infoCard: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 24,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});
