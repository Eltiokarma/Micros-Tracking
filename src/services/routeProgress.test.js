// Pruebas de la polilinea de progreso y la parada mas cercana.
import {
  calcularRouteProgress,
  paradaMasCercana,
  PARADAS,
  distanciaEnRutaMetros,
  distanciaConFallback,
} from './routeProgress';

describe('calcularRouteProgress', () => {
  it('en la primera parada el progreso es 0', () => {
    const p = PARADAS[0];
    expect(calcularRouteProgress(p.lat, p.lng)).toBeCloseTo(0, 2);
  });

  it('avanza de forma MONOTONA a lo largo de las paradas 1..8', () => {
    // El punto 9 es identico al 1 (misma esquina), por eso probamos 1..8.
    const progresos = PARADAS.slice(0, 8).map((p) => calcularRouteProgress(p.lat, p.lng));
    for (let i = 1; i < progresos.length; i++) {
      expect(progresos[i]).toBeGreaterThan(progresos[i - 1]);
    }
  });

  it('la parada de retorno (Apurimac, #5) esta pasada la mitad', () => {
    const p = PARADAS[4]; // Apurimac, punto de retorno
    expect(calcularRouteProgress(p.lat, p.lng)).toBeGreaterThan(0.4);
  });

  it('siempre devuelve un valor dentro de [0,1]', () => {
    expect(calcularRouteProgress(-15.49, -70.12)).toBeGreaterThanOrEqual(0);
    expect(calcularRouteProgress(-15.49, -70.12)).toBeLessThanOrEqual(1);
    // muy lejos de la ruta: igual queda recortado a [0,1]
    expect(calcularRouteProgress(0, 0)).toBeGreaterThanOrEqual(0);
    expect(calcularRouteProgress(0, 0)).toBeLessThanOrEqual(1);
  });
});

describe('paradaMasCercana', () => {
  it('en cada parada devuelve su propio nombre', () => {
    // Probamos 1..8 (el 9 comparte coordenada con el 1).
    for (let i = 0; i < 8; i++) {
      const p = PARADAS[i];
      expect(paradaMasCercana(p.lat, p.lng)).toBe(p.nombre);
    }
  });

  it('a unos metros de una parada, sigue siendo la mas cercana', () => {
    const p = PARADAS[2]; // Raul Porras
    // ~10 m de corrimiento
    expect(paradaMasCercana(p.lat + 0.00005, p.lng)).toBe(p.nombre);
  });
});

describe('distanciaEnRutaMetros (MEJORA C)', () => {
  it('es ~0 en el mismo punto de la ruta', () => {
    const p = PARADAS[1];
    expect(distanciaEnRutaMetros(p.lat, p.lng, p.lat, p.lng)).toBeCloseTo(0, 1);
  });

  it('da una distancia positiva y finita entre dos paradas', () => {
    const a = PARADAS[1];
    const b = PARADAS[3];
    const d = distanciaEnRutaMetros(a.lat, a.lng, b.lat, b.lng);
    expect(d).toBeGreaterThan(0);
    expect(Number.isFinite(d)).toBe(true);
  });

  it('devuelve null si un punto esta lejos de la ruta (no confiable)', () => {
    const b = PARADAS[1];
    expect(distanciaEnRutaMetros(0, 0, b.lat, b.lng)).toBeNull();
  });
});

describe('distanciaConFallback (MEJORA C)', () => {
  it('usa la distancia por ruta cuando es confiable', () => {
    const a = PARADAS[1];
    const b = PARADAS[3];
    expect(distanciaConFallback(a.lat, a.lng, b.lat, b.lng)).toBeCloseTo(
      distanciaEnRutaMetros(a.lat, a.lng, b.lat, b.lng),
      5
    );
  });

  it('cae a la linea recta cuando la ruta no es confiable', () => {
    const b = PARADAS[1];
    const d = distanciaConFallback(0, 0, b.lat, b.lng);
    expect(d).toBeGreaterThan(0);
    expect(Number.isFinite(d)).toBe(true);
  });
});
