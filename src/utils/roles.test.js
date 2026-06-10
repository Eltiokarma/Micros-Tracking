import { construirUnitId, parseUnitId, agruparUnidades, ROL } from './roles';

describe('construir/parse unitId', () => {
  it('roundtrip unidad + rol', () => {
    const id = construirUnitId('unidad05', ROL.DUENO);
    expect(id).toBe('unidad05::dueno');
    expect(parseUnitId(id)).toEqual({ unidad: 'unidad05', rol: 'dueno' });
  });

  it('un id sin rol (fantasma) se parsea sin rol', () => {
    expect(parseUnitId('Fantasma 1')).toEqual({ unidad: 'Fantasma 1', rol: null });
  });
});

describe('agruparUnidades (prioridad dueno/ayudante)', () => {
  const dueno = { unitId: 'unidad05::dueno', lat: 1, lng: 1 };
  const ayudante = { unitId: 'unidad05::ayudante', lat: 2, lng: 2 };
  const fantasma = { unitId: 'Fantasma 1', lat: 3, lng: 3 };

  it('muestra UNA sola combi por unidad, con la posicion del DUENO', () => {
    const r = agruparUnidades([dueno, ayudante], null);
    expect(r).toHaveLength(1);
    expect(r[0].unitId).toBe('unidad05'); // clave estable = unidad
    expect(r[0].lat).toBe(1); // posicion del dueno
  });

  it('si el dueno no esta, usa la del AYUDANTE (respaldo)', () => {
    const r = agruparUnidades([ayudante], null);
    expect(r).toHaveLength(1);
    expect(r[0].lat).toBe(2);
  });

  it('excluye mi propia unidad', () => {
    const r = agruparUnidades([dueno, ayudante], 'unidad05');
    expect(r).toHaveLength(0);
  });

  it('los fantasmas (sin rol) pasan como su propia unidad', () => {
    const r = agruparUnidades([dueno, fantasma], 'unidad05');
    expect(r).toHaveLength(1);
    expect(r[0].unitId).toBe('Fantasma 1');
  });
});
