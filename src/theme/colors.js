// Paleta de la marca R-14.
// Tener los colores en UN solo archivo significa que si manana cambias
// el azul de la marca, lo cambias aca una vez y toda la app se actualiza.
// (Es el mismo principio de "no repetirse" que veras en todo el codigo.)

export const colors = {
  azulMarca: '#2580CF',     // azul principal de la cooperativa
  azulBrillante: '#2E9DFF', // acentos, botones activos, "otros choferes"
  fondo: '#0A1A2E',         // fondo oscuro de todas las pantallas
  panel: '#16304A',         // tarjetas y paneles sobre el fondo

  verde: '#3DD685',         // semaforo: brecha OK
  amarillo: '#F5C542',      // semaforo: brecha en el limite
  rojo: '#FF4D6D',          // semaforo: muy cerca / muy lejos / SOS

  blanco: '#F5F9FF',        // texto principal y el punto "TU" en el mapa
};

export default colors;
