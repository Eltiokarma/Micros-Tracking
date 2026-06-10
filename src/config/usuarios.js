// ============================================================================
//  usuarios.js  —  LISTA FIJA de credenciales por UNIDAD (solo para la DEMO)
// ============================================================================
//  El usuario/contraseña representan a la COMBI/UNIDAD, no a la persona.
//  El dueno y el ayudante de una misma combi entran con el MISMO usuario y
//  contrasena (el de su unidad).
//
//  >>> PARA EDITAR LAS CREDENCIALES: cambia/agrega filas en UNIDADES. <<<
//  (Es una lista fija para la presentacion; no hay base de datos ni registro.)
// ============================================================================

export const UNIDADES = [
  { usuario: 'unidad01', password: 'clave01' },
  { usuario: 'unidad02', password: 'clave02' },
  { usuario: 'unidad03', password: 'clave03' },
  { usuario: 'unidad04', password: 'clave04' },
  { usuario: 'unidad05', password: 'clave05' },
  { usuario: 'unidad06', password: 'clave06' },
  { usuario: 'unidad07', password: 'clave07' },
  { usuario: 'unidad08', password: 'clave08' },
  { usuario: 'unidad09', password: 'clave09' },
  { usuario: 'unidad10', password: 'clave10' },
  { usuario: 'unidad11', password: 'clave11' },
  { usuario: 'unidad12', password: 'clave12' },
  { usuario: 'unidad13', password: 'clave13' },
  { usuario: 'unidad14', password: 'clave14' },
  { usuario: 'unidad15', password: 'clave15' },
  { usuario: 'unidad16', password: 'clave16' },
  { usuario: 'unidad17', password: 'clave17' },
  { usuario: 'unidad18', password: 'clave18' },
  { usuario: 'unidad19', password: 'clave19' },
  { usuario: 'unidad20', password: 'clave20' },
];

// Valida credenciales contra la lista fija. Devuelve el `usuario` (en minuscula)
// si son correctas, o null si no. El usuario es case-insensitive; la clave no.
export function validarCredenciales(usuario, password) {
  const u = (usuario || '').trim().toLowerCase();
  const p = (password || '').trim();
  const found = UNIDADES.find((x) => x.usuario.toLowerCase() === u && x.password === p);
  return found ? found.usuario.toLowerCase() : null;
}

export default { UNIDADES, validarCredenciales };
