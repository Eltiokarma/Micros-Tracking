import { fantasmasEnVivo, CANTIDAD_FANTASMAS } from './fantasmas';

describe('fantasmasEnVivo (Tarea 4)', () => {
  it('devuelve la cantidad configurada de fantasmas', () => {
    expect(fantasmasEnVivo(0)).toHaveLength(CANTIDAD_FANTASMAS);
  });

  it('cada fantasma tiene coordenadas validas y un sentido', () => {
    fantasmasEnVivo(0).forEach((f) => {
      expect(typeof f.lat).toBe('number');
      expect(typeof f.lng).toBe('number');
      expect(Number.isFinite(f.lat)).toBe(true);
      expect(Number.isFinite(f.lng)).toBe(true);
      expect(['ida', 'vuelta']).toContain(f.sentido);
      expect(f.fantasma).toBe(true);
    });
  });

  it('se mueven con el tiempo (cambian de posicion)', () => {
    const a = fantasmasEnVivo(0)[0];
    const b = fantasmasEnVivo(60000)[0]; // 60 s despues
    expect(a.lat !== b.lat || a.lng !== b.lng).toBe(true);
  });

  it('arrancan repartidos (no todos en el mismo lugar)', () => {
    const f = fantasmasEnVivo(0);
    const distintos = new Set(f.map((x) => x.lat + ',' + x.lng));
    expect(distintos.size).toBe(CANTIDAD_FANTASMAS);
  });
});
