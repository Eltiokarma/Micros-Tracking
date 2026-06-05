// ============================================================================
//  RouteScreen: pantalla central. DOS relojes: unidad de ADELANTE y de ATRAS.
// ============================================================================
//  - Detecta MI sentido (ida/vuelta) por mi posicion.
//  - Entre las unidades de MI MISMO sentido, encuentra la de adelante (mas
//    progreso que yo) y la de atras (menos progreso), por distancia A LO LARGO
//    DE LA RUTA (con fallback Haversine).
//  - Cada reloj muestra el ETA (velocidad real + piso, suavizado EMA) con su
//    color de semaforo. El semaforo central refleja el caso mas urgente.
//  Reusa utils/eta.js y routeProgress.js (sentido-aware).
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useFleet } from '../context/FleetContext';
import {
  etaSegundos,
  formatoMMSS,
  estadoProximidadPorEta,
  velocidadParaEta,
  emaSiguiente,
} from '../utils/eta';
import {
  detectarSentido,
  progresoEnRuta,
  distanciaConFallback,
} from '../services/routeProgress';
import { VELOCIDAD_PRUEBA_KMH } from '../config/fantasmas';
import { ESTADOS } from '../services/serviceState';
import colors from '../theme/colors';
import ContextHeader from '../components/ContextHeader';
import BigTime from '../components/BigTime';
import Semaphore from '../components/Semaphore';
import SosSlider from '../components/SosSlider';

const STATUS_COLOR = { red: colors.red, yellow: colors.yellow, green: colors.green };

// Suaviza (EMA) el ETA mostrado; se reinicia al cambiar de unidad de referencia.
function useEtaSuavizado(targetSec, key, alpha = 0.4) {
  const [shown, setShown] = useState(null);
  const prevKey = useRef(null);
  useEffect(() => {
    const cambio = prevKey.current !== key;
    prevKey.current = key;
    setShown((prev) => emaSiguiente(cambio ? null : prev, targetSec, alpha));
  }, [targetSec, key, alpha]);
  return shown;
}

function peorEstado(a, b) {
  if (a === 'red' || b === 'red') return 'red';
  if (a === 'yellow' || b === 'yellow') return 'yellow';
  return 'green';
}

export default function RouteScreen({ onFireSos }) {
  const { otros, userPos, sendSos, parada, avgSpeed } = useFleet();

  // Velocidad real (con piso) o fallback a la fija si aun no hay GPS.
  const velKmh = velocidadParaEta(userPos?.speed, VELOCIDAD_PRUEBA_KMH);

  // Mi sentido y mi progreso a lo largo de esa ruta.
  const sentido = userPos && userPos.lat != null ? detectarSentido(userPos.lat, userPos.lng) : null;
  const miProg = sentido ? progresoEnRuta(userPos.lat, userPos.lng, sentido) : null;

  // Unidades de MI MISMO sentido, con su progreso en mi ruta.
  let adelante = null;
  let atras = null;
  if (sentido && miProg != null) {
    const mismos = otros
      // Las fuera de servicio (fantasma) NO cuentan como adelante/atras.
      .filter((u) => u.lat != null && u.lng != null && u.estado !== ESTADOS.FUERA_DE_SERVICIO)
      .map((u) => ({
        ...u,
        us: u.sentido || detectarSentido(u.lat, u.lng),
        prog: progresoEnRuta(u.lat, u.lng, sentido),
      }))
      .filter((u) => u.us === sentido);

    const delante = mismos.filter((u) => u.prog > miProg).sort((a, b) => a.prog - b.prog);
    const detras = mismos.filter((u) => u.prog < miProg).sort((a, b) => b.prog - a.prog);
    adelante = delante[0] || null;
    atras = detras[0] || null;
  }

  const etaAdelCrudo =
    adelante && userPos
      ? etaSegundos(distanciaConFallback(userPos.lat, userPos.lng, adelante.lat, adelante.lng, sentido), velKmh)
      : null;
  const etaAtrasCrudo =
    atras && userPos
      ? etaSegundos(distanciaConFallback(userPos.lat, userPos.lng, atras.lat, atras.lng, sentido), velKmh)
      : null;

  // Hooks SIEMPRE en el mismo orden (con clave por unidad para reiniciar EMA).
  const etaAdel = useEtaSuavizado(etaAdelCrudo, adelante ? adelante.unitId : 'adel-none');
  const etaAtras = useEtaSuavizado(etaAtrasCrudo, atras ? atras.unitId : 'atras-none');

  const statusAdel = estadoProximidadPorEta(etaAdel);
  const statusAtras = estadoProximidadPorEta(etaAtras);
  const statusPeor = peorEstado(statusAdel, statusAtras);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: 56 }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Parada mas cercana + velocidad */}
        <ContextHeader parada={parada} avgSpeed={avgSpeed} />

        {/* Reloj de la unidad de ADELANTE */}
        <View style={[styles.card, { borderColor: STATUS_COLOR[statusAdel] }]}>
          <BigTime
            label={adelante ? `adelante · ${adelante.unitId}` : 'adelante · libre'}
            value={formatoMMSS(etaAdel)}
            color={STATUS_COLOR[statusAdel]}
          />
        </View>

        {/* Semaforo central (el caso mas urgente de los dos) */}
        <View style={{ alignItems: 'center' }}>
          <Semaphore status={statusPeor} />
        </View>

        {/* Reloj de la unidad de ATRAS */}
        <View style={[styles.card, { borderColor: STATUS_COLOR[statusAtras] }]}>
          <BigTime
            label={atras ? `atras · ${atras.unitId}` : 'atras · libre'}
            value={formatoMMSS(etaAtras)}
            color={STATUS_COLOR[statusAtras]}
          />
        </View>
      </ScrollView>

      {/* SOS deslizable, fijo abajo. */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}>
        <SosSlider
          status={statusPeor}
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
  card: {
    backgroundColor: colors.panel,
    borderWidth: 2,
    borderRadius: 18,
    paddingVertical: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },
});
