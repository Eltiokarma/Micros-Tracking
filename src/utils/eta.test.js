import {
  distanciaMetros,
  etaSegundos,
  formatoMMSS,
  estadoProximidadPorEta,
  velocidadParaEta,
  emaSiguiente,
  PISO_VELOCIDAD_KMH,
} from './eta';

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

// MEJORA A
describe('velocidadParaEta', () => {
  it('usa el fallback si no hay velocidad real', () => {
    expect(velocidadParaEta(null, 5)).toBe(5);
    expect(velocidadParaEta(undefined, 5)).toBe(5);
  });
  it('aplica el piso cuando estas casi detenido', () => {
    expect(velocidadParaEta(0, 5)).toBe(PISO_VELOCIDAD_KMH);
    expect(velocidadParaEta(2, 5)).toBe(PISO_VELOCIDAD_KMH);
  });
  it('usa la velocidad real si supera el piso', () => {
    expect(velocidadParaEta(12, 5)).toBe(12);
  });
});

// MEJORA B
describe('emaSiguiente', () => {
  it('el primer valor no se suaviza (no hay anterior)', () => {
    expect(emaSiguiente(null, 200)).toBe(200);
  });
  it('suaviza: 0.4*nuevo + 0.6*anterior', () => {
    expect(emaSiguiente(100, 200, 0.4)).toBeCloseTo(140, 5);
  });
  it('deja llegar a 0 cuando ya casi llegaste (<=3s)', () => {
    expect(emaSiguiente(100, 2, 0.4)).toBe(2);
    expect(emaSiguiente(100, 0, 0.4)).toBe(0);
  });
  it('devuelve null si no hay objetivo', () => {
    expect(emaSiguiente(100, null)).toBeNull();
  });
});
