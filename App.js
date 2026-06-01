// ============================================================================
//  App.js  —  Ensamblaje final
// ============================================================================
//  - Carga las fuentes reales (Archivo Black / JetBrains Mono) antes de pintar.
//  - Envuelve todo en <FleetProvider> (la "pizarra" global).
//  - Si NO hay sesion -> LoginScreen. Si hay -> el carrusel de 3 pantallas.
//  - Carrusel: Chat <- Ruta -> Mapa, deslizable, con dots de navegacion.
//  - Flash rojo a pantalla completa cuando se dispara un SOS (propio o de otro).
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
import { useFonts } from 'expo-font';
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

import { FleetProvider, useFleet } from './src/context/FleetContext';
import LoginScreen from './src/screens/LoginScreen';
import ChatScreen from './src/screens/ChatScreen';
import RouteScreen from './src/screens/RouteScreen';
import MapScreen from './src/screens/MapScreen';
import colors from './src/theme/colors';
import { mono, black } from './src/theme/fonts';

const LABELS = ['CHAT', 'RUTA', 'MAPA'];

function Carousel() {
  const { sosAlert, unitId } = useFleet();
  const pagerRef = useRef(null);
  const [page, setPage] = useState(1); // arrancamos en RUTA (la pantalla central)

  // flash = { title, subtitle } o null. Lo dispara mi propio SOS o el de otros.
  const [flash, setFlash] = useState(null);

  // El flash se apaga solo a los 2 segundos.
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 2000);
    return () => clearTimeout(t);
  }, [flash]);

  // Cuando llega una alerta de OTRO chofer, mostramos su nombre.
  // (La mia ya la muestro al instante desde onFireSos, sin esperar al servidor.)
  useEffect(() => {
    if (sosAlert && sosAlert.unitId !== unitId) {
      setFlash({ title: 'SOS', subtitle: `${sosAlert.driverName || sosAlert.unitId} necesita ayuda` });
    }
  }, [sosAlert, unitId]);

  const goTo = (i) => pagerRef.current?.setPage(i);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
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
          <RouteScreen onFireSos={() => setFlash({ title: 'SOS', subtitle: 'ALERTA ENVIADA' })} />
        </View>
        <View key="mapa" style={{ flex: 1 }}>
          <MapScreen />
        </View>
      </PagerView>

      {/* Overlay superior: dots + etiqueta. box-none deja pasar toques al mapa. */}
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
      {flash && (
        <View style={styles.sosFlash}>
          <Text style={{ fontFamily: black, color: '#fff', fontSize: 44, letterSpacing: 4 }}>
            {flash.title}
          </Text>
          <Text
            style={{
              fontFamily: black,
              color: '#fff',
              fontSize: 18,
              letterSpacing: 2,
              marginTop: 6,
              textAlign: 'center',
              paddingHorizontal: 24,
            }}
          >
            {flash.subtitle}
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
  // Cargamos las fuentes antes de pintar. Mientras tanto, fondo oscuro.
  const [fontsLoaded] = useFonts({
    ArchivoBlack_400Regular,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

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
