# 📚 Scripts de package.json - Guía Completa

Esta guía documenta todos los scripts disponibles en el proyecto App Kick Off, mejorados al nivel de sgu-mobile.

---

## 🚀 Desarrollo

### Iniciar servidor de desarrollo
```bash
npm run dev
# Inicia Vite en http://localhost:3001
# Soporta Hot Module Replacement (HMR) automático
# Accesible desde dispositivos en la red (--host 0.0.0.0)
```

### Desarrollo con debug activado
```bash
npm run dev:debug
# Inicia servidor de desarrollo con todos los logs de debug
# Útil para troubleshooting de issues complejos
```

---

## 🔨 Build & Deploy

### Build para producción
```bash
npm run build
# Compila la app para producción
# Genera código optimizado y minificado
# Output en carpeta: dist/
```

### Build con reporte de tamaño
```bash
npm run build:report
# Compila y muestra el tamaño total de la carpeta dist/
# Útil para monitorear crecimiento del bundle
```

### Preview de build (local)
```bash
npm run preview
# Inicia servidor local mostrando la build final
# Ayuda a verificar que todo funciona en producción
# Puerto: 4173
```

---

## 🧹 Limpieza

### Limpiar todo completamente
```bash
npm run clean
# Elimina dist/, node_modules/ y package-lock.json
# Reinstala todas las dependencias
# Útil cuando hay problemas de dependencias
```

### Limpiar solo dist/
```bash
npm run clean:dist
# Elimina la carpeta de build
# Más rápido que clean completo
```

### Limpiar caché
```bash
npm run clean:cache
# Elimina caché de Vite y npm
# Útil si el dev server está comportándose mal
```

---

## ✅ Type Checking

### Verificar TypeScript
```bash
npm run type-check
# Valida tipos sin compilar
# Identifica errores de tipo
# Usa tsconfig.json strict mode
```

### Lint de TypeScript
```bash
npm run lint:ts
# Chequea tipos con salida legible
# Útil en CI/CD pipelines
```

---

## 📱 Desarrollo Android

### Full: Build + Sync + Run
```bash
npm run android
# 1. npm run build (compila web bundle)
# 2. npx cap sync android (sincroniza archivos)
# 3. npx cap run android (inicia en emulador/dispositivo)
# ⏱️ ~30-60 segundos la primera vez
```

### Dev mode con config de desarrollo
```bash
npm run android:dev
# Igual a android, pero usa capacitor.config.dev.ts
# Habilita logs, cleartext HTTP, debuggable=true
# Perfecto para desarrollo
```

### Build + Sync (sin correr)
```bash
npm run android:sync
# Solo compila y sincroniza
# Útil si necesitas hacer ajustes en Android Studio
```

### Sync sin build (rápido)
```bash
npm run android:sync:only
# Solo sincroniza archivos web sin recompilar
# ⚡ Más rápido si solo cambiaste TypeScript/CSS
```

### Compilar APK
```bash
npm run android:build
# Ejecuta: gradle build
# Genera: app/build/outputs/apk/
# Output: APK para testing en dispositivo real
```

### Compilar release bundle (AAB)
```bash
npm run android:build:release
# Ejecuta: gradle bundleRelease
# Genera: app/build/outputs/bundle/
# Output: Listo para Google Play Store
```

### Clean build de Android
```bash
npm run android:build:clean
# Ejecuta: gradle clean build
# Elimina artifacts previos
# Útil si el build anterior quedó corrompido
```

### Abrir Android Studio
```bash
npm run android:open
# Abre el proyecto Android en Android Studio
# Equivalente a: npx cap open android
```

### Correr en emulador/dispositivo
```bash
npm run android:run
# Instala y ejecuta la app en el dispositivo conectado
# Equivalente a: npx cap run android
```

### Ver logs de Android
```bash
npm run android:logs
# Muestra logcat en tiempo real
# Filtra por tags de tu app
```

### Debug de Android
```bash
npm run android:debug
# Abre el menu de desarrollo de React Native
# Muestra los logs de la app
```

---

## 🍎 Desarrollo iOS

### Full: Build + Sync + Run
```bash
npm run ios
# 1. npm run build (compila web bundle)
# 2. npx cap sync ios (sincroniza archivos)
# 3. npx cap run ios (inicia en simulator/dispositivo)
# ⏱️ ~30-60 segundos la primera vez
```

