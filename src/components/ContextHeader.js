// ContextHeader: barra superior con el tramo actual y la velocidad promedio.
// Adaptacion nativa del <ContextHeader> del prototipo (mismos tamanos).

import React from 'react';
import { View, Text } from 'react-native';
import colors from '../theme/colors';
import { mono, black } from '../theme/fonts';

export default function ContextHeader({ currentStop, nextStop, avgSpeed = 0 }) {
  // El numero de velocidad cambia de color: lento (amarillo), rapido (rojo).
  const speedTone =
    avgSpeed < 18 ? colors.yellow : avgSpeed > 38 ? colors.red : colors.bright;

  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'stretch', paddingHorizontal: 4 }}>
      {/* --- Panel izquierdo: tramo --- */}
      <View
        style={{
          flex: 1,
          backgroundColor: colors.panel,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 12,
          paddingVertical: 8,
          paddingHorizontal: 12,
          gap: 1,
          minWidth: 0,
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
            Tramo
          </Text>
        </View>
        <Text
          numberOfLines={1}
          style={{ fontFamily: black, fontSize: 14, color: colors.fg, letterSpacing: -0.2 }}
        >
          {nextStop ? (
            <>
              {currentStop} <Text style={{ color: colors.dim, fontWeight: '400' }}>→</Text> {nextStop}
            </>
          ) : (
            // Fin de ruta: ya no hay siguiente parada.
            <>
              {currentStop} <Text style={{ color: colors.dim, fontWeight: '400' }}>· fin</Text>
            </>
          )}
        </Text>
      </View>

      {/* --- Panel derecho: velocidad promedio --- */}
      <View
        style={{
          backgroundColor: colors.panel,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 12,
          paddingVertical: 8,
          paddingHorizontal: 12,
          alignItems: 'flex-end',
          minWidth: 76,
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
