// Configuracion de Babel para Expo. babel-preset-expo entiende JSX y las
// caracteristicas modernas de JavaScript que usamos en las pantallas.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