### Dev mode con config de desarrollo
```bash
npm run ios:dev
# Igual a ios, pero usa capacitor.config.dev.ts
# Habilita logs, cleartext HTTP, debuggable
# Perfecto para desarrollo
```

### Build + Sync (sin correr)
```bash
npm run ios:sync
# Solo compila y sincroniza
# Útil si necesitas hacer ajustes en Xcode
```

### Sync sin build (rápido)
```bash
npm run ios:sync:only
# Solo sincroniza archivos web sin recompilar
# ⚡ Más rápido si solo cambiaste TypeScript/CSS
```

### Abrir Xcode
```bash
npm run ios:open
# Abre el proyecto iOS en Xcode
# Equivalente a: npx cap open ios
```

### Correr en simulador
```bash
npm run ios:run
# Instala y ejecuta la app en el simulador iOS
# Equivalente a: npx cap run ios
```

### Compilar para iOS
```bash
npm run ios:build
# Ejecuta xcodebuild para compilar
# Genera .app para testing
```

### Ver logs de iOS
```bash
npm run ios:logs
# Muestra logs en tiempo real del simulator/dispositivo
```

---

## 🌐 Desarrollo Web (PWA)

### Iniciar dev server
```bash
npm run web
# Alias para: npm run dev
# Inicia en http://localhost:3001
```

### Build para web
```bash
npm run web:build
# Alias para: npm run build
# Genera PWA bundle optimizado
```

### Build + Preview
```bash
npm run web:preview
# Build + preview en local
# Útil para verificar que el PWA funciona
```

---

## 🛠️ Herramientas Útiles

### Información de Capacitor
```bash
npm run info
# Ejecuta: npx cap doctor
# Muestra:
#   ✅ Versiones de dependencias
#   ✅ Java SDK version
#   ✅ Android SDK version
#   ✅ Xcode version
#   ✅ CocoaPods version
# Útil para diagnosticar problemas de setup
```

### Ver todas las versiones
```bash
npm run info:versions
# Muestra:
#   Node version
#   NPM version
#   Capacitor version
#   TypeScript version
```

### Ver ayuda de scripts
```bash
npm run help
# Muestra lista formateada de todos los comandos disponibles
```

---

## 📋 Flujos de trabajo comunes

### Inicio de sesión de desarrollo
```bash
npm run dev          # Terminal 1: Dev server
# En otra terminal cuando necesites Android:
npm run android:dev  # Build + sync + run en emulador
```

### Cambios rápidos (web)
```bash
npm run dev
# El HMR (Hot Module Reload) actualiza automáticamente
# Cambios en JSX/CSS/TS se ven al instante
```

### Cambios rápidos (nativo)
```bash
npm run dev           # Terminal 1: Dev server
npm run android:sync:only  # Terminal 2: Solo sincroniza cambios rápidos
# Si solo cambiaste TypeScript/CSS, no necesitas full build
```

### Lanzar APK a Play Store
```bash
npm run build              # Build final
npm run android:build:release  # Compilar AAB
# Sube dist/android/app/build/outputs/bundle/release/app.aab a Google Play Console
```

### Lanzar app a App Store
```bash
npm run build          # Build final
npm run ios:build      # Compilar para iOS
# Abre Xcode, configura signing, archive y upload
```

### Debugging de problemas
```bash
npm run type-check     # Verificar tipos
npm run build:report   # Ver tamaño de bundle
npm run info           # Ver diagnóstico de setup
npm run dev:debug      # Dev con todos los logs
```

---

## 🔄 Sincronización de Capacitor

### Actualizar todas las dependencias nativas
```bash
npm run cap:update
# Sincroniza versiones de iOS/Android
# Ejecuta copy.copy
# Actualiza archivos nativos desde dist/
```

### Solo sincronizar Android
```bash
npm run android:sync:only
```

### Solo sincronizar iOS
```bash
npm run ios:sync:only
```

### Ver estado de Capacitor
```bash
npm run info
# Muestra si hay diferencias entre web y nativo
```

---

## ⚡ Tips & Tricks

