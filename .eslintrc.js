// Configuracion de ESLint (formato clasico, el que usa eslint-config-expo v8).
// "expo" trae las reglas recomendadas para proyectos Expo / React Native.
module.exports = {
  root: true,
  extends: 'expo',
  // En React Native existen globales de navegador (setTimeout, WebSocket,
  // console...) y de Node. Sin declararlos, ESLint los marca como no-undef.
  env: {
    browser: true,
    node: true,
  },
  ignorePatterns: ['node_modules/', '.expo/', 'dist/', 'web-build/'],
  overrides: [
    {
      // En los archivos de prueba existen describe / it / expect (globales de Jest).
      files: ['**/*.test.js'],
      env: { jest: true },
    },
  ],
};
