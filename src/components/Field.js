// Campo de texto con etiqueta arriba (equivalente al <Field> del prototipo).
// En web era un <input>; en React Native es un <TextInput>.

import React from 'react';
import { View, Text, TextInput } from 'react-native';
import colors from '../theme/colors';
import { mono } from '../theme/fonts';

export default function Field({
  label,
  value,
  onChange,
  secure = false,
  error = false,
  autoFocus = false,
  placeholder = '',
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          fontFamily: mono,
          fontSize: 10,
          letterSpacing: 1.5,
          color: colors.dim,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        autoFocus={autoFocus}
        placeholder={placeholder}
        placeholderTextColor={colors.mute}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          backgroundColor: colors.panel,
          borderWidth: 1,
          borderColor: error ? colors.red : colors.line,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 14,
          fontSize: 18,
          color: colors.white,
        }}
      />
    </View>
  );
}
