// ============================================================================
//  RouteScreen: la pantalla central (la que mas mira el chofer).
// ============================================================================
//  ContextHeader (parada + velocidad), brechas adelante/atras (BigTime),
//  Semaphore, los timers de prueba a cada fantasma (ETA grande) y el SOS.
//  El contenido va en ScrollView para que nunca se apriete; el SOS queda fijo
//  abajo. Todo sale de useFleet (sin datos hardcodeados).
// ============================================================================

import React from 'react';
import { View, ScrollView } from 'react-native';
import { useFleet } from '../context/FleetContext';
import { computeStatus, parseGap } from '../utils/status';
import { TARGET_GAP_SEC } from '../config/coop';
import { MODO_PRUEBA_FANTASMAS } from '../config/fantasmas';
import colors from '../theme/colors';
import ContextHeader from '../components/ContextHeader';
import BigTime from '../components/BigTime';
import Semaphore from '../components/Semaphore';
import SosSlider from '../components/SosSlider';
import GhostTimers from '../components/GhostTimers';

export default function RouteScreen({ onFireSos }) {
  const { miGap, sendSos, parada, avgSpeed, userPos } = useFleet();

  const front = miGap?.toAhead || '--:--';
  const back = miGap?.toBehind || '--:--';

  const status = computeStatus(parseGap(miGap?.toAhead), parseGap(miGap?.toBehind), TARGET_GAP_SEC);
  const statusColor = { red: colors.red, yellow: colors.yellow, green: colors.green }[status];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: 56 }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Arriba: parada mas cercana + velocidad */}
        <ContextHeader parada={parada} avgSpeed={avgSpeed} />

        {/* Brechas + semaforo */}
        <View style={{ alignItems: 'center', gap: 8, marginTop: 4 }}>
          <BigTime label="+1 adelante" value={front} color={statusColor} />
          <Semaphore status={status} />
          <BigTime label="-1 atras" value={back} color={statusColor} />
        </View>

        {/* Timers de prueba: tiempo estimado a cada conductor fantasma */}
        {MODO_PRUEBA_FANTASMAS && <GhostTimers userPos={userPos} />}
      </ScrollView>

      {/* SOS deslizable, fijo abajo. Al dispararse: envia al servidor Y flash. */}
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
