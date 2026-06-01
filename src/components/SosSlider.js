// ============================================================================
//  SosSlider: el boton de emergencia deslizable.
// ============================================================================
//  En la web se manejaba con eventos mouse/touch + listeners en window.
//  En React Native el gesto se maneja con "PanResponder": un objeto que
//  intercepta el toque y nos da el desplazamiento (dx) del dedo.
//
//  OJO con un detalle clasico de RN: PanResponder se crea UNA vez (useRef),
//  asi que dentro de sus funciones NO podemos leer el estado normal (seria
//  un valor viejo/"stale"). Por eso guardamos progreso y "disparado" tambien
//  en refs, y usamos setState solo para redibujar.
// ============================================================================

import React, { useRef, useState } from 'react';
import { View, Text, PanResponder } from 'react-native';
import colors from '../theme/colors';
import { black } from '../theme/fonts';

const TRACK_H = 88;
const THUMB = 68;

export default function SosSlider({ status = 'green', onFire }) {
  const [progress, setProgress] = useState(0); // 0..1, solo para dibujar
  const [fired, setFired] = useState(false);

  const progressRef = useRef(0);
  const firedRef = useRef(false);
  const startProg = useRef(0);
  const widthRef = useRef(0); // ancho real del riel (se mide con onLayout)

  const setProg = (p) => {
    progressRef.current = p;
    setProgress(p);
  };

  const dispararSos = () => {
    firedRef.current = true;
    setFired(true);
    if (onFire) onFire();
    // Se resetea solo a los 2.2s (igual que el prototipo).
    setTimeout(() => {
      firedRef.current = false;
      setFired(false);
      setProg(0);
    }, 2200);
  };

  // El PanResponder se crea una sola vez.
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !firedRef.current,
      onMoveShouldSetPanResponder: () => !firedRef.current,
      // No cedemos el gesto al carrusel: si el dedo esta en el SOS, es para el SOS.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        startProg.current = progressRef.current;
      },
      onPanResponderMove: (e, gesture) => {
        if (firedRef.current) return;
        const maxTravel = widthRef.current - THUMB - 10; // px que puede recorrer el thumb
        if (maxTravel <= 0) return;
        let p = startProg.current + gesture.dx / maxTravel;
        p = Math.max(0, Math.min(1, p));
        setProg(p);
        if (p >= 0.98) dispararSos();
      },
      onPanResponderRelease: () => {
        if (!firedRef.current) setProg(0); // si no llego al final, vuelve al inicio
      },
    })
  ).current;

  const width = widthRef.current || 1;
  const maxTravel = Math.max(0, width - THUMB - 10);
  const thumbLeft = progress * maxTravel + 5;
  const fillWidth = Math.min(width, THUMB / 2 + 5 + progress * width);

  const label = fired
    ? 'ENVIANDO...'
    : progress > 0.5
    ? 'SUELTA PARA SOS'
    : 'DESLIZA →';

  return (
    <View
      onLayout={(e) => {
        widthRef.current = e.nativeEvent.layout.width;
      }}
      style={{
        width: '100%',
        height: TRACK_H,
        borderRadius: TRACK_H / 2,
        backgroundColor: '#1a1a1a',
        borderWidth: 3,
        borderColor: colors.red,
        overflow: 'hidden',
        justifyContent: 'center',
      }}
    >
      {/* Relleno rojo que crece con el progreso */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: fillWidth,
          backgroundColor: colors.red,
          opacity: 0.9,
        }}
      />

      {/* Texto central */}
      <Text
        style={{
          fontFamily: black,
          textAlign: 'center',
          paddingLeft: THUMB,
          fontSize: 22,
          letterSpacing: 2.5,
          color: progress > 0.3 ? '#fff' : colors.red,
          opacity: progress > 0.85 ? 0 : 1,
        }}
      >
        {label}
      </Text>

      {/* El thumb (circulo blanco "SOS") que se arrastra */}
      <View
        {...pan.panHandlers}
        style={{
          position: 'absolute',
          left: thumbLeft,
          top: 5,
          width: THUMB,
          height: THUMB,
          borderRadius: THUMB / 2,
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        }}
      >
        <Text style={{ fontFamily: black, color: colors.red, fontSize: 20 }}>
          {fired ? '✓' : 'SOS'}
        </Text>
      </View>
    </View>
  );
}
