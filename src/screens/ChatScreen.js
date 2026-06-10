// ============================================================================
//  ChatScreen: chat de la ruta (cliente listo; el servidor reparte 'chat_msg').
// ============================================================================
//  Envia con sendChat(texto) -> { type:'chat', text, timestamp }.
//  Recibe via FleetContext.messages (que se llena con cada 'chat_msg').
//
//  NOTA: hasta que el servidor reparta 'chat_msg', los mensajes propios NO
//  reapareceran (el servidor todavia ignora 'chat'). El cliente ya esta listo.
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFleet } from '../context/FleetContext';
import colors from '../theme/colors';
import { mono, black } from '../theme/fonts';

export default function ChatScreen() {
  const { messages, sendChat, unitId, driverName, logout } = useFleet();
  const [texto, setTexto] = useState('');
  const scrollRef = useRef(null);

  // Bajar al ultimo mensaje cuando llega uno nuevo.
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const enviar = () => {
    const limpio = texto.trim();
    if (!limpio) return;
    sendChat(limpio);
    setTexto('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <View style={{ flex: 1, paddingTop: 56 }}>
        {/* Encabezado: titulo + boton de cerrar sesion (para cambiar de usuario) */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontFamily: mono, fontSize: 10, color: colors.dim }} numberOfLines={1}>
            {driverName ? `Sesion: ${driverName}` : ''}
          </Text>
          <Text
            style={{
              fontFamily: mono,
              fontSize: 11,
              letterSpacing: 2,
              color: colors.dim,
              textTransform: 'uppercase',
            }}
          >
            Chat de la ruta
          </Text>
          <Pressable
            onPress={logout}
            style={({ pressed }) => ({
              paddingVertical: 4,
              paddingHorizontal: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.line,
              backgroundColor: pressed ? colors.panel : 'transparent',
            })}
          >
            <Text style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1, color: colors.red, textTransform: 'uppercase' }}>
              Salir
            </Text>
          </Pressable>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, gap: 10 }}>
          {messages.length === 0 && (
            <Text style={{ textAlign: 'center', color: colors.mute, fontSize: 13, marginTop: 20 }}>
              Aun no hay mensajes. Escribe el primero.
            </Text>
          )}
          {messages.map((m, i) => {
            const mio = m.unitId === unitId;
            return (
              <View
                key={i}
                style={{
                  alignSelf: mio ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  backgroundColor: mio ? colors.bright : colors.panel,
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 14,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                }}
              >
                {!mio && (
                  <Text style={{ fontFamily: mono, fontSize: 9, color: colors.dim, marginBottom: 2 }}>
                    {m.driverName || m.unitId}
                  </Text>
                )}
                <Text style={{ color: colors.white, fontSize: 14 }}>{m.text}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Barra de envio */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            padding: 12,
            borderTopWidth: 1,
            borderTopColor: colors.line,
          }}
        >
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={colors.mute}
            onSubmitEditing={enviar}
            returnKeyType="send"
            style={{
              flex: 1,
              backgroundColor: colors.panel,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 22,
              paddingHorizontal: 16,
              paddingVertical: 10,
              color: colors.white,
              fontSize: 15,
            }}
          />
          <Pressable
            onPress={enviar}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: pressed ? colors.brand : colors.bright,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: texto.trim() ? 1 : 0.5, // apagado cuando no hay texto
            })}
          >
            <Text style={{ fontFamily: black, color: colors.white, fontSize: 18 }}>→</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
