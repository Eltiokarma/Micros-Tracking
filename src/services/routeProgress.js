// ============================================================================
//  routeProgress.js  —  Rutas IDA y VUELTA + progreso / parada / distancia
// ============================================================================
//  La ruta de prueba se separa en DOS sentidos (ida y vuelta), porque van por
//  calles distintas. Cada unidad/usuario tiene un "sentido" (ida|vuelta) que se
//  puede detectar por su posicion (a que ruta esta mas cerca).
//
//  - calcularRouteProgress(lat,lng): se mantiene IGUAL (sobre la ruta combinada
//    de 9 puntos) -> NO cambia lo que la tarea de GPS envia al servidor.
//  - Las funciones nuevas trabajan sobre la ruta del SENTIDO correspondiente.
//  - Siempre con Haversine como respaldo si la proyeccion no es confiable.
// ============================================================================

import { distanciaMetros } from '../utils/eta';

// --- Paraderos por sentido (mismas coordenadas de la ruta original) ----------
export const PARADAS_IDA = [
  { nombre: 'Circunvalación', lat: -15.491641494357753, lng: -70.12169544995002 },
  { nombre: 'Benigno Ballón', lat: -15.492539599885784, lng: -70.12414911872533 },
  { nombre: 'Raúl Porras', lat: -15.493089305946617, lng: -70.12568547310879 },
  { nombre: 'Ramón Castilla', lat: -15.49385749269465, lng: -70.12774572487804 },
  { nombre: 'Apurímac', lat: -15.493430121555079, lng: -70.1290088220023 },
];
export const PARADAS_VUELTA = [
  { nombre: 'Apurímac', lat: -15.493430121555079, lng: -70.1290088220023 },
  { nombre: 'Gonzáles Prada', lat: -15.492626769604342, lng: -70.12701874234612 },
  { nombre: 'Túpac Amaru', lat: -15.4918829011274, lng: -70.12503228754773 },
  { nombre: 'Maestro', lat: -15.491271591977588, lng: -70.12344359202996 },
  { nombre: 'Circunvalación', lat: -15.491641494357753, lng: -70.12169544995002 },
];
// Ruta COMBINADA (9 puntos) para compatibilidad con calcularRouteProgress.
export const PARADAS = [...PARADAS_IDA, ...PARADAS_VUELTA.slice(1)];

// --- Conversion lat/lng <-> metros locales (referencia comun) ----------------
const LAT0 = PARADAS_IDA[0].lat;
const LNG0 = PARADAS_IDA[0].lng;
const M_POR_LAT = 111320;
const M_POR_LNG = 111320 * Math.cos((LAT0 * Math.PI) / 180);
function aXY(lat, lng) {
  return { x: (lng - LNG0) * M_POR_LNG, y: (lat - LAT0) * M_POR_LAT };
}
function aLatLng(x, y) {
  return { lat: LAT0 + y / M_POR_LAT, lng: LNG0 + x / M_POR_LNG };
}

// Precalcula puntos en metros, longitudes de segmento y distancia acumulada.
function construirRuta(paradas) {
  const pts = paradas.map((p) => aXY(p.lat, p.lng));
  const segLen = [];
  const cum = [0];
  for (let i = 0; i < pts.length - 1; i++) {
    const len = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
    segLen.push(len);
    cum.push(cum[i] + len);
  }
  return { paradas, pts, segLen, cum, total: cum[cum.length - 1] || 1 };
}

const R_IDA = construirRuta(PARADAS_IDA);
const R_VUELTA = construirRuta(PARADAS_VUELTA);
const R_COMB = construirRuta(PARADAS);
const RUTAS = { ida: R_IDA, vuelta: R_VUELTA };
function rutaDe(sentido) {
  return RUTAS[sentido] || R_COMB;
}

// Proyecta un punto sobre una ruta. Devuelve { acumulado, perp }.
function proyectar(ruta, lat, lng) {
  const pts = ruta.pts;
  if (pts.length < 2) return { acumulado: 0, perp: Infinity };
  const p = aXY(lat, lng);
  let mejorDist = Infinity;
  let mejorAcum = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const seg2 = abx * abx + aby * aby || 1e-9;
    let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / seg2;
    t = Math.max(0, Math.min(1, t));
    const projx = a.x + t * abx;
    const projy = a.y + t * aby;
    const d = Math.hypot(p.x - projx, p.y - projy);
    if (d < mejorDist) {
      mejorDist = d;
      mejorAcum = ruta.cum[i] + t * ruta.segLen[i];
    }
  }
  return { acumulado: mejorAcum, perp: mejorDist };
}

