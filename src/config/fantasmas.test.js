import {
  fantasmasEnVivo,
  simularFantasma,
  CANTIDAD_FANTASMAS,
  VELOCIDADES_FANTASMAS,
  DESCANSO_IDA_MIN,
  DESCANSO_VUELTA_MIN,
} from './fantasmas';
import { enZonaTerminal } from '../services/serviceState';

describe('config de 6 fantasmas (Tarea 2)', () => {
  it('hay 6 fantasmas', () => {
    expect(CANTIDAD_FANTASMAS).toBe(6);
    expect(VELOCIDADES_FANTASMAS).toHaveLength(6);
  });

  it('todas las velocidades son distintas', () => {
    expect(new Set(VELOCIDADES_FANTASMAS).size).toBe(VELOCIDADES_FANTASMAS.length);
  });

  it('fantasmasEnVivo devuelve 6 unidades validas', () => {
    const f = fantasmasEnVivo(Date.now());
    expect(f).toHaveLength(6);
    f.forEach((g) => {
      expect(Number.isFinite(g.lat)).toBe(true);
      expect(Number.isFinite(g.lng)).toBe(true);
      expect(['ida', 'vuelta']).toContain(g.sentido);
      expect(g.fantasma).toBe(true);
    });
  });
});

describe('simularFantasma (movimiento + descansos, Tarea 3)', () => {
  it('es deterministico (misma entrada, misma salida)', () => {
    const a = simularFantasma(0, 123.4);
    const b = simularFantasma(0, 123.4);
    expect(a).toEqual(b);
  });

  it('se mueve con el tiempo', () => {
    const a = simularFantasma(0, 0);
    const b = simularFantasma(0, 30); // 30 s despues
    expect(a.lat !== b.lat || a.lng !== b.lng).toBe(true);
  });

  it('en algun momento DESCANSA (parado) en un terminal', () => {
    let huboDescanso = false;
    let descansoEnTerminal = true;
    for (let s = 0; s <= 3600; s += 5) {
      const p = simularFantasma(0, s);
      if (p.parado) {
        huboDescanso = true;
        if (!enZonaTerminal(p.lat, p.lng)) descansoEnTerminal = false;
      }
    }
    expect(huboDescanso).toBe(true);
    expect(descansoEnTerminal).toBe(true);
  });

  it('los tiempos de descanso son los configurados', () => {
    expect(DESCANSO_IDA_MIN).toEqual([5, 7]);
    expect(DESCANSO_VUELTA_MIN).toEqual([4, 8]);
  });
});
