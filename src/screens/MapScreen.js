// ============================================================================
//  MapScreen: mapa Leaflet con rutas IDA/VUELTA, burbujas de ETA y 2 modos.
// ============================================================================
//  - Dibuja la ruta de IDA (linea llena) y la de VUELTA (punteada) + paraderos.
//  - Cada unidad muestra una BURBUJA flotante con su ETA (sin tocarla).
//  - Preview (no captura gestos; tocar = ampliar) y pantalla completa (interactivo).
//  - Tocar una unidad abre tarjeta con ETA + paradero (por su sentido).
//  - El WebView solo carga/refresca cuando estas en la pestaña (prop active).
// ============================================================================

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFleet } from '../context/FleetContext';
import {
  PARADAS,
  PARADAS_IDA,
  PARADAS_VUELTA,
  paradaMasCercana,
  distanciaConFallback,
  detectarSentido,
} from '../services/routeProgress';
import { etaSegundos, formatoMMSS, velocidadParaEta } from '../utils/eta';
import { VELOCIDAD_PRUEBA_KMH } from '../config/fantasmas';
import { ESTADOS, OCULTAR_FUERA_DE_SERVICIO } from '../services/serviceState';
import RutaRecorder from '../components/RutaRecorder';
import colors from '../theme/colors';
import { mono, black } from '../theme/fonts';

// Color del icono/burbuja segun el estado de servicio de la unidad.
const COLOR_ESTADO = {
  [ESTADOS.EN_SERVICIO]: colors.green,
  [ESTADOS.DETENIDA_EN_RUTA]: colors.bright,
  [ESTADOS.ESPERA_AMARILLO]: colors.yellow,
  [ESTADOS.ESPERA_ROJO]: colors.red,
  [ESTADOS.FUERA_DE_SERVICIO]: colors.dim,
};
const ETIQUETA_ESTADO = {
  [ESTADOS.DETENIDA_EN_RUTA]: 'detenida',
  [ESTADOS.ESPERA_AMARILLO]: 'en espera',
  [ESTADOS.ESPERA_ROJO]: 'en espera!',
  [ESTADOS.FUERA_DE_SERVICIO]: 'fuera de servicio',
};

