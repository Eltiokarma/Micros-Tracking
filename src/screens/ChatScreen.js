// ============================================================================
//  ChatScreen: placeholder (igual que en el prototipo, aun no funcional).
// ============================================================================
//  Mensajes de ejemplo, sin servidor de chat todavia. Mas adelante se puede
//  conectar al mismo WebSocket con un nuevo tipo de mensaje (type: 'chat').
// ============================================================================

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import colors from '../theme/colors';
import { mono } from '../theme/fonts';

const MENSAJES = [
  { de: 'V-203', texto: 'Hay tranca por la salida sur, vayan despacio.', mio: false },
  { de: 'V-247', texto: 'Ok, gracias por el dato.', mio: true },
  { de: 'V-118', texto: 'Yo ya pase Huancane, todo libre.', mio: false },
];

export default function ChatScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: 48 }}>
      <Text
        style={{
          fontFamily: mono,
          fontSize: 11,
          letterSpacing: 2,
          color: colors.dim,
          textTransform: 'uppercase',
          textAlign: 'center',
          marginBottom: 12,
        }}
      >
        Chat de la ruta
      </Text>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        {MENSAJES.map((m, i) => (
          <View
            key={i}
            style={{
              alignSelf: m.mio ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              backgroundColor: m.mio ? colors.bright : colors.panel,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 14,
              paddingVertical: 8,
              paddingHorizontal: 12,
            }}
          >
            {!m.mio && (
              <Text style={{ fontFamily: mono, fontSize: 9, color: colors.dim, marginBottom: 2 }}>
                {m.de}
              </Text>
            )}
            <Text style={{ color: colors.white, fontSize: 14 }}>{m.texto}</Text>
          </View>
        ))}
      </ScrollView>

      <Text
        style={{
          textAlign: 'center',
          color: colors.mute,
          fontSize: 12,
          paddingVertical: 14,
        }}
      >
        (El chat aun no esta conectado)
      </Text>
    </View>
  );
}
