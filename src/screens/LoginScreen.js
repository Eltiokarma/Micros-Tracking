// ============================================================================
//  LoginScreen.js  —  Adaptacion nativa del LoginScreen del prototipo
// ============================================================================
//  Mantiene la jerarquia visual del prototipo:
//    logo -> nombre coop -> ruta -> chip "conectado" -> campo -> boton -> pie.
//  Cambio respecto al prototipo: un solo campo (nombre de usuario), porque el
//  nombre ES el ID en el servidor. Sin contrasena (era un mock de demo).
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../theme/colors';
import { mono, black } from '../theme/fonts';
import { COOP } from '../config/coop';
import CoopLogo from '../components/CoopLogo';
import Field from '../components/Field';
import { useFleet } from '../context/FleetContext';

export default function LoginScreen() {
  const { login } = useFleet();
  const [user, setUser] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user.trim()) {
      setError('Escribe tu nombre de usuario');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // login() conecta el socket y arranca el GPS. Al setear unitId,
      // App.js cambia automaticamente a la pantalla principal.
      await login(user.trim());
    } catch (e) {
      setLoading(false);
      setError('No se pudo iniciar. Intenta de nuevo.');
    }
  };

  return (
    <LinearGradient colors={[colors.bg, colors.navy]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 40,
            paddingBottom: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* --- Encabezado: logo + nombre + ruta --- */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <CoopLogo size={88} />
            <Text
              style={{
                fontFamily: black,
                fontSize: 26,
                letterSpacing: -0.5,
                color: colors.white,
                marginTop: 14,
              }}
            >
              {COOP.name}
            </Text>
            <Text
              style={{
                fontFamily: mono,
                fontSize: 10,
                letterSpacing: 1.5,
                color: colors.sky,
                textTransform: 'uppercase',
                marginTop: 4,
                textAlign: 'center',
              }}
            >
              {COOP.route}
            </Text>
          </View>

          {/* --- Chip "Conectado" (elemento de marca, decorativo) --- */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'center',
              gap: 6,
              paddingVertical: 4,
              paddingHorizontal: 10,
              backgroundColor: colors.panel,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 100,
              marginBottom: 22,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.green,
              }}
            />
            <Text
              style={{
                fontFamily: mono,
                fontSize: 10,
                letterSpacing: 1.5,
                color: colors.green,
                textTransform: 'uppercase',
              }}
            >
              Conectado
            </Text>
          </View>

          {/* --- Campo de usuario --- */}
          <Field
            label="Usuario"
            value={user}
            onChange={(t) => {
              setUser(t);
              if (error) setError(null);
            }}
            autoFocus
            error={!!error}
            placeholder="Tu nombre o numero de unidad"
          />

          {/* --- Caja de error --- */}
          {error && (
            <View
              style={{
                backgroundColor: 'rgba(255,77,109,0.12)',
                borderWidth: 1,
                borderColor: colors.red,
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 12,
                marginBottom: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.red,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>!</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.red, flex: 1 }}>
                {error}
              </Text>
            </View>
          )}

          {/* --- Boton INGRESAR (sombra dura imitada con borde inferior) --- */}
          <Pressable
            onPress={submit}
            disabled={loading}
            style={({ pressed }) => ({
              width: '100%',
              paddingVertical: 18,
              borderRadius: 14,
              alignItems: 'center',
              backgroundColor: loading ? colors.deep : colors.bright,
              borderBottomWidth: pressed || loading ? 0 : 4,
              borderBottomColor: colors.deep,
              marginTop: pressed && !loading ? 4 : 0,
              opacity: loading ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: black,
                fontSize: 20,
                letterSpacing: 2,
                color: colors.white,
              }}
            >
              {loading ? 'CONECTANDO...' : 'INGRESAR'}
            </Text>
          </Pressable>

          {/* --- Empuja el pie hacia abajo --- */}
          <View style={{ flex: 1, minHeight: 24 }} />

          {/* --- Pie de pagina --- */}
          <Text
            style={{
              fontFamily: mono,
              fontSize: 9,
              letterSpacing: 1.5,
              color: colors.mute,
              textAlign: 'center',
              textTransform: 'uppercase',
              lineHeight: 16,
            }}
          >
            {COOP.full}
            {'\n'}Juliaca · Puno · 3 824 m
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