const RUTA_IDA_JSON = JSON.stringify(PARADAS_IDA.map((p) => [p.lat, p.lng]));
const RUTA_VUELTA_JSON = JSON.stringify(PARADAS_VUELTA.map((p) => [p.lat, p.lng]));
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
    .leaflet-tooltip.bubble {
      background: rgba(22,48,74,0.92); color: ${colors.white};
      border: 1px solid ${colors.line}; border-radius: 8px;
      font-size: 10px; line-height: 1.2; padding: 2px 6px;
      white-space: nowrap; box-shadow: none; pointer-events: none;
    }
    .leaflet-tooltip.bubble:before { display: none; } /* sin flecha, para no estorbar */
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

    // Rutas con DOS colores distintos: IDA azul (llena), VUELTA naranja (punteada).
    var lIda = L.polyline(${RUTA_IDA_JSON}, { color: '${colors.rutaIda}', weight: 4, opacity: 0.95 }).addTo(map);
    var lVuelta = L.polyline(${RUTA_VUELTA_JSON}, { color: '${colors.rutaVuelta}', weight: 4, opacity: 0.95, dashArray: '6,7' }).addTo(map);
    var paraderos = ${PARADEROS_JSON};
    paraderos.forEach(function (p) {
      L.circleMarker([p.lat, p.lng], {
        radius: 5, color: '#fff', weight: 2, fillColor: '${colors.brand}', fillOpacity: 1
      }).addTo(map).bindTooltip(p.nombre, { direction: 'bottom' });
    });
    map.fitBounds(lIda.getBounds().extend(lVuelta.getBounds()), { padding: [40, 40] });

    var iconYo = L.divIcon({ className: '', html: '<div class="yo"></div>', iconSize: [18,18], iconAnchor: [9,9] });
    function iconOtro(color, op) {
      return L.divIcon({ className: '',
        html: '<div class="otro" style="background:' + (color || '${colors.bright}') + ';opacity:' + (op == null ? 1 : op) + '"></div>',
        iconSize: [16,16], iconAnchor: [8,8] });
    }
    function burbuja(nombre, info, etiqueta) {
      return '<b>' + nombre + '</b>' + (info ? '<br>' + info : '') + (etiqueta ? '<br><i>' + etiqueta + '</i>' : '');
    }

    var meMarker = null;
    var otrosMarkers = {};

    window.setMe = function (lat, lng) {
      if (!meMarker) meMarker = L.marker([lat, lng], { icon: iconYo, zIndexOffset: 1000 }).addTo(map);
      else meMarker.setLatLng([lat, lng]);
    };

    function avisarUnidad(u) {
      if (window.ReactNativeWebView)
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'unit', unitId: u.unitId, nombre: u.nombre, lat: u.lat, lng: u.lng }));
    }

    window.setOthers = function (lista) {
      var vistos = {};
      lista.forEach(function (u) {
        if (u.lat == null || u.lng == null) return;
        vistos[u.unitId] = true;
        var tip = burbuja(u.nombre || u.unitId, u.info, u.etiqueta);
        if (otrosMarkers[u.unitId]) {
          var m0 = otrosMarkers[u.unitId];
          m0.setLatLng([u.lat, u.lng]);
          m0.setIcon(iconOtro(u.color, u.op));
          m0.setTooltipContent(tip);
        } else {
          var m = L.marker([u.lat, u.lng], { icon: iconOtro(u.color, u.op) }).addTo(map);
          m.bindTooltip(tip, { permanent: true, direction: 'top', offset: [0, -10], className: 'bubble' });
          (function (uu) { m.on('click', function () { avisarUnidad(uu); }); })(u);
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
  const [selected, setSelected] = useState(null);
  const [grabadorVisible, setGrabadorVisible] = useState(false);

  const [everActive, setEverActive] = useState(false);
  useEffect(() => {
    if (active) setEverActive(true);
  }, [active]);

  useEffect(() => {
    if (!fullscreen) setSelected(null);
  }, [fullscreen]);

  // Inyectar mi posicion (solo cuando el mapa esta visible).
  useEffect(() => {
    if (active && ready && userPos && webRef.current) {
      webRef.current.injectJavaScript(`window.setMe(${userPos.lat}, ${userPos.lng}); true;`);
    }
  }, [active, ready, userPos]);

  // Inyectar las demas unidades CON su burbuja de ETA (depende de userPos).
  useEffect(() => {
    if (!(active && ready && webRef.current)) return;
    const vel = velocidadParaEta(userPos?.speed, VELOCIDAD_PRUEBA_KMH);
    const lista = otros
      .filter((u) => u.lat != null && u.lng != null)
      // Opcionalmente ocultar las fuera de servicio (config); por defecto se ven atenuadas.
      .filter((u) => !(OCULTAR_FUERA_DE_SERVICIO && u.estado === ESTADOS.FUERA_DE_SERVICIO))
      .map((u) => {
        let info = '';
        if (userPos && userPos.lat != null) {
          const us = u.sentido || detectarSentido(u.lat, u.lng);
          const d = distanciaConFallback(userPos.lat, userPos.lng, u.lat, u.lng, us);
          info = formatoMMSS(etaSegundos(d, vel));
        }
        return {
          unitId: u.unitId,
          nombre: u.driverName || u.unitId,
          lat: u.lat,
          lng: u.lng,
          info,
          color: COLOR_ESTADO[u.estado] || colors.bright,
          op: u.estado === ESTADOS.FUERA_DE_SERVICIO ? 0.4 : 1,
          etiqueta: ETIQUETA_ESTADO[u.estado] || '',
        };
      });
    webRef.current.injectJavaScript(`window.setOthers(${JSON.stringify(lista)}); true;`);
  }, [active, ready, otros, userPos]);

  // Tarjeta de la unidad tocada: ETA + paradero por SU sentido.
  const selSentido = selected ? detectarSentido(selected.lat, selected.lng) : null;
  const velSel = velocidadParaEta(userPos?.speed, VELOCIDAD_PRUEBA_KMH);
  const etaSel =
    selected && userPos
      ? formatoMMSS(etaSegundos(distanciaConFallback(userPos.lat, userPos.lng, selected.lat, selected.lng, selSentido), velSel))
      : '--:--';
  const stopSel = selected ? paradaMasCercana(selected.lat, selected.lng, selSentido) : null;

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
              if (msg.type === 'unit') setSelected({ unitId: msg.unitId, nombre: msg.nombre, lat: msg.lat, lng: msg.lng });
            } catch {
              // ignorar
            }
          }}
          style={{ flex: 1, backgroundColor: colors.bg }}
        />
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.bg }} />
      )}

      {/* Chip de estado */}
      <View style={styles.chip}>
        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: connected ? colors.green : colors.red }} />
        <Text style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1, color: colors.white, textTransform: 'uppercase' }}>
          {connected ? 'En vivo' : 'Sin conexion'} · {totalOnRoute} en ruta
        </Text>
      </View>

      {/* PREVIEW: capa que deja cambiar de tarjeta; tocar = ampliar */}
      {!fullscreen && (
        <Pressable style={StyleSheet.absoluteFill} onPress={() => onToggleFullscreen(true)}>
          <View pointerEvents="none" style={styles.previewHintCenter}>
            <Text style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1, color: colors.white, textTransform: 'uppercase' }}>
              Tocá para ampliar el mapa
            </Text>
          </View>
          <View pointerEvents="none" style={styles.swipeStrip}>
            <Text style={{ fontFamily: mono, fontSize: 11, letterSpacing: 2, color: colors.dim }}>
              ‹  deslizá para cambiar de tarjeta  ›
            </Text>
          </View>
        </Pressable>
      )}

      {/* PANTALLA COMPLETA: cerrar */}
      {fullscreen && (
        <Pressable style={styles.closeBtn} onPress={() => onToggleFullscreen(false)}>
          <Text style={{ fontFamily: black, color: colors.white, fontSize: 20 }}>✕</Text>
        </Pressable>
      )}

      {/* Boton discreto pero comodo: grabador de rutas */}
      <Pressable style={styles.recBtn} onPress={() => setGrabadorVisible(true)} hitSlop={10}>
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.red }} />
        <Text style={{ fontFamily: black, fontSize: 13, letterSpacing: 1, color: colors.white }}>GRABAR</Text>
      </Pressable>

      {/* Tarjeta de la unidad tocada */}
      {selected && (
        <View style={styles.infoCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text numberOfLines={1} style={{ fontFamily: black, fontSize: 16, color: colors.white, flex: 1 }}>
              {selected.nombre || selected.unitId}
            </Text>
            <Pressable onPress={() => setSelected(null)} hitSlop={10}>
              <Text style={{ fontFamily: black, color: colors.dim, fontSize: 16 }}>✕</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 4 }}>
            <Text style={{ fontFamily: black, fontSize: 34, color: colors.bright, fontVariant: ['tabular-nums'] }}>
              {etaSel}
            </Text>
            <Text style={{ fontFamily: mono, fontSize: 11, color: colors.dim, marginBottom: 6 }}>ETA</Text>
          </View>
          <Text style={{ fontFamily: mono, fontSize: 11, color: colors.mute, marginTop: 2 }}>
            Paradero mas cercano: <Text style={{ color: colors.white }}>{stopSel || '--'}</Text>
          </Text>
        </View>
      )}

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
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 100,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.red,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
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