// ============================================================================
//  API publica
// ============================================================================

// (SIN CAMBIOS) Progreso 0..1 sobre la ruta combinada. Lo usa la tarea de GPS.
export function calcularRouteProgress(lat, lng) {
  const { acumulado } = proyectar(R_COMB, lat, lng);
  return Math.max(0, Math.min(1, acumulado / R_COMB.total));
}

// Detecta el sentido por cercania: a que ruta estas mas pegado (ida o vuelta).
export function detectarSentido(lat, lng) {
  const pi = proyectar(R_IDA, lat, lng);
  const pv = proyectar(R_VUELTA, lat, lng);
  return pv.perp < pi.perp ? 'vuelta' : 'ida';
}

// Progreso 0..1 a lo largo de la ruta del sentido indicado.
export function progresoEnRuta(lat, lng, sentido) {
  const ruta = rutaDe(sentido);
  const { acumulado } = proyectar(ruta, lat, lng);
  return Math.max(0, Math.min(1, acumulado / ruta.total));
}

// Parada mas cercana. Si se da sentido, busca en esa ruta; si no, en la combinada.
export function paradaMasCercana(lat, lng, sentido) {
  const ruta = sentido ? rutaDe(sentido) : R_COMB;
  if (ruta.paradas.length === 0) return null;
  const p = aXY(lat, lng);
  let mejorDist = Infinity;
  let mejorNombre = ruta.paradas[0].nombre;
  for (let i = 0; i < ruta.pts.length; i++) {
    const d = Math.hypot(p.x - ruta.pts[i].x, p.y - ruta.pts[i].y);
    if (d < mejorDist) {
      mejorDist = d;
      mejorNombre = ruta.paradas[i].nombre;
    }
  }
  return mejorNombre;
}

const MAX_PERP_M = 200; // si estas a mas de esto de la ruta, no es confiable

// Distancia (m) a lo largo de la ruta del sentido (o combinada si no se da).
// Devuelve null si algun punto esta demasiado lejos de la ruta.
export function distanciaEnRutaMetros(aLat, aLng, bLat, bLng, sentido) {
  const ruta = sentido ? rutaDe(sentido) : R_COMB;
  const pa = proyectar(ruta, aLat, aLng);
  const pb = proyectar(ruta, bLat, bLng);
  if (pa.perp > MAX_PERP_M || pb.perp > MAX_PERP_M) return null;
  return Math.abs(pa.acumulado - pb.acumulado);
}

// Distancia preferida: por ruta si es confiable; si no, linea recta (Haversine).
export function distanciaConFallback(aLat, aLng, bLat, bLng, sentido) {
  const r = distanciaEnRutaMetros(aLat, aLng, bLat, bLng, sentido);
  if (r == null || !isFinite(r)) return distanciaMetros(aLat, aLng, bLat, bLng);
  return r;
}

// Largo total (m) de una ruta (para los fantasmas moviles).
export function largoRuta(sentido) {
  return rutaDe(sentido).total;
}

// Punto (lat,lng) a una distancia dada a lo largo de la ruta del sentido.
export function puntoEnDistancia(sentido, dist) {
  const ruta = rutaDe(sentido);
  const d = Math.max(0, Math.min(ruta.total, dist));
  for (let i = 0; i < ruta.segLen.length; i++) {
    if (d <= ruta.cum[i + 1]) {
      const off = d - ruta.cum[i];
      const frac = ruta.segLen[i] > 0 ? off / ruta.segLen[i] : 0;
      const a = ruta.pts[i];
      const b = ruta.pts[i + 1];
      return aLatLng(a.x + (b.x - a.x) * frac, a.y + (b.y - a.y) * frac);
    }
  }
  const last = ruta.pts[ruta.pts.length - 1];
  return aLatLng(last.x, last.y);
}

export default calcularRouteProgress;
