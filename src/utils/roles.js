// ============================================================================
//  roles.js  —  Roles (dueno/ayudante) y prioridad de GPS por unidad
// ============================================================================
//  Cada rol se conecta con un unitId que codifica la unidad y el rol:
//    "unidad05::dueno"  /  "unidad05::ayudante"
//  Asi el servidor ve dos streams distintos; en el CLIENTE agrupamos por
//  unidad y mostramos UNA sola combi, priorizando al DUENO (ayudante de
//  respaldo). Como el servidor borra unidades inactivas (~30s), si el dueno se
//  desconecta queda el ayudante; si vuelve, retoma prioridad. Sin tocar el
//  servidor ni el envio GPS.
// ============================================================================

export const ROL = { DUENO: 'dueno', AYUDANTE: 'ayudante' };
export const ROL_LABEL = { dueno: 'Dueño', ayudante: 'Ayudante' };

const SEP = '::';

export function construirUnitId(usuario, rol) {
  return `${usuario}${SEP}${rol}`;
}

export function parseUnitId(unitId) {
  const s = unitId || '';
  const idx = s.indexOf(SEP);
  if (idx < 0) return { unidad: s, rol: null }; // sin rol (ej. fantasmas)
  return { unidad: s.slice(0, idx), rol: s.slice(idx + SEP.length) };
}

// Agrupa una lista de unidades por su `unidad`, devolviendo UN representante
// por unidad con prioridad: dueno > ayudante > sin-rol. Excluye `miUnidad`
// (mi propia combi no va en "otros"). El representante usa unitId = unidad
// (estable para el mapa) y conserva lat/lng/sentido/etc del rol elegido.
export function agruparUnidades(units, miUnidad) {
  const grupos = new Map();
  (units || []).forEach((u) => {
    const { unidad, rol } = parseUnitId(u.unitId);
    if (miUnidad && unidad === miUnidad) return;
    if (!grupos.has(unidad)) grupos.set(unidad, {});
    const g = grupos.get(unidad);
    if (rol === ROL.DUENO) g.dueno = u;
    else if (rol === ROL.AYUDANTE) g.ayudante = u;
    else g.solo = u;
  });

  const out = [];
  grupos.forEach((g, unidad) => {
    const elegido = g.dueno || g.ayudante || g.solo;
    if (!elegido) return;
    out.push({
      ...elegido,
      unitId: unidad, // clave estable para el mapa/estado
      rolMostrado: parseUnitId(elegido.unitId).rol,
    });
  });
  return out;
}

export default { ROL, ROL_LABEL, construirUnitId, parseUnitId, agruparUnidades };
