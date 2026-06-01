// ============================================================================
//  status.js  —  Logica del semaforo (verde / amarillo / rojo)
// ============================================================================
//  El servidor manda las brechas como texto "MM:SS". Aca las convertimos a
//  segundos y decidimos el color segun que tan lejos estan del objetivo.
//
//  IMPORTANTE: esta es una heuristica inicial, facil de ajustar. Cuando
//  pruebes en la calle con la cooperativa, seguro vas a calibrar estos
//  numeros (que tan cerca/lejos enciende cada color).
// ============================================================================

// "02:15" -> 135 segundos. Devuelve null si no hay dato.
export function parseGap(str) {
  if (!str || typeof str !== 'string') return null;
  const [m, s] = str.split(':').map(Number);
  if (Number.isNaN(m) || Number.isNaN(s)) return null;
  return m * 60 + s;
}

// Evalua el PEOR de los dos lados (adelante / atras) respecto al objetivo.
//   muy cerca o muy lejos  -> rojo
//   algo desviado          -> amarillo
//   cerca del objetivo     -> verde
export function computeStatus(frontSec, backSec, targetSec) {
  const vals = [frontSec, backSec].filter((v) => v != null);
  if (vals.length === 0 || !targetSec) return 'green';

  let peor = 'green';
  for (const v of vals) {
    const ratio = v / targetSec;
    let s;
    if (ratio < 0.5 || ratio > 1.6) s = 'red';
    else if (ratio < 0.75 || ratio > 1.3) s = 'yellow';
    else s = 'green';

    if (s === 'red') peor = 'red';
    else if (s === 'yellow' && peor !== 'red') peor = 'yellow';
  }
  return peor;
}

export default { parseGap, computeStatus };
