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

  const goTo = (i) => pagerRef.current?.setPage(Math.max(0, Math.min(2, i)));

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
          {/* active: el mapa solo carga/refresca cuando estas en esta pestaña */}
          <MapScreen
            active={page === 2}
            onSwipe={(dir) => goTo(dir === 'next' ? page + 1 : page - 1)}
          />
        </View>
      </PagerView>

      {/* Navegacion: 3 botones GRANDES y faciles de tocar para cambiar de tarjeta.
          Es la forma confiable (el swipe queda como bonus). Ocupa todo el ancho:
          cada boton es un objetivo tactil de 1/3 de pantalla. */}
      <View style={styles.topNav}>
        {LABELS.map((label, i) => {
          const activo = i === page;
          return (
            <Pressable key={label} onPress={() => goTo(i)} style={styles.navItem}>
              <View
                style={{
                  width: activo ? 30 : 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: activo ? colors.bright : colors.line,
                  marginBottom: 5,
                }}
              />
              <Text
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  letterSpacing: 1.5,
                  color: activo ? colors.white : colors.dim,
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
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
  const { unitId, sessionChecked } = useFleet();
  // Mientras leemos la sesion guardada, fondo oscuro (evita parpadear el login).
  if (!sessionChecked) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }
  return unitId ? <Carousel /> : <LoginScreen />;
}

export default function App() {
  // Cargamos las fuentes reales. useFonts devuelve [cargadas, error].
  // IMPORTANTE: ahora SI leemos el error y NO bloqueamos la app si falla.
  const [fontsLoaded, fontError] = useFonts({
    ArchivoBlack_400Regular,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  // Red de seguridad: si las fuentes tardan demasiado (o se quedan colgadas),
  // a los 4 segundos seguimos igual con la fuente del sistema. Asi la app
  // NUNCA queda atrapada para siempre en la pantalla azul por las fuentes.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, []);

  // Si las fuentes fallaron, lo dejamos anotado en el log (visible por ADB)
  // pero seguimos adelante: la app usara la fuente del sistema.
  useEffect(() => {
    if (fontError) {
      console.warn('[App] Las fuentes no cargaron; sigo con la fuente del sistema:', fontError?.message || fontError);
    }
  }, [fontError]);

  // La app esta lista para pintar si: las fuentes cargaron, O fallaron, O paso
  // el tiempo de espera. Cualquiera de las tres nos saca de la pantalla azul.
  const listo = fontsLoaded || !!fontError || timedOut;

  if (!listo) {
    // Solo brevemente (max ~4s) mientras las fuentes cargan.
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
  topNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: 'rgba(10,26,46,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    zIndex: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  sosFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
});
