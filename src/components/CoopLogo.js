// Logo de la cooperativa.
// Placeholder simple (insignia circular "R14"). Cuando tengas el logo real
// en PNG/SVG, reemplazamos el contenido de este componente y nada mas cambia.

import React from 'react';
import { View, Text } from 'react-native';
import colors from '../theme/colors';
import { black } from '../theme/fonts';

export default function CoopLogo({ size = 88 }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.brand,
        borderWidth: 3,
        borderColor: colors.bright,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: black,
          color: colors.white,
          fontSize: size * 0.34,
          letterSpacing: -1,
        }}
      >
        R14
      </Text>
    </View>
  );
}
