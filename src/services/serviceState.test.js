import {
  siguienteEstado,
  enZonaTerminal,
  ESTADOS,
  crearGestor,
} from './serviceState';

// Coordenadas de referencia
const APURIMAC = { lat: -15.493430121555079, lng: -70.1290088220023 }; // terminal
const CIRC = { lat: -15.491641494357753, lng: -70.12169544995002 }; // terminal
const RAUL = { lat: -15.493089305946617, lng: -70.12568547310879 }; // en ruta (no terminal)
const RAMON = { lat: -15.49385749269465, lng: -70.12774572487804 }; // en ruta

const MIN = 60 * 1000;

describe('enZonaTerminal', () => {
  it('Apurimac y Circunvalacion son terminales', () => {
    expect(enZonaTerminal(APURIMAC.lat, APURIMAC.lng)).toBe(true);
    expect(enZonaTerminal(CIRC.lat, CIRC.lng)).toBe(true);
  });
  it('un punto en medio de la ruta NO es terminal', () => {
    expect(enZonaTerminal(RAUL.lat, RAUL.lng)).toBe(false);
  });
});

describe('siguienteEstado', () => {
  it('primera vez -> EN_SERVICIO', () => {
    const r = siguienteEstado(null, RAUL.lat, RAUL.lng, 0);
    expect(r.estado).toBe(ESTADOS.EN_SERVICIO);
  });

  it('si se mueve -> EN_SERVICIO', () => {
    let r = siguienteEstado(null, RAUL.lat, RAUL.lng, 0);
    r = siguienteEstado(r, RAMON.lat, RAMON.lng, 3000); // ~250m en 3s = muy rapido
    expect(r.estado).toBe(ESTADOS.EN_SERVICIO);
  });

  it('quieta EN MEDIO DE LA RUTA -> DETENIDA_EN_RUTA (nunca fuera de servicio)', () => {
    let r = siguienteEstado(null, RAUL.lat, RAUL.lng, 0);
    r = siguienteEstado(r, RAUL.lat, RAUL.lng, 3000); // misma posicion
    expect(r.estado).toBe(ESTADOS.DETENIDA_EN_RUTA);
    // aunque pasen 40 min quieta en ruta, SIGUE siendo detenida_en_ruta
    r = siguienteEstado(r, RAUL.lat, RAUL.lng, 40 * MIN);
    expect(r.estado).toBe(ESTADOS.DETENIDA_EN_RUTA);
  });

  it('quieta en TERMINAL: amarillo -> rojo -> fuera de servicio', () => {
    let r = siguienteEstado(null, APURIMAC.lat, APURIMAC.lng, 0);
    r = siguienteEstado(r, APURIMAC.lat, APURIMAC.lng, 3000); // quietaDesde = 3000
    expect(r.estado).toBe(ESTADOS.ESPERA_AMARILLO);

    const rRojo = siguienteEstado(r, APURIMAC.lat, APURIMAC.lng, 3000 + 26 * MIN);
    expect(rRojo.estado).toBe(ESTADOS.ESPERA_ROJO);

    const rFuera = siguienteEstado(r, APURIMAC.lat, APURIMAC.lng, 3000 + 31 * MIN);
    expect(rFuera.estado).toBe(ESTADOS.FUERA_DE_SERVICIO);
  });

  it('re-activacion: de FUERA_DE_SERVICIO a EN_SERVICIO al moverse', () => {
    let r = siguienteEstado(null, APURIMAC.lat, APURIMAC.lng, 0);
    r = siguienteEstado(r, APURIMAC.lat, APURIMAC.lng, 3000);
    r = siguienteEstado(r, APURIMAC.lat, APURIMAC.lng, 3000 + 31 * MIN); // FUERA
    expect(r.estado).toBe(ESTADOS.FUERA_DE_SERVICIO);
    // ahora se mueve (Apurimac -> Circunvalacion, ~800m) en 3s
    const movida = siguienteEstado(r, CIRC.lat, CIRC.lng, 3000 + 31 * MIN + 3000);
    expect(movida.estado).toBe(ESTADOS.EN_SERVICIO);
  });
});

describe('gestor', () => {
  it('mantiene estado por unidad y reactiva al moverse', () => {
    const g = crearGestor();
    expect(g.estado('V1', RAUL.lat, RAUL.lng, 0)).toBe(ESTADOS.EN_SERVICIO);
    expect(g.estado('V1', RAUL.lat, RAUL.lng, 3000)).toBe(ESTADOS.DETENIDA_EN_RUTA);
    expect(g.estado('V1', RAMON.lat, RAMON.lng, 6000)).toBe(ESTADOS.EN_SERVICIO);
  });
});
