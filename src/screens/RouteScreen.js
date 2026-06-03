// ============================================================================
//  RouteScreen: pantalla central. La ESTRELLA es el anti-correteo grande.
// ============================================================================
//  - Toma la unidad MAS CERCANA (de las unidades en ruta, incluidos los
//    fantasmas de prueba) y muestra EN GRANDE el ETA hacia ella, con el color
//    del semaforo (verde = hay hueco, amarillo = acercandote, rojo = muy pegado).
//  - El semaforo queda de apoyo, integrado debajo.
//  - Abajo, chico y secundario, el resto de las unidades con su ETA.
//  - SOS deslizable fijo al pie. Todo sale de useFleet.
//  Reusa la logica de utils/eta.js (distancia, ETA y estado de proximidad).
// ============================================================================

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFleet } from '../context/FleetContext';
import {
  distanciaMetros,
  etaSegundos,
  formatoMMSS,
  estadoProximidadPorEta,
} from '../utils/eta';
import { VELOCIDAD_PRUEBA_KMH } from '../config/fantasmas';
import colors from '../theme/colors';
import { mono, black } from '../theme/fonts';
import ContextHeader from '../components/ContextHeader';
import BigTime from '../components/BigTime';
import Semaphore from '../components/Semaphore';
import SosSlider from '../components/SosSlider';

const STATUS_COLOR = { red: colors.red, yellow: colors.yellow, green: colors.green };
const STATUS_TEXTO = { red: 'Muy pegado', yellow: 'Acercándote', green: 'Hay hueco' };

export default function RouteScreen({ onFireSos }) {
  const { otros, userPos, sendSos, parada, avgSpeed } = useFleet();

  // Unidades con posicion, ordenadas por distancia a mi (la mas cercana primero).
  const conPos = otros.filter((u) => u.lat != null && u.lng != null);
  const ordenadas = userPos
    ? conPos
        .map((u) => ({ ...u, dist: distanciaMetros(userPos.lat, userPos.lng, u.lat, u.lng) }))
        .sort((a, b) => a.dist - b.dist)
    : conPos.map((u) => ({ ...u, dist: null }));

  const nearest = ordenadas[0] || null;
  const etaSec = nearest && nearest.dist != null ? etaSegundos(nearest.dist, VELOCIDAD_PRUEBA_KMH) : null;
  const etaStr = formatoMMSS(etaSec);
  const status = estadoProximidadPorEta(etaSec);
  const statusColor = STATUS_COLOR[status];
  const resto = ordenadas.slice(1);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: 56 }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Parada mas cercana + velocidad */}
        <ContextHeader parada={parada} avgSpeed={avgSpeed} />

        {/* ===== HERO: anti-correteo a la unidad mas cercana ===== */}
        <View style={[styles.hero, { borderColor: statusColor }]}>
          <Text style={styles.heroLabel}>Anti-correteo</Text>
          <BigTime
            label={nearest ? `hacia ${nearest.unitId}` : 'sin unidades'}
            value={etaStr}
            color={statusColor}
          />
          <View style={{ marginTop: 10 }}>
            <Semaphore status={status} />
          </View>
          <Text style={[styles.estado, { color: statusColor }]}>{STATUS_TEXTO[status]}</Text>
        </View>

        {/* ===== Secundario: el resto de las unidades ===== */}
        {resto.length > 0 && (
          <View style={styles.sec}>
            <Text style={styles.secLabel}>Otras unidades</Text>
            {resto.map((u) => {
              const e = u.dist != null ? formatoMMSS(etaSegundos(u.dist, VELOCIDAD_PRUEBA_KMH)) : '--:--';
              return (
                <View key={u.unitId} style={styles.secRow}>
                  <Text numberOfLines={1} style={styles.secName}>
                    {u.unitId}
                  </Text>
                  <Text style={styles.secEta}>{e}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* SOS deslizable, fijo abajo. */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}>
        <SosSlider
          status={status}
          onFire={() => {
            sendSos();
            if (onFireSos) onFireSos();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.panel,
    borderWidth: 2,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  heroLabel: {
    fontFamily: mono,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.dim,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  estado: {
    fontFamily: black,
    fontSize: 16,
    letterSpacing: 1,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  sec: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
  },
  secLabel: {
    fontFamily: mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.dim,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  secRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  secName: { fontFamily: black, fontSize: 14, color: colors.white, flex: 1, minWidth: 0 },
  secEta: { fontFamily: black, fontSize: 18, color: colors.bright, fontVariant: ['tabular-nums'], marginLeft: 12 },
});
