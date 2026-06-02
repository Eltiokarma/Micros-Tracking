// ============================================================================
//  MapScreen: el mapa, usando Leaflet DENTRO de un WebView.
// ============================================================================
//  POR QUE ASI:
//  Un mapa nativo (react-native-maps) en Android usa Google Maps y exige una
//  API key con tarjeta de credito. En cambio, una WebView es un "mini
//  navegador" embebido: cargamos ahi el mismo Leaflet + mapas de
//  OpenStreetMap que ya usabas en la web. Gratis, sin key, y reutiliza tu
//  conocimiento.
//
//  EL PUENTE DE COMUNICACION (lo importante de entender):
//    React Native  --(inyecta JS)-->  WebView      : le mandamos posiciones
//    WebView       --(postMessage)-->  React Native : nos avisa "ya cargue"
//
//  React Native no puede tocar el mapa directamente; le "inyecta" codigo
//  JavaScript que ejecuta funciones (window.setMe / window.setOthers) que
//  definimos dentro del HTML.
// ============================================================================

import React, { useRef, useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFleet } from '../context/FleetContext';
import colors from '../theme/colors';
import { mono } from '../theme/fonts';

// Centro inicial: Juliaca (mientras no haya GPS).
const CENTRO = { lat: -15.4954, lng: -70.1335 };

// --- El HTML que vive dentro de la WebView ---------------------------------
// Es una pagina web completa y autonoma. Carga Leaflet desde un CDN y define
// dos funciones globales que React Native llamara: setMe() y setOthers().
const HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { margin: 0; height: 100%; width: 100%; background: ${colors.bg}; }
    .yo {
      width: 18px; height: 18px; border-radius: 50%;
      background: ${colors.white}; border: 3px solid ${colors.bg};
      box-shadow: 0 0 0 2px ${colors.white}, 0 0 12px ${colors.white};
    }
    .otro {
      width: 16px; height: 16px; border-radius: 50%;
      background: ${colors.bright}; border: 2px solid #fff;
      box-shadow: 0 0 8px ${colors.bright};
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false })
      .setView([${CENTRO.lat}, ${CENTRO.lng}], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    var iconYo = L.divIcon({ className: '', html: '<div class="yo"></div>', iconSize: [18,18], iconAnchor: [9,9] });
    function iconOtro() { return L.divIcon({ className: '', html: '<div class="otro"></div>', iconSize: [16,16], iconAnchor: [8,8] }); }

    var meMarker = null;
    var centrado = false;          // centrar el mapa solo en el primer GPS
    var otrosMarkers = {};         // unitId -> marker

    // React Native llama esto con MI posicion.
    window.setMe = function (lat, lng) {
      if (!meMarker) {
        meMarker = L.marker([lat, lng], { icon: iconYo, zIndexOffset: 1000 }).addTo(map);
      } else {
        meMarker.setLatLng([lat, lng]);
      }
      if (!centrado) { map.setView([lat, lng], 15); centrado = true; }
    };

    // React Native llama esto con la lista de los demas choferes.
    window.setOthers = function (lista) {
      var vistos = {};
      lista.forEach(function (u) {
        if (u.lat == null || u.lng == null) return;
        vistos[u.unitId] = true;
        if (otrosMarkers[u.unitId]) {
          otrosMarkers[u.unitId].setLatLng([u.lat, u.lng]);
        } else {
          otrosMarkers[u.unitId] = L.marker([u.lat, u.lng], { icon: iconOtro() })
            .addTo(map).bindTooltip(u.unitId, { direction: 'top' });
        }
      });
      // Quitar markers de los que ya no estan.
      Object.keys(otrosMarkers).forEach(function (id) {
        if (!vistos[id]) { map.removeLayer(otrosMarkers[id]); delete otrosMarkers[id]; }
      });
    };

    // Avisar a React Native que el mapa ya esta listo para recibir datos.
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage('ready');
    }

    // --- GESTOS ---------------------------------------------------------
    // El carrusel maneja el swipe HORIZONTAL; el mapa el paneo VERTICAL + zoom.
    // Desactivamos el arrastre omnidireccional de Leaflet (que se "comia" el
    // swipe lateral), hacemos paneo vertical propio, y reenviamos el gesto
    // horizontal a React Native para cambiar de tarjeta. El pinch-zoom sigue.
    map.dragging.disable();
    (function () {
      var sx = 0, sy = 0, lastY = 0, eje = null, activo = false;
      var cont = document.getElementById('map');
      cont.addEventListener('touchstart', function (e) {
        if (e.touches.length !== 1) { activo = false; return; } // 2 dedos = zoom
        activo = true; eje = null;
        sx = e.touches[0].clientX; sy = e.touches[0].clientY; lastY = sy;
      }, { passive: true });
      cont.addEventListener('touchmove', function (e) {
        if (!activo || e.touches.length !== 1) return;
        var x = e.touches[0].clientX, y = e.touches[0].clientY;
        var dx = x - sx, dy = y - sy;
        if (!eje && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
          eje = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; // fijamos el eje una vez
        }
        if (eje === 'y') { map.panBy([0, lastY - y], { animate: false }); lastY = y; }
        // si eje === 'x' no movemos el mapa: es swipe de carrusel
      }, { passive: true });
      cont.addEventListener('touchend', function (e) {
        if (!activo) return;
        activo = false;
        var ex = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : sx;
        var dx = ex - sx;
        if (eje === 'x' && Math.abs(dx) > 50 && window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'swipe', dir: dx < 0 ? 'next' : 'prev' }));
        }
      }, { passive: true });
    })();
  </script>
</body>
</html>
`;

export default function MapScreen({ onSwipe }) {
  const { myPosition, otros, totalOnRoute, connected } = useFleet();
  const webRef = useRef(null);
  const [ready, setReady] = useState(false);

  // Cuando llega MI posicion (o el mapa recien quedo listo), la inyectamos.
  useEffect(() => {
    if (ready && myPosition && webRef.current) {
      webRef.current.injectJavaScript(
        `window.setMe(${myPosition.lat}, ${myPosition.lng}); true;`
      );
    }
  }, [ready, myPosition]);

  // Cuando cambian los otros choferes, los inyectamos.
  useEffect(() => {
    if (ready && webRef.current) {
      const lista = otros
        .filter((u) => u.lat != null && u.lng != null)
        .map((u) => ({ unitId: u.unitId, lat: u.lat, lng: u.lng }));
      webRef.current.injectJavaScript(
        `window.setOthers(${JSON.stringify(lista)}); true;`
      );
    }
  }, [ready, otros]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html: HTML }}
        // La WebView nos avisa "ready" al cargar, y "swipe" cuando el dedo
        // hace un gesto horizontal sobre el mapa (para cambiar de tarjeta).
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

      {/* Chip flotante: cuantos en ruta + estado de conexion */}
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
    </View>
  );
}
