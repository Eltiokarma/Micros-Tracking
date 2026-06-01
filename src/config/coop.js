// Datos de la cooperativa. Centralizados para no repetir textos por la app.
export const COOP = {
  name: 'COOP. R-14',
  route: 'Terminal Sur → Huancane',
  full: 'Cooperativa de Transportes R-14',
};

// Brecha objetivo entre unidades, en segundos. Es el "ideal" contra el que
// el semaforo compara tus brechas. Ajustable cuando calibres en la calle.
export const TARGET_GAP_SEC = 300; // 5 minutos

export default COOP;
