// Tipografias reales del prototipo, cargadas con expo-font (ver App.js).
//
//   - "Archivo Black"  -> titulos y numeros grandes (la fuente "gorda").
//   - "JetBrains Mono" -> etiquetas tecnicas (TRAMO, VEL. PROM, EN VIVO...).
//
// Los nombres de familia (ArchivoBlack_400Regular, etc.) son los que exponen
// los paquetes @expo-google-fonts. Las pantallas importan `black` y `mono`,
// asi que si algun dia cambiamos de fuente, se cambia SOLO aca.

export const FONTS = {
  black: 'ArchivoBlack_400Regular',
  mono: 'JetBrainsMono_400Regular',
  monoBold: 'JetBrainsMono_700Bold',
};

// Aliases que ya usan los componentes:
export const black = FONTS.black;
export const mono = FONTS.mono;

export default FONTS;
