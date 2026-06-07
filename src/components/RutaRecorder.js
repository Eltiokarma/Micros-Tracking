// ============================================================================
//  RutaRecorder: modal para GRABAR una ruta real (herramienta de trabajo).
// ============================================================================
//  Reutiliza userPos (las lecturas de GPS que ya ocurren) y guarda un punto
//  cada vez que te desplazas >= DISTANCIA_GRABADOR_M. Persiste en archivo para
//  no perder la grabacion si se cierra la app. NO toca el envio GPS.
//  Requiere sesion iniciada (que el rastreo este activo para tener userPos).
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFleet } from '../context/FleetContext';
import {
  agregarPunto,
  formatoTexto,
  guardarGrabacion,
  leerGrabacion,
  limpiarGrabacion,
  DISTANCIA_GRABADOR_M,
} from '../services/routeRecorder';
import colors from '../theme/colors';
import { mono, black } from '../theme/fonts';

export default function RutaRecorder({ visible, onClose }) {
  const { userPos } = useFleet();
  const [grabando, setGrabando] = useState(false);
  const [puntos, setPuntos] = useState([]);
  const [copiado, setCopiado] = useState(false);

  // Al abrir, cargamos la grabacion guardada (por si se cerro la app).
  useEffect(() => {
    if (!visible) return undefined;
    let activo = true;
    (async () => {
      const g = await leerGrabacion();
      if (activo) setPuntos(g);
    })();
    return () => {
      activo = false;
    };
  }, [visible]);

  // Mientras graba: cada vez que cambia mi posicion, agregamos punto si me movi
  // lo suficiente. agregarPunto devuelve el MISMO array si no corresponde.
  useEffect(() => {
    if (!grabando || !userPos || userPos.lat == null) return;
    setPuntos((prev) => {
      const nueva = agregarPunto(prev, userPos.lat, userPos.lng);
      if (nueva !== prev) guardarGrabacion(nueva);
      return nueva;
    });
  }, [userPos, grabando]);

  const texto = formatoTexto(puntos);

  const limpiar = () => {
    setGrabando(false);
    setPuntos([]);
    limpiarGrabacion();
  };

  const copiar = async () => {
    if (!texto) return;
    try {
      await Clipboard.setStringAsync(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (e) {
      console.warn('[rec] no se pudo copiar:', e?.message || e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: colors.bg,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderWidth: 1,
            borderColor: colors.line,
            padding: 18,
            paddingBottom: 28,
            maxHeight: '85%',
          }}
        >
          {/* Encabezado */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: black, fontSize: 18, color: colors.white }}>Grabar ruta</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={{ fontFamily: black, fontSize: 18, color: colors.dim }}>✕</Text>
            </Pressable>
          </View>

          {/* Estado */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: grabando ? colors.red : colors.dim,
              }}
            />
            <Text style={{ fontFamily: mono, fontSize: 12, color: colors.white }}>
              {grabando ? 'GRABANDO' : 'DETENIDO'} · {puntos.length} puntos
            </Text>
          </View>

          {/* Botones */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <Pressable
              onPress={() => setGrabando((g) => !g)}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: grabando ? colors.red : colors.bright,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ fontFamily: black, fontSize: 15, letterSpacing: 1, color: colors.white }}>
                {grabando ? 'DETENER' : 'INICIAR'}
              </Text>
            </Pressable>
            <Pressable
              onPress={limpiar}
              style={({ pressed }) => ({
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.line,
                backgroundColor: pressed ? colors.panel : 'transparent',
              })}
            >
              <Text style={{ fontFamily: mono, fontSize: 12, color: colors.dim, textTransform: 'uppercase' }}>
                Limpiar
              </Text>
            </Pressable>
          </View>

          {/* Boton: copiar TODOS los puntos al portapapeles */}
          <Pressable
            onPress={copiar}
            disabled={puntos.length === 0}
            style={({ pressed }) => ({
              marginTop: 14,
              paddingVertical: 13,
              borderRadius: 12,
              alignItems: 'center',
              backgroundColor: copiado ? colors.green : colors.bright,
              opacity: puntos.length === 0 ? 0.5 : pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontFamily: black, fontSize: 14, letterSpacing: 1, color: colors.white }}>
              {copiado ? '¡COPIADO!' : `COPIAR ${puntos.length} PUNTOS`}
            </Text>
          </Pressable>

          <Text style={{ fontFamily: mono, fontSize: 10, color: colors.mute, marginTop: 10, marginBottom: 6 }}>
            Un punto cada ~{DISTANCIA_GRABADOR_M} m. Mantené la app abierta y la sesión iniciada.
            También podés seleccionar el texto a mano.
          </Text>

          {/* Lista scrolleable con el texto seleccionable (respaldo) */}
          <ScrollView
            style={{
              maxHeight: 200,
              backgroundColor: colors.panel,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 12,
            }}
            contentContainerStyle={{ padding: 12 }}
            nestedScrollEnabled
          >
            <Text selectable style={{ color: colors.white, fontFamily: mono, fontSize: 12, lineHeight: 18 }}>
              {texto || 'Sin puntos todavía.'}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
