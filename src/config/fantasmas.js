// ============================================================================
//  fantasmas.js  —  Conductores FANTASMA (solo para PRUEBAS)
// ============================================================================
//  Unidades estaticas en coordenadas fijas (4 paraderos de la ruta) que NO se
//  mueven. Sirven para probar el calculo de tiempos caminando con un solo
//  celular: como ellos no se mueven, el tiempo hacia ellos cambia solo cuando
//  vos te moves.
//
//  >>> PARA QUITARLOS: poné MODO_PRUEBA_FANTASMAS en false (o borra este archivo
//      y sus imports). No afectan el rastreo real. <<<
// ============================================================================

export const MODO_PRUEBA_FANTASMAS = true;

// Velocidad asumida para estimar el tiempo hacia cada fantasma.
// Como la prueba se hace CAMINANDO, usamos una velocidad de caminata
// promedio: 5 km/h. En la app real esto seria la velocidad del vehiculo
// o una velocidad medida en tiempo real.
export const VELOCIDAD_PRUEBA_KMH = 5;

export const FANTASMAS = [
  { unitId: 'Benigno Ballón', driverName: 'Benigno Ballón (fantasma)', lat: -15.492539599885784, lng: -70.12414911872533, fantasma: true },
  { unitId: 'Apurímac', driverName: 'Apurímac (fantasma)', lat: -15.493430121555079, lng: -70.1290088220023, fantasma: true },
  { unitId: 'Túpac Amaru', driverName: 'Túpac Amaru (fantasma)', lat: -15.4918829011274, lng: -70.12503228754773, fantasma: true },
  { unitId: 'Ramón Castilla', driverName: 'Ramón Castilla (fantasma)', lat: -15.49385749269465, lng: -70.12774572487804, fantasma: true },
];

export default FANTASMAS;
