// Pruebas de las funciones puras del semaforo.
// Son ideales para testear: no dependen de React ni del GPS, solo entran
// datos y sale un resultado. Si manana ajustas la heuristica del semaforo,
// estos tests te avisan si rompiste algo.

import { parseGap, computeStatus } from './status';

describe('parseGap', () => {
  it('convierte "02:15" a 135 segundos', () => {
    expect(parseGap('02:15')).toBe(135);
  });

  it('devuelve null cuando no hay dato', () => {
    expect(parseGap(null)).toBeNull();
    expect(parseGap('')).toBeNull();
  });
});

describe('computeStatus', () => {
  it('verde cuando la brecha esta cerca del objetivo', () => {
    expect(computeStatus(300, 300, 300)).toBe('green');
  });

  it('rojo cuando una unidad esta demasiado cerca', () => {
    expect(computeStatus(60, 300, 300)).toBe('red');
  });

  it('amarillo cuando esta algo desviada', () => {
    expect(computeStatus(210, 300, 300)).toBe('yellow');
  });

  it('verde por defecto cuando no hay brechas', () => {
    expect(computeStatus(null, null, 300)).toBe('green');
  });
});
