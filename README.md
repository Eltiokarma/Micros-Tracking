# R-14 Rastreo (Micros-Tracking)

App móvil (React Native + Expo) de rastreo en tiempo real para la
**Cooperativa de Transportes R-14 de Juliaca, Perú**. Reemplaza al prototipo
web (PWA) cuyo GPS se cortaba al apagar la pantalla.

## Por qué React Native y no la PWA

En el navegador, al apagar la pantalla el sistema **congela el JavaScript** y
el GPS deja de reportar. Para una combi en movimiento eso es crítico. Aquí
usamos **GPS en segundo plano** con `expo-location` + `expo-task-manager` y un
**foreground service de Android** (notificación permanente) que mantiene la
app viva con la pantalla apagada.

## El servidor NO cambia

Se conecta por WebSocket al servidor existente (Node + Express + ws):

- WebSocket: `wss://prototipo-celular-rastreo-01-production.up.railway.app`
- Health: `https://prototipo-celular-rastreo-01-production.up.railway.app/ping`

### Protocolo

La app **envía**:

```jsonc
{ "type": "identify", "unitId": "<nombre>", "driverName": "<nombre>" } // al conectar
{ "type": "gps", "lat": <n>, "lng": <n>, "speed": <km/h>, "routeProgress": <0..1> } // cada ~3s
```

El servidor **transmite** a todos:

```jsonc
{
  "type": "state",
  "units": [ { "unitId", "driverName", "lat", "lng", "speed", "routeProgress", "timestamp" } ],
  "gaps": { "<unitId>": { "toAhead": "MM:SS", "toBehind": "MM:SS", "aheadUnit", "behindUnit" } },
  "totalOnRoute": <n>,
  "timestamp": <ms>
}
```

> `routeProgress` lo calcula el cliente (no el servidor). La fórmula está en
> `src/services/routeProgress.js` y es copia exacta del cliente web, para que
> app y servidor "hablen el mismo idioma" de progreso.

## Estructura

```
App.js                      Ensamblaje: login gate + carrusel (Chat/Ruta/Mapa) + flash SOS
index.js                    Punto de entrada (registerRootComponent)
app.json                    Config Expo + permisos Android + plugin expo-location
eas.json                    Perfiles de EAS Build (preview/production = APK)
src/
  theme/colors.js           Paleta de la marca
  theme/fonts.js            Tipografías (monospace del sistema por ahora)
  config/coop.js            Datos de la coop + brecha objetivo (TARGET_GAP_SEC)
  services/socket.js        Cliente WebSocket singleton (reconexión con backoff)
  services/location.js      GPS en segundo plano + foreground service
  services/routeProgress.js Fórmula 0..1 (copiada del cliente web)
  context/FleetContext.js   Estado global (useFleet): units, gaps, miGap, myPosition…
  utils/status.js           Lógica del semáforo (verde/amarillo/rojo)
  screens/                  LoginScreen, RouteScreen, MapScreen, ChatScreen
  components/               CoopLogo, Field, ContextHeader, BigTime, Semaphore, SosSlider
```

## Cómo correrlo

```bash
npm install
npx expo start         # abre el dev server
```

> ⚠️ El GPS en segundo plano **NO funciona en Expo Go**. Requiere un
> *development build* o el APK de EAS (ver abajo).

## Cómo generar el APK (sin Play Store)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --profile preview --platform android   # genera un .apk descargable
```

EAS compila en la nube y te da un enlace para descargar el APK e instalarlo
directo en los celulares de los choferes.

## Estado actual

- [x] Login (nombre = ID en el servidor)
- [x] Pantalla central: brechas adelante/atrás, semáforo, SOS deslizable
- [x] Mapa (Leaflet en WebView): punto blanco "TÚ" + puntos azules de otros
- [x] GPS en segundo plano (foreground service)
- [x] WebSocket con reconexión
- [x] Carrusel deslizable Chat ← Ruta → Mapa con dots
- [ ] SOS: hoy es visual (flash). Falta enviar alerta real al servidor.
- [ ] Chat: hoy es placeholder con mensajes de ejemplo.
- [ ] Fuentes reales (Archivo Black / JetBrains Mono) vía expo-font.
```
