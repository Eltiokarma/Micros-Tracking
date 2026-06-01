// ============================================================================
//  BigTime: el numero gigante de la brecha (tipo "02:15").
// ============================================================================
//  En la web la animacion de cada digito se hacia con CSS transitions.
//  En React Native usamos la API "Animated": un valor que cambia suave en el
//  tiempo y que conectamos a un estilo (aca: translateY + opacity).
//
//  useNativeDriver: true significa que la animacion corre en el hilo nativo
//  (no en JavaScript), asi que sigue fluida aunque el JS este ocupado.
// ============================================================================

import React, { useRef, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import colors from '../theme/colors';
import { mono, black } from '../theme/fonts';

const FONT_SIZE = 96;

function AnimatedDigit({ ch, color }) {
  const anim = useRef(new Animated.Value(0)).current; // 0 = en reposo
  const prev = useRef(ch);

  useEffect(() => {
    if (prev.current !== ch) {
      // Cuando el digito cambia: salta a 1 y vuelve a 0 suavemente (260ms).
      anim.setValue(1);
      Animated.timing(anim, { toValue: 0, duration: 260, useNativeDriver: true }).start();
      prev.current = ch;
    }
  }, [ch]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.85] });

  // Ancho fijo por caracter para que los numeros no "salten" de posicion.
  const minWidth = ch === ':' ? FONT_SIZE * 0.35 : FONT_SIZE * 0.62;

  return (
    <Animated.View style={{ minWidth, alignItems: 'center', transform: [{ translateY }], opacity }}>
      <Text
        style={{
          fontFamily: black,
          fontSize: FONT_SIZE,
          letterSpacing: -3,
          lineHeight: FONT_SIZE * 0.98,
          color,
          fontVariant: ['tabular-nums'],
        }}
      >
        {ch}
      </Text>
    </Animated.View>
  );
}

export default function BigTime({ value = '--:--', label = '', color = colors.white }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 2 }}>
      {/* Etiqueta pequena con el puntito (ADELANTE / ATRAS) */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green }} />
        <Text
          style={{
            fontFamily: mono,
            fontSize: 12,
            fontWeight: '700',
            letterSpacing: 2,
            color: colors.dim,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      </View>

      {/* El numero, digito por digito */}
      <View style={{ flexDirection: 'row' }}>
        {String(value)
          .split('')
          .map((ch, i) => (
            <AnimatedDigit key={i} ch={ch} color={color} />
          ))}
      </View>
    </View>
  );
}
