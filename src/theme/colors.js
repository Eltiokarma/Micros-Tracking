// Paleta de la marca R-14 (tema oscuro).
// Tener los colores en UN solo archivo: si manana cambias el azul de la
// marca, lo cambias aca una vez y toda la app se actualiza.
//
// Ademas de tu paleta base, agrego los "tokens" que usa el prototipo web
// (navy, line, dim, mute, deep) para poder replicar la jerarquia visual.

export const colors = {
  // --- Tu paleta base ---
  brand: '#2580CF',     // azul marca
  bright: '#2E9DFF',    // azul brillante (acentos, botones, "otros choferes")
  bg: '#0A1A2E',        // fondo oscuro
  panel: '#16304A',     // tarjetas y paneles
  green: '#3DD685',     // semaforo OK
  yellow: '#F5C542',    // semaforo en el limite
  red: '#FF4D6D',       // semaforo critico / SOS
  white: '#F5F9FF',     // texto principal y punto "TU"

  // --- Tokens derivados para igualar el prototipo ---
  navy: '#12263E',      // fin del degradado del fondo (un poco mas claro que bg)
  line: '#244463',      // bordes sutiles de tarjetas e inputs
  deep: '#15527F',      // sombra "dura" debajo de los botones (azul mas oscuro)
  sky: '#2E9DFF',       // subtitulos y enlaces (igual al brillante)
  mute: '#6B86A3',      // texto secundario / placeholders
  dim: '#5E7C99',       // etiquetas pequenas (TRAMO, VEL. PROM, etc.)
  fg: '#F5F9FF',        // alias de texto en primer plano (= white)

  // --- Alias en espanol (por si prefieres usarlos) ---
  azulMarca: '#2580CF',
  azulBrillante: '#2E9DFF',
  fondo: '#0A1A2E',
};

export default colors;
