// ============================================================================
//  App.js  —  Ensamblaje final
// ============================================================================
//  - Envuelve todo en <FleetProvider> (la "pizarra" global).
//  - Si NO hay sesion -> LoginScreen. Si hay -> el carrusel de 3 pantallas.
//  - Carrusel: Chat <- Ruta -> Mapa, deslizable, con dots de navegacion.
//  - Flash rojo a pantalla completa cuando se dispara el SOS.
//
//  El import de './src/services/location' al inicio NO es decorativo:
//  registra la tarea de GPS en segundo plano (TaskManager.defineTask) apenas
//  arranca la app, que es lo que el sistema operativo necesita.
// ============================================================================

import './src/services/location';

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import PagerView from 'react-native-pager-view';

import { FleetProvider, useFleet } from './src/context/FleetContext';
import LoginScreen from './src/screens/LoginScreen';
import ChatScreen from './src/screens/ChatScreen';
import RouteScreen from './src/screens/RouteScreen';
import MapScreen from './src/screens/MapScreen';
import colors from './src/theme/colors';
import { mono } from './src/theme/fonts';

const LABELS = ['CHAT', 'RUTA', 'MAPA'];

function Carousel() {
  const pagerRef = useRef(null);
  const [page, setPage] = useState(1); // arrancamos en RUTA (la pantalla central)
  const [sosFlash, setSosFlash] = useState(false);

  // El flash de SOS se apaga solo a los 2 segundos.
  useEffect(() => {
    if (!sosFlash) return;
    const t = setTimeout(() => setSosFlash(false), 2000);
    return () => clearTimeout(t);
  }, [sosFlash]);

  const goTo = (i) => pagerRef.current?.setPage(i);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* PagerView: paginado horizontal nativo (maneja el swipe por nosotros) */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={1}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}
      >
        <View key="chat" style={{ flex: 1 }}>
          <ChatScreen />
        </View>
        <View key="ruta" style={{ flex: 1 }}>
          <RouteScreen onFireSos={() => setSosFlash(true)} />
        </View>
        <View key="mapa" style={{ flex: 1 }}>
          <MapScreen />
        </View>
      </PagerView>

      {/* Overlay superior: dots de navegacion + etiqueta de la pagina.
          pointerEvents="box-none" deja pasar los toques al mapa salvo en los dots. */}
      <View pointerEvents="box-none" style={styles.topOverlay}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 36 }}>
          {[0, 1, 2].map((i) => (
            <Pressable
              key={i}
              onPress={() => goTo(i)}
              style={{ width: 44, height: 36, alignItems: 'center', justifyContent: 'center' }}
            >
              <View
                style={{
                  width: i === page ? 24 : 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: i === page ? colors.bright : colors.line,
                }}
              />
            </Pressable>
          ))}
        </View>
        <Text
          style={{
            fontFamily: mono,
            fontSize: 9,
            letterSpacing: 2,
            color: colors.dim,
            textTransform: 'uppercase',
            opacity: 0.7,
          }}
        >
          {LABELS[page]}
        </Text>
      </View>

      {/* Flash rojo de SOS a pantalla completa */}
      {sosFlash && (
        <View style={styles.sosFlash}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 44, letterSpacing: 4 }}>SOS</Text>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 2, marginTop: 6 }}>
            ALERTA ENVIADA
          </Text>
        </View>
      )}
    </View>
  );
}

// Decide que mostrar segun haya sesion o no.
function Root() {
  const { unitId } = useFleet();
  return unitId ? <Carousel /> : <LoginScreen />;
}

export default function App() {
  return (
    <FleetProvider>
      <StatusBar style="light" />
      <Root />
    </FleetProvider>
  );
}

const styles = StyleSheet.create({
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    alignItems: 'center',
    zIndex: 10,
  },
  sosFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
});
