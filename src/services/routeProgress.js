// ============================================================================
//  routeProgress.js  —  Progreso 0..1 a lo largo de una polilinea de paradas
// ============================================================================
//
//  QUE ES routeProgress:
//  "Que tan avanzado vas en el recorrido", de 0 (primera parada) a 1 (ultima).
//
//  COMO SE CALCULA (importante):
//  Tratamos las paradas como UNA polilinea secuencial (punto 1 -> 2 -> ... -> 9).
//  Para una posicion (lat,lng):
//    1) la proyectamos sobre el segmento MAS CERCANO de la polilinea,
//    2) tomamos la distancia ACUMULADA a lo largo de la ruta hasta esa proyeccion,
//    3) dividimos por la longitud total -> progreso 0..1.
//  Asi el progreso avanza de forma monotona a lo largo del recorrido, aunque la
//  ida y la vuelta pasen por calles distintas (es un circuito ida y vuelta).
//
//  OJO: este es un CIRCUITO DE PRUEBA. El punto 1 y el 9 son la misma esquina
//  (Circunvalacion). Por posicion sola, esa esquina es ambigua (inicio o fin);
//  la proyeccion la resuelve como inicio (progreso ~0).
// ============================================================================

import { distanciaMetros } from '../utils/eta';

// --- Paradas del circuito de prueba, EN ORDEN (ida y vuelta) ----------------
export const PARADAS = [
  { nombre: 'Circunvalación', lat: -15.491641494357753, lng: -70.12169544995002 }, // 1 inicio
  { nombre: 'Benigno Ballón', lat: -15.492539599885784, lng: -70.12414911872533 }, // 2
  { nombre: 'Raúl Porras', lat: -15.493089305946617, lng: -70.12568547310879 }, // 3
  { nombre: 'Ramón Castilla', lat: -15.49385749269465, lng: -70.12774572487804 }, // 4
  { nombre: 'Apurímac', lat: -15.493430121555079, lng: -70.1290088220023 }, // 5 retorno
  { nombre: 'Gonzáles Prada', lat: -15.492626769604342, lng: -70.12701874234612 }, // 6
  { nombre: 'Túpac Amaru', lat: -15.4918829011274, lng: -70.12503228754773 }, // 7
  { nombre: 'Maestro', lat: -15.491271591977588, lng: -70.12344359202996 }, // 8
  { nombre: 'Circunvalación', lat: -15.491641494357753, lng: -70.12169544995002 }, // 9 fin (= 1)
];

// --- Conversion lat/lng -> metros locales (plano) ---------------------------
// El area es chica (~pocas cuadras), asi que una proyeccion equirectangular
// alcanza: 1 grado de lat ~111320 m; 1 grado de lng ~111320*cos(lat).
const LAT0 = PARADAS[0].lat;
const LNG0 = PARADAS[0].lng;
const M_POR_LAT = 111320;
const M_POR_LNG = 111320 * Math.cos((LAT0 * Math.PI) / 180);

function aXY(lat, lng) {
  return { x: (lng - LNG0) * M_POR_LNG, y: (lat - LAT0) * M_POR_LAT };
}

// Precalculamos los puntos en metros y la distancia acumulada en cada vertice.
const PTS = PARADAS.map((p) => aXY(p.lat, p.lng));
const SEG_LEN = [];
const CUM = [0]; // CUM[i] = distancia desde el inicio hasta el vertice i
for (let i = 0; i < PTS.length - 1; i++) {
  const dx = PTS[i + 1].x - PTS[i].x;
  const dy = PTS[i + 1].y - PTS[i].y;
  const len = Math.hypot(dx, dy);
  SEG_LEN.push(len);
  CUM.push(CUM[i] + len);
}
const TOTAL = CUM[CUM.length - 1] || 1; // longitud total de la polilinea

// ============================================================================
//  proyectar(lat, lng) -> { acumulado, perp }
//  acumulado = distancia (m) a lo largo de la ruta hasta la proyeccion.
//  perp      = distancia (m) perpendicular del punto a la ruta. Si es grande,
//              estas lejos de la ruta y la proyeccion no es confiable.
// ============================================================================
function proyectar(lat, lng) {
  if (PTS.length < 2) return { acumulado: 0, perp: Infinity };
  const p = aXY(lat, lng);

  let mejorDist = Infinity;
  let mejorAcumulado = 0;

  for (let i = 0; i < PTS.length - 1; i++) {
    const a = PTS[i];
    const b = PTS[i + 1];
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const seg2 = abx * abx + aby * aby || 1e-9;

    // t = posicion de la proyeccion sobre el segmento [a,b], recortada a [0,1]
    let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / seg2;
    t = Math.max(0, Math.min(1, t));

    const projx = a.x + t * abx;
    const projy = a.y + t * aby;
    const dist = Math.hypot(p.x - projx, p.y - projy); // distancia perpendicular

    if (dist < mejorDist) {
      mejorDist = dist;
      mejorAcumulado = CUM[i] + t * SEG_LEN[i]; // distancia acumulada hasta la proyeccion
    }
  }

  return { acumulado: mejorAcumulado, perp: mejorDist };
}

// ============================================================================
//  calcularRouteProgress(lat, lng) -> 0..1
// ============================================================================
export function calcularRouteProgress(lat, lng) {
  const { acumulado } = proyectar(lat, lng);
  return Math.max(0, Math.min(1, acumulado / TOTAL));
}

// ============================================================================
//  MEJORA C: distancia A LO LARGO DE LA RUTA (con respaldo a linea recta)
// ============================================================================
// Si estas a mas de esta distancia perpendicular de la ruta, la proyeccion no
// es confiable y conviene usar la linea recta.
const MAX_PERP_M = 200;

// Distancia (m) entre dos puntos medida A LO LARGO de la polilinea de la ruta.
// Devuelve null si algun punto esta demasiado lejos de la ruta (no confiable).
export function distanciaEnRutaMetros(aLat, aLng, bLat, bLng) {
  const pa = proyectar(aLat, aLng);
  const pb = proyectar(bLat, bLng);
  if (pa.perp > MAX_PERP_M || pb.perp > MAX_PERP_M) return null;
  return Math.abs(pa.acumulado - pb.acumulado);
}

// Distancia preferida: a lo largo de la ruta si es confiable; si no, Haversine.
// Asi NUNCA perdemos lo que ya funcionaba (la linea recta) si la ruta falla.
export function distanciaConFallback(aLat, aLng, bLat, bLng) {
  const r = distanciaEnRutaMetros(aLat, aLng, bLat, bLng);
  if (r == null || !isFinite(r)) return distanciaMetros(aLat, aLng, bLat, bLng);
  return r;
}

// ============================================================================
//  paradaMasCercana(lat, lng) -> nombre de la parada mas cercana
// ============================================================================
export function paradaMasCercana(lat, lng) {
  if (PARADAS.length === 0) return null;
  const p = aXY(lat, lng);
  let mejorDist = Infinity;
  let mejorNombre = PARADAS[0].nombre;
  for (let i = 0; i < PTS.length; i++) {
    const d = Math.hypot(p.x - PTS[i].x, p.y - PTS[i].y);
    if (d < mejorDist) {
      mejorDist = d;
      mejorNombre = PARADAS[i].nombre;
    }
  }
  return mejorNombre;
}

export default calcularRouteProgress;
