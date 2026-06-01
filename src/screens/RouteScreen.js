// ============================================================================
//  RouteScreen: la pantalla central (la que mas mira el chofer).
// ============================================================================
//  Une los 4 componentes: ContextHeader (arriba), dos BigTime (brechas
//  adelante/atras), el Semaphore (en medio) y el SosSlider (abajo).
//  Los datos salen del FleetContext (useFleet): no hay nada "hardcodeado".
// ============================================================================

import React from 'react';
import { View } from 'react-native';
import { useFleet } from '../context/FleetContext';
import { computeStatus, parseGap } from '../utils/status';
import { TARGET_GAP_SEC } from '../config/coop';
import colors from '../theme/colors';
import ContextHeader from '../components/ContextHeader';
import BigTime from '../components/BigTime';
import Semaphore from '../components/Semaphore';
import SosSlider from '../components/SosSlider';

export default function RouteScreen({ onFireSos }) {
  const { miGap, myPosition, sendSos } = useFleet();

  const front = miGap?.toAhead || '--:--';
  const back = miGap?.toBehind || '--:--';
  const avgSpeed = myPosition?.speed || 0;

  const status = computeStatus(parseGap(miGap?.toAhead), parseGap(miGap?.toBehind), TARGET_GAP_SEC);
  const statusColor = { red: colors.red, yellow: colors.yellow, green: colors.green }[status];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingHorizontal: 14, paddingTop: 48, paddingBottom: 20 }}>
      {/* Arriba: tramo + velocidad */}
      <ContextHeader currentStop="Terminal Sur" nextStop="Huancane" avgSpeed={avgSpeed} />

      {/* Centro: brechas + semaforo, repartidos en el espacio disponible */}
      <View style={{ flex: 1, justifyContent: 'space-around', alignItems: 'center' }}>
        <BigTime label="+1 adelante" value={front} color={statusColor} />
        <Semaphore status={status} />
        <BigTime label="-1 atras" value={back} color={statusColor} />
      </View>

      {/* Abajo: SOS deslizable. Al dispararse: envia al servidor Y muestra el flash. */}
      <SosSlider
        status={status}
        onFire={() => {
          sendSos(); // envia { type:'sos', lat, lng, timestamp } por WebSocket
          if (onFireSos) onFireSos(); // flash rojo inmediato a pantalla completa
        }}
      />
    </View>
  );
}
