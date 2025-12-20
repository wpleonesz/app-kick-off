# App Kick Off — Mini Login con Ionic + Capacitor

Proyecto de ejemplo mínimo para inicio de sesión usando Ionic React, Vite y Capacitor.

Instalación rápida

1. Instala dependencias:

```bash
cd app-kick-off
npm install
```

2. Ejecuta en desarrollo (Vite):

```bash
npm run dev
```

3. Inicializar Capacitor (opcional, después de `npm run build`):

```bash
npm run build
npm run cap:init
npm run cap:sync
```

Descripción rápida

- `src/pages/Login.tsx`: formulario de inicio de sesión mock.
- `src/services/auth.ts`: servicio de autenticación simulado (usa `localStorage`).
- `src/pages/Home.tsx`: ruta protegida ejemplo.
- `capacitor.config.ts`: configuración mínima de Capacitor.

Siguientes pasos

- Reemplazar el `auth` mock por llamadas reales a tu API.
- Añadir manejo de errores y validaciones más completas.
- Configurar plataformas nativas con `npx cap add ios` / `android`.

Mobile-only y HTTP

- La app está preparada para bloquear la UI web y mostrar un mensaje si se abre en un navegador estándar (usa Capacitor para detectar la plataforma).
- Las peticiones al backend usan HTTP por defecto. Ajusta `src/config.ts` o la variable `VITE_API_BASE` si necesitas otra dirección. Para emulador Android, suele usarse `http://10.0.2.2:3000`.

Ejecutar en desarrollo (emulador o dispositivo)

```bash
npm run build
npm run cap:init   # solo la primera vez
npm run cap:sync
npm run cap:open:android
```

# App Kick Off — Mini Login con Ionic + Capacitor

Proyecto de ejemplo mínimo para inicio de sesión usando Ionic React, Vite y Capacitor.

Instalación rápida

1. Instala dependencias:

```bash
cd app-kick-off
npm install
```

2. Ejecuta en desarrollo (Vite):

```bash
npm run dev
```

3. Inicializar Capacitor (opcional, después de `npm run build`):

```bash
npm run build
npm run cap:init
npm run cap:sync
```

Descripción rápida

- `src/pages/Login.tsx`: formulario de inicio de sesión mock.
- `src/services/auth.ts`: servicio de autenticación simulado (usa `localStorage`).
- `src/pages/Home.tsx`: ruta protegida ejemplo.
- `capacitor.config.ts`: configuración mínima de Capacitor.

Siguientes pasos

- Reemplazar el `auth` mock por llamadas reales a tu API.
- Añadir manejo de errores y validaciones más completas.
- Configurar plataformas nativas con `npx cap add ios` / `android`.
