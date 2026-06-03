// ============================================================================
//  GhostTimers: tiempo estimado desde MI posicion a cada conductor fantasma.
// ============================================================================
//  El TIEMPO es lo principal (grande). La distancia en metros va en chico y
//  marcada como aproximada (la distancia en linea recta puede ser imprecisa
//  respecto al recorrido real por calles).
// ============================================================================

import React from 'react';
import { View, Text } from 'react-native';
import { FANTASMAS, VELOCIDAD_PRUEBA_KMH } from '../config/fantasmas';
import { distanciaMetros, etaSegundos, formatoMMSS } from '../utils/eta';
import colors from '../theme/colors';
import { mono, black } from '../theme/fonts';

export default function GhostTimers({ userPos }) {
  return (
    <View
      style={{
        backgroundColor: colors.panel,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <Text
        style={{
          fontFamily: mono,
          fontSize: 9,
          letterSpacing: 1.5,
          color: colors.dim,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        Tiempo a cada unidad · prueba ({VELOCIDAD_PRUEBA_KMH} km/h caminando)
      </Text>

      {FANTASMAS.map((g) => {
        let dist = null;
        let eta = null;
        if (userPos && userPos.lat != null && userPos.lng != null) {
          dist = distanciaMetros(userPos.lat, userPos.lng, g.lat, g.lng);
          eta = etaSegundos(dist, VELOCIDAD_PRUEBA_KMH);
        }
        return (
          <View
            key={g.unitId}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 4,
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ fontFamily: black, fontSize: 14, color: colors.white }}>
                {g.unitId}
              </Text>
              <Text style={{ fontFamily: mono, fontSize: 10, color: colors.mute }}>
                {dist != null ? `~${Math.round(dist)} m (aprox)` : 'sin posicion'}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: black,
                fontSize: 30,
                color: colors.bright,
                fontVariant: ['tabular-nums'],
                marginLeft: 12,
              }}
            >
              {formatoMMSS(eta)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
