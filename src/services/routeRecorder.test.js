import { agregarPunto, formatoTexto, DISTANCIA_GRABADOR_M } from './routeRecorder';

describe('agregarPunto (logica de distancia del grabador)', () => {
  it('agrega el primer punto a una lista vacia', () => {
    const pts = agregarPunto([], -15.49, -70.12);
    expect(pts).toHaveLength(1);
    expect(pts[0].lat).toBe(-15.49);
  });

  it('NO agrega si te moviste menos de la distancia minima (mismo array)', () => {
    const pts = agregarPunto([], -15.49, -70.12);
    // ~11 m de corrimiento (< 30 m)
    const igual = agregarPunto(pts, -15.49 + 0.0001, -70.12);
    expect(igual).toBe(pts); // mismo array -> sin cambio
    expect(igual).toHaveLength(1);
  });

  it('agrega cuando superas la distancia minima', () => {
    const pts = agregarPunto([], -15.49, -70.12);
    // ~44 m de corrimiento (>= 30 m)
    const mas = agregarPunto(pts, -15.49 + 0.0004, -70.12);
    expect(mas).toHaveLength(2);
  });

  it('la distancia minima es la constante exportada', () => {
    expect(DISTANCIA_GRABADOR_M).toBe(30);
  });
});

describe('formatoTexto', () => {
  it('formatea cada punto como "lat, lng" por linea', () => {
    const txt = formatoTexto([
      { lat: -15.49, lng: -70.12 },
      { lat: -15.4915, lng: -70.1225 },
    ]);
    expect(txt).toBe('-15.490000, -70.120000\n-15.491500, -70.122500');
  });

  it('lista vacia -> texto vacio', () => {
    expect(formatoTexto([])).toBe('');
  });
});
