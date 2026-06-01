// Tipografias.
// "Archivo Black" y "JetBrains Mono" no existen en React Native por defecto.
// Por ahora:
//   - Titulos tipo "Archivo Black" -> usamos fontWeight '900'.
//   - Etiquetas tipo "JetBrains Mono" -> usamos la monospace del sistema.
// Mas adelante podemos cargar las fuentes reales con expo-font / @expo-google-fonts
// y reemplazar 'mono' por la fuente cargada, sin tocar las pantallas.

import { Platform } from 'react-native';

export const mono = Platform.select({
  ios: 'Courier',
  android: 'monospace',
  default: 'monospace',
});

export default { mono };
