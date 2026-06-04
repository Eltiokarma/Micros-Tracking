// ============================================================================
//  eta.js  —  Distancia real y tiempo estimado (ETA)
// ============================================================================

// Distancia en METROS entre dos coordenadas (formula de Haversine).
export function distanciaMetros(aLat, aLng, bLat, bLng) {
  const R = 6371000; // radio de la Tierra en metros
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Tiempo estimado en SEGUNDOS para recorrer distM metros a velKmh km/h.
export function etaSegundos(distM, velKmh) {
  if (!velKmh || velKmh <= 0 || distM == null) return null;
  const mps = (velKmh * 1000) / 3600; // km/h -> m/s
  return distM / mps;
}

// Formatea segundos a "M:SS".
export function formatoMMSS(seg) {
  if (seg == null || !isFinite(seg)) return '--:--';
  const s = Math.max(0, Math.round(seg));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ':' + String(r).padStart(2, '0');
}

// Estado de proximidad (anti-correteo) segun el ETA a la unidad mas cercana:
//   rojo    = muy pegado (vas a corretearte)   -> ETA <= 60 s
//   amarillo= acercandote                       -> ETA <= 150 s
//   verde   = hay hueco / vas bien              -> ETA  > 150 s
// Umbrales pensados para la PRUEBA caminando (5 km/h); ajustables luego para
// la velocidad real del vehiculo.
export function estadoProximidadPorEta(seg) {
  if (seg == null || !isFinite(seg)) return 'green';
  if (seg <= 60) return 'red';
  if (seg <= 150) return 'yellow';
  return 'green';
}

export default { distanciaMetros, etaSegundos, formatoMMSS, estadoProximidadPorEta };
