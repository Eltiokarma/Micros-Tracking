// ContextHeader: barra superior con el tramo actual y la velocidad promedio.
// Adaptacion nativa del <ContextHeader> del prototipo (mismos tamanos).

import React from 'react';
import { View, Text } from 'react-native';
import colors from '../theme/colors';
import { mono, black } from '../theme/fonts';

// Sombra sutil para dar profundidad a las tarjetas (se ve mas profesional).
const SOMBRA = {
  elevation: 3,
  shadowColor: '#000',
  shadowOpacity: 0.25,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
};

export default function ContextHeader({ parada, avgSpeed = 0 }) {
  // El numero de velocidad cambia de color: lento (amarillo), rapido (rojo).
  const speedTone =
    avgSpeed < 18 ? colors.yellow : avgSpeed > 38 ? colors.red : colors.bright;

  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'stretch', paddingHorizontal: 4 }}>
      {/* --- Panel izquierdo: parada mas cercana --- */}
      <View
        style={{
          flex: 1,
          backgroundColor: colors.panel,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 12,
          paddingVertical: 10,
          paddingHorizontal: 12,
          gap: 2,
          minWidth: 0,
          ...SOMBRA,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: 2.5,
              backgroundColor: colors.bright,
            }}
          />
          <Text
            style={{
              fontFamily: mono,
              fontSize: 9,
              letterSpacing: 1.5,
              color: colors.dim,
              textTransform: 'uppercase',
            }}
          >
            Parada
          </Text>
        </View>
        <Text
          numberOfLines={1}
          style={{ fontFamily: black, fontSize: 14, color: colors.fg, letterSpacing: -0.2 }}
        >
          {parada || '—'}
        </Text>
      </View>

      {/* --- Panel derecho: velocidad promedio --- */}
      <View
        style={{
          backgroundColor: colors.panel,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 12,
          paddingVertical: 10,
          paddingHorizontal: 12,
          alignItems: 'flex-end',
          minWidth: 76,
          ...SOMBRA,
        }}
      >
        <Text
          style={{
            fontFamily: mono,
            fontSize: 9,
            letterSpacing: 1.5,
            color: colors.dim,
            textTransform: 'uppercase',
          }}
        >
          Vel. prom
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
          <Text
            style={{
              fontFamily: black,
              fontSize: 22,
              letterSpacing: -1,
              color: speedTone,
              fontVariant: ['tabular-nums'],
            }}
          >
            {avgSpeed}
          </Text>
          <Text style={{ fontSize: 9, letterSpacing: 1, color: colors.dim, fontWeight: '700' }}>
            KM/H
          </Text>
        </View>
      </View>
    </View>
  );
}