### Desarrollo más rápido
```bash
# Opción 1: Usar sync:only en lugar de full build
npm run android:sync:only  # ~5 segundos vs ~30

# Opción 2: Evitar npm run build en el script
# Usa directamente el dev server:
npm run dev
# Luego en otra terminal:
npx cap sync android
npx cap run android
```

### Limpiar caché agresivamente
```bash
npm run clean:cache
# Luego:
npm run dev
```

### Verificar que todo funciona
```bash
npm run type-check
npm run build
npm run preview
# Verifica tipos, compila y prueba localmente
```

### Debug de bundle size
```bash
npm run build:report
# Ver tamaño total
# Para análisis detallado, usa vite-plugin-visualizer:
npm install -D vite-plugin-visualizer
```

---

## 📊 Comandos por plataforma

### 🤖 Android (Emulador/Dispositivo)
```bash
npm run android              # Full build + run
npm run android:dev          # Dev mode
npm run android:sync         # Build + sync
npm run android:sync:only    # Sync fast
npm run android:build        # Compilar APK
npm run android:build:release # Compilar AAB
npm run android:build:clean  # Clean build
npm run android:open         # Abrir Android Studio
npm run android:run          # Ejecutar en dispositivo
npm run android:logs         # Ver logcat
npm run android:debug        # Abrir dev menu
```

### 🍎 iOS (Simulator/Dispositivo)
```bash
npm run ios              # Full build + run
npm run ios:dev          # Dev mode
npm run ios:sync         # Build + sync
npm run ios:sync:only    # Sync fast
npm run ios:build        # Compilar
npm run ios:open         # Abrir Xcode
npm run ios:run          # Ejecutar en simulator
npm run ios:logs         # Ver logs
```

### 🌐 Web (Browser)
```bash
npm run dev              # Dev server
npm run dev:debug        # Dev con debug
npm run build            # Build producción
npm run build:report     # Build + size report
npm run preview          # Build + preview local
npm run web:preview      # Alias
```

### 🛠️ Build & Tools
```bash
npm run build            # Build final
npm run build:report     # Build + size
npm run clean            # Limpiar todo
npm run clean:dist       # Limpiar dist/
npm run clean:cache      # Limpiar caché
npm run type-check       # Verificar tipos
npm run lint:ts          # Lint TypeScript
npm run info             # Diagnostico
npm run info:versions    # Versiones
```

---

## ❓ Troubleshooting

### "Module not found" o "Cannot find module"
```bash
npm run clean
# o más agresivo:
npm run clean:cache
```

### Capacitor en estado inconsistente
```bash
npm run cap:update
# O si no funciona:
npm run clean:dist
npm run build
npm run cap:sync
```

### Android Studio muestra errores
```bash
npm run android:build:clean
# Luego abre Android Studio nuevamente
```

### Dev server no refresca en dispositivo
```bash
# Verificar que el dispositivo vea el servidor:
npm run dev
# Luego en otra terminal:
adb reverse tcp:3001 tcp:3001  # Android
# O verificar dirección IP en iOS
```

### Problemas con TypeScript
```bash
npm run type-check
# Muestra todos los errores de tipo
# Corregilos antes de hacer build
```

---

## 📝 Notas importantes

- **HMR en dev:** Los cambios en JSX/CSS/TS se reflejan automáticamente en el navegador/app
- **Sync es rápido:** `sync:only` no recompila web, solo sincroniza archivos
- **Clean cuando tengas dudas:** Si algo está roto, `npm run clean` casi siempre soluciona
- **Type check en CI:** Usar `npm run lint:ts` para salida machine-readable
- **Debug mode solo dev:** Usar `capacitor.config.dev.ts` para cleartext HTTP y debuggable

---

## 🎯 Resumen rápido

```bash
# Desarrollo web
npm run dev              # Empezar a desarrollar

# Android
npm run android:dev      # Full build + run en emulador

# iOS
npm run ios:dev          # Full build + run en simulator

# Producción
npm run build            # Build optimizado
npm run build:report     # Ver tamaño final

# Limpieza
npm run clean            # Si algo está roto

# Info
npm run help             # Ver todos los comandos
npm run info             # Diagnostico del setup
```

---

**Scripts generados:** 2025-02-13
**Total de comandos:** 50+
**Plataformas soportadas:** Web, Android, iOS

