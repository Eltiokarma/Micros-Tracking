// ============================================================================
//  routeProgress.js  —  Convierte (lat, lng) en un numero 0..1
// ============================================================================
//
//  QUE ES routeProgress:
//  Es "que tan avanzado vas en la ruta R-14", de 0 a 1.
//    0  = Terminal Sur (inicio)
//    1  = Huancane (final)
//    0.5 = vas por la mitad
//
//  POR QUE IMPORTA:
//  El servidor NO sabe ubicaciones reales de calles; solo compara este
//  numero entre choferes para saber quien va adelante y quien atras, y asi
//  calcular las brechas (gaps) de tiempo. Si este numero esta mal, el
//  semaforo y los tiempos +1/-1 saldrian mal.
//
//  IMPORTANTE: esta formula es COPIA EXACTA del cliente web viejo
//  (realtime.js). La mantenemos identica para que la app nueva y el
//  servidor "hablen el mismo idioma" de progreso.
// ============================================================================

// Los dos extremos de la ruta (coordenadas reales en Juliaca).
const TERMINAL_SUR = { lat: -15.502, lng: -70.133 }; // progreso 0
const HUANCANE = { lat: -15.457, lng: -70.103 };      // progreso 1

export function calcularRouteProgress(lat, lng) {
  const totalLat = HUANCANE.lat - TERMINAL_SUR.lat; // cuanto cambia la latitud de punta a punta
  const totalLng = HUANCANE.lng - TERMINAL_SUR.lng; // idem longitud

  const doneLat = lat - TERMINAL_SUR.lat; // cuanto avanzaste en latitud
  const doneLng = lng - TERMINAL_SUR.lng; // cuanto avanzaste en longitud

  // Promediamos el avance en las dos dimensiones. Es una aproximacion:
  // asume que la ruta es mas o menos una linea recta de sur a norte.
  const progress = (doneLat / totalLat + doneLng / totalLng) / 2;

  // clamp: nunca menos de 0 ni mas de 1, aunque el GPS se salga de la ruta.
  return Math.max(0, Math.min(1, progress));
}

export default calcularRouteProgress;
