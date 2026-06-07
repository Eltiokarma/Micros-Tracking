// ============================================================================
//  LoginScreen.js  —  Login de UNIDAD con roles (3 pasos)
// ============================================================================
//  1) Credenciales de la UNIDAD (usuario + contrasena, validadas contra la
//     lista fija de config/usuarios.js). El dueno y el ayudante usan las MISMAS.
//  2) Rol: Dueno o Ayudante.
//  3) Apodo (lo que se muestra, ej. "karma").
//  Luego entra a la app. login(usuario, rol, apodo) en FleetContext.
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
import { validarCredenciales } from '../config/usuarios';
import { ROL, ROL_LABEL } from '../utils/roles';

function Boton({ texto, onPress, loading }) {
  return (
    <Pressable
      onPress={onPress}
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
      <Text style={{ fontFamily: black, fontSize: 20, letterSpacing: 2, color: colors.white }}>
        {texto}
      </Text>
    </Pressable>
  );
}

export default function LoginScreen() {
  const { login } = useFleet();
  const [paso, setPaso] = useState('credenciales'); // credenciales | rol | apodo
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [usuarioOk, setUsuarioOk] = useState(null);
  const [rol, setRol] = useState(null);
  const [apodo, setApodo] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const validar = () => {
    const ok = validarCredenciales(usuario, password);
    if (!ok) {
      setError('Usuario o contraseña incorrectos');
      return;
    }
    setUsuarioOk(ok);
    setError(null);
    setPaso('rol');
  };

  const elegirRol = (r) => {
    setRol(r);
    setPaso('apodo');
  };

  const entrar = async () => {
    if (!apodo.trim()) {
      setError('Escribe tu apodo');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(usuarioOk, rol, apodo.trim());
      // al setear unitId, App.js cambia a la pantalla principal.
    } catch (e) {
      setLoading(false);
      setError('No se pudo iniciar. Intenta de nuevo.');
    }
  };

  const CajaError = () =>
    error ? (
      <View
        style={{
          backgroundColor: 'rgba(255,77,109,0.12)',
          borderWidth: 1,
          borderColor: colors.red,
          borderRadius: 10,
          paddingVertical: 10,
          paddingHorizontal: 12,
          marginBottom: 14,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.red }}>{error}</Text>
      </View>
    ) : null;

  return (
    <LinearGradient colors={[colors.bg, colors.navy]} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Encabezado */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <CoopLogo size={80} />
            <Text style={{ fontFamily: black, fontSize: 24, color: colors.white, marginTop: 12 }}>
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
              }}
            >
              {COOP.route}
            </Text>
          </View>

          {/* PASO 1: credenciales de la unidad */}
          {paso === 'credenciales' && (
            <>
              <Text style={styles_label}>Acceso de la unidad</Text>
              <Field
                label="Usuario de la unidad"
                value={usuario}
                onChange={(t) => { setUsuario(t); if (error) setError(null); }}
                autoFocus
                error={!!error}
                placeholder="ej: unidad05"
              />
              <Field
                label="Contraseña"
                value={password}
                onChange={(t) => { setPassword(t); if (error) setError(null); }}
                secure
                error={!!error}
                placeholder="contraseña de la unidad"
              />
              <CajaError />
              <Boton texto="CONTINUAR" onPress={validar} />
            </>
          )}

          {/* PASO 2: rol */}
          {paso === 'rol' && (
            <>
              <Text style={styles_label}>¿Cuál es tu rol en {usuarioOk}?</Text>
              {[ROL.DUENO, ROL.AYUDANTE].map((r) => (
                <Pressable
                  key={r}
                  onPress={() => elegirRol(r)}
                  style={({ pressed }) => ({
                    paddingVertical: 20,
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: colors.line,
                    backgroundColor: pressed ? colors.bright : colors.panel,
                    marginBottom: 12,
                  })}
                >
                  <Text style={{ fontFamily: black, fontSize: 20, color: colors.white }}>
                    {ROL_LABEL[r]}
                  </Text>
                  <Text style={{ fontFamily: mono, fontSize: 11, color: colors.dim, marginTop: 2 }}>
                    {r === ROL.DUENO ? 'Tu GPS tiene prioridad' : 'GPS de respaldo'}
                  </Text>
                </Pressable>
              ))}
              <Pressable onPress={() => { setPaso('credenciales'); setError(null); }} style={{ marginTop: 6, alignSelf: 'center' }}>
                <Text style={{ fontFamily: mono, fontSize: 12, color: colors.sky }}>← atrás</Text>
              </Pressable>
            </>
          )}

          {/* PASO 3: apodo */}
          {paso === 'apodo' && (
            <>
              <Text style={styles_label}>Tu apodo ({ROL_LABEL[rol]} de {usuarioOk})</Text>
              <Field
                label="Apodo"
                value={apodo}
                onChange={(t) => { setApodo(t); if (error) setError(null); }}
                autoFocus
                error={!!error}
                placeholder="ej: karma"
              />
              <CajaError />
              <Boton texto={loading ? 'CONECTANDO...' : 'INGRESAR'} onPress={entrar} loading={loading} />
              <Pressable onPress={() => { setPaso('rol'); setError(null); }} style={{ marginTop: 12, alignSelf: 'center' }}>
                <Text style={{ fontFamily: mono, fontSize: 12, color: colors.sky }}>← atrás</Text>
              </Pressable>
            </>
          )}

          <View style={{ flex: 1, minHeight: 16 }} />
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

const styles_label = {
  fontFamily: mono,
  fontSize: 11,
  letterSpacing: 1.5,
  color: colors.dim,
  textTransform: 'uppercase',
  marginBottom: 12,
  textAlign: 'center',
};
