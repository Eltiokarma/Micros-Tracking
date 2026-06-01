// ============================================================================
//  Semaphore: el semaforo verde / amarillo / rojo.
// ============================================================================
//  El punto encendido "respira" (un halo que crece y se desvanece en bucle).
//  En la web era una animacion CSS @keyframes; aca es un Animated.loop.
// ============================================================================

import React, { useRef, useEffect } from 'react';
import { View, Animated } from 'react-native';
import colors from '../theme/colors';

const SIZE = 34;

function Dot({ color, lit, pulseDur }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!lit) return;
    // Bucle infinito: 0 -> 1 -> 0 (el halo crece y se apaga).
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: pulseDur, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: pulseDur, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop(); // detener al desmontar o al apagarse
  }, [lit, pulseDur]);

  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] });

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Halo que respira (solo cuando esta encendido) */}
      {lit && (
        <Animated.View
          style={{
            position: 'absolute',
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            backgroundColor: color,
            transform: [{ scale: haloScale }],
            opacity: haloOpacity,
          }}
        />
      )}
      {/* El punto en si */}
      <View
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          backgroundColor: lit ? color : 'transparent',
          borderWidth: 3,
          borderColor: lit ? color : colors.dim,
          opacity: lit ? 1 : 0.3,
          // Glow en iOS (sombra de color). En Android el halo de arriba hace el efecto.
          shadowColor: color,
          shadowOpacity: lit ? 1 : 0,
          shadowRadius: lit ? 12 : 0,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
    </View>
  );
}

export default function Semaphore({ status = 'green' }) {
  const map = { red: colors.red, yellow: colors.yellow, green: colors.green };
  // Mas urgente = parpadeo mas rapido.
  const pulseDur = status === 'red' ? 400 : status === 'yellow' ? 700 : 1200;

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 14,
        alignItems: 'center',
        alignSelf: 'center',
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderRadius: 40,
        backgroundColor: colors.panel,
        borderWidth: 1,
        borderColor: colors.line,
      }}
    >
      {['red', 'yellow', 'green'].map((k) => (
        <Dot key={k} color={map[k]} lit={k === status} pulseDur={pulseDur} />
      ))}
    </View>
  );
}
