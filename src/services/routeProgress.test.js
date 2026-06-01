// Pruebas de getTramo: dado un progreso 0..1, que parada actual y siguiente
// devuelve. Usa la lista PARADAS por defecto (editable).

import { getTramo, PARADAS } from './routeProgress';

describe('getTramo', () => {
  it('al inicio (0): current = Terminal Sur, next = siguiente parada', () => {
    const t = getTramo(0);
    expect(t.currentStop).toBe('Terminal Sur');
    expect(t.nextStop).toBe(PARADAS[1].nombre);
  });

  it('a mitad de ruta (0.6): cae en el tramo de la parada con progreso 0.5', () => {
    const t = getTramo(0.6);
    expect(t.currentStop).toBe(PARADAS[2].nombre); // progreso 0.5
    expect(t.nextStop).toBe(PARADAS[3].nombre); // progreso 0.75
  });

  it('justo sobre una parada (0.5): esa parada es la actual', () => {
    const t = getTramo(0.5);
    expect(t.currentStop).toBe(PARADAS[2].nombre);
    expect(t.nextStop).toBe(PARADAS[3].nombre);
  });

  it('al final (1): current = Huancane, next = null', () => {
    const t = getTramo(1);
    expect(t.currentStop).toBe('Huancane');
    expect(t.nextStop).toBeNull();
  });

  it('clamp fuera de rango', () => {
    expect(getTramo(-5).currentStop).toBe('Terminal Sur');
    expect(getTramo(99).currentStop).toBe('Huancane');
  });

  it('lista vacia no rompe', () => {
    const t = getTramo(0.5, []);
    expect(t.currentStop).toBeNull();
    expect(t.nextStop).toBeNull();
  });
});
