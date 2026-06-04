import { distanciaMetros, etaSegundos, formatoMMSS, estadoProximidadPorEta } from './eta';

describe('distanciaMetros', () => {
  it('es ~0 en el mismo punto', () => {
    expect(distanciaMetros(-15.49, -70.12, -15.49, -70.12)).toBeCloseTo(0, 1);
  });

  it('da una distancia razonable entre dos paraderos (~cientos de m)', () => {
    const d = distanciaMetros(
      -15.492539599885784, -70.12414911872533, // Benigno Ballon
      -15.493430121555079, -70.1290088220023 // Apurimac
    );
    expect(d).toBeGreaterThan(400);
    expect(d).toBeLessThan(700);
  });
});

describe('etaSegundos', () => {
  it('a 5 km/h, 1000 m tardan 720 s', () => {
    expect(etaSegundos(1000, 5)).toBeCloseTo(720, 0);
  });
  it('devuelve null con velocidad invalida', () => {
    expect(etaSegundos(1000, 0)).toBeNull();
  });
});

describe('formatoMMSS', () => {
  it('formatea 125 s como 2:05', () => {
    expect(formatoMMSS(125)).toBe('2:05');
  });
  it('muestra --:-- si no hay dato', () => {
    expect(formatoMMSS(null)).toBe('--:--');
  });
});

describe('estadoProximidadPorEta', () => {
  it('rojo si esta muy pegado (<=60s)', () => {
    expect(estadoProximidadPorEta(30)).toBe('red');
    expect(estadoProximidadPorEta(60)).toBe('red');
  });
  it('amarillo si se acerca (<=150s)', () => {
    expect(estadoProximidadPorEta(120)).toBe('yellow');
  });
  it('verde si hay hueco (>150s) o no hay dato', () => {
    expect(estadoProximidadPorEta(300)).toBe('green');
    expect(estadoProximidadPorEta(null)).toBe('green');
  });
});
