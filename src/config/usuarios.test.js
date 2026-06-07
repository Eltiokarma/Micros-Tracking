import { validarCredenciales, UNIDADES } from './usuarios';

describe('validarCredenciales', () => {
  it('hay ~20 unidades en la lista fija', () => {
    expect(UNIDADES.length).toBe(20);
  });

  it('acepta credenciales correctas y devuelve el usuario', () => {
    expect(validarCredenciales('unidad05', 'clave05')).toBe('unidad05');
  });

  it('el usuario es case-insensitive', () => {
    expect(validarCredenciales('UNIDAD05', 'clave05')).toBe('unidad05');
  });

  it('rechaza contrasena incorrecta', () => {
    expect(validarCredenciales('unidad05', 'mala')).toBeNull();
  });

  it('rechaza usuario inexistente', () => {
    expect(validarCredenciales('unidad99', 'clave99')).toBeNull();
  });

  it('rechaza vacios', () => {
    expect(validarCredenciales('', '')).toBeNull();
  });
});
