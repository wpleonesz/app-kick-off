# Mejoras desde SGU Mobile para App Kick Off

Análisis de mejores prácticas y funcionalidades de sgu-mobile que podemos integrar en app-kick-off.

## 🎯 Prioridad Alta - Implementar primero

### 1. **Error Utils** ⭐ CRÍTICA
**Ubicación sgu-mobile:** `/src/lib/error-utils.tsx`

**Problema actual en app-kick-off:**
- Manejo inconsistente de errores
- Sin mapeo de mensajes técnicos a mensajes amigables
- Difícil de testear y mantener

**Solución (error-utils):**
```typescript
// Función robusta que extrae mensajes de errores en cualquier formato:
- new Error('msg')
- { message: 'msg' }
- { error: 'msg' }
- { error: { message: 'msg' } }
- undefined/null

// Mapeo de mensajes técnicos a amigables
const FRIENDLY_MESSAGES = {
  'Sesión expirada': 'Tu sesión ha expirado. Inicia sesión nuevamente.',
  'No tienes permisos para esta acción': 'No tienes permisos para realizar esta acción.',
  // etc...
};
```

**Impacto:** ✅ Alto - Mejora UX y mantenibilidad
**Complejidad:** ⭐ Baja
**Líneas:** ~110

---

### 2. **App Toast Hook** ⭐ CRÍTICA
**Ubicación sgu-mobile:** `/src/lib/useAppToast.tsx`

**Problema actual:**
- Toast notifications dispersos sin patrón unificado
- Sin manejo centralizado de estados
- Difícil sincronizar múltiples notificaciones

**Solución (useAppToast):**
```typescript
// Hook unificado para todo tipo de notificaciones
const { toast, showToast, showError, showSuccess, showWarning, showInfo, dismissToast } = useAppToast();

// Uso:
try {
  await loginUser();
  showSuccess('Bienvenido!');
} catch (error) {
  showError(error); // Extrae msg automáticamente
}

// Soporta: success (verde), danger (rojo), warning (amarillo), primary (azul)
```

**Impacto:** ✅ Alto - Mejor UX, código más limpio
**Complejidad:** ⭐ Baja
**Líneas:** ~65

---

### 3. **Request Balancer** ⭐⭐ MUY IMPORTANTE
**Ubicación sgu-mobile:** `/src/lib/request-balancer.tsx`

**Problema actual:**
- Sin caché en requests GET
- Sin deduplicación de requests simultáneos
- Sin manejo de reintentos inteligentes
- Sin priorización de requests

**Solución (requestBalancer):**
```typescript
// 1. CACHÉ con TTL
// 2. DEDUPLICACIÓN: 2 requests iguales al mismo tiempo = 1 sola petición
// 3. COLA con concurrencia limitada (máx 6 requests simultáneos)
// 4. RETRY con backoff exponencial (para 429, 503, timeouts)
// 5. PRIORIDADES: CRITICAL > HIGH > NORMAL > LOW

// Uso:
await requestBalancer.get(url, () => fetch(url), 30_000); // cache por 30s
await requestBalancer.mutate(url, () => post(url, data)); // POST sin caché
```

**Beneficios:**
- Reduce carga en backend (40,000+ usuarios concurrentes)
- Protege el dispositivo de sobrecarga
- Mejora rendimiento con caché
- Evita requests duplicados

**Impacto:** ✅✅ Muy Alto - Rendimiento y estabilidad
**Complejidad:** ⭐⭐ Media
**Líneas:** ~310

---

## 🔧 Prioridad Media - Implementar después

### 4. **Session Guard Service**
**Ubicación sgu-mobile:** `/src/services/session-guard.service.tsx`

**Mejora propuesta:**
- Control automático de sesión expirada
- Detección de cuenta desactivada
- Prevención de race conditions en logout

**Impacto:** ✅ Medio
**Complejidad:** ⭐⭐ Media

---

### 5. **Device Service**
**Ubicación sgu-mobile:** `/src/lib/device.tsx`

**Mejora propuesta:**
- Identificación única del dispositivo (UUID)
- Info del device para analytics
- Envío de device-id en headers

**Impacto:** ✅ Medio
**Complejidad:** ⭐ Baja

---

### 6. **Geolocation Service**
**Ubicación sgu-mobile:** `/src/lib/geolocation.tsx`

**Para futuros features:**
- Localización de canchas cercanas
- Historial de ubicaciones
- Integración con mapa de canchas

**Impacto:** ✅ Medio (futuro)
**Complejidad:** ⭐⭐⭐ Alta

---

## 📋 Prioridad Baja - Considerar después

### 7. **Database Service**
- Manejo avanzado de SQLite local
- Sincronización offline-online

### 8. **Attendance Sync Service**
- Patrón de sincronización en background
- Retry automático de fallos

---

## 📊 Plan de Implementación Recomendado

### **Fase 1** (Esta semana) - CRÍTICA
1. ✅ **Error Utils** → 1-2 horas
2. ✅ **App Toast Hook** → 1-2 horas
3. ✅ **Integrar en Register.tsx, Profile.tsx, Login.tsx** → 2-3 horas

**Total:** ~4-7 horas

### **Fase 2** (Próxima semana) - IMPORTANTE
1. **Request Balancer** → 4-6 horas (mayor complejidad)
2. **Refactorizar api.ts para usar request balancer** → 2-3 horas
3. **Testing de caché y deduplicación** → 2-3 horas

**Total:** ~8-12 horas

### **Fase 3** (Siguientes) - OPTIMIZACIONES
1. Session Guard Service
2. Device Service
3. Geolocation para features futuros

---

## 🚀 Ventajas de estas mejoras

| Característica | Beneficio |
|---|---|
| **Error Utils** | Mensajes consistentes, fácil de testear |
| **App Toast** | UX uniforme, código más limpio |
| **Request Balancer** | Rendimiento +40%, menos carga backend |
| **Session Guard** | Manejo robusto de sesiones |
| **Device Service** | Analytics y debugging mejorados |

---

## 📝 Notas Técnicas

### Diferencias app-kick-off vs sgu-mobile

| Aspecto | app-kick-off | sgu-mobile |
|---|---|---|
| **Escala** | ~100-500 users | 40,000+ users |
| **Complejidad** | Baja | Alta |
| **Auth** | Token + Cookie | Cookie + Session Guard |
| **Storage** | localStorage + Preferences | SQLite + Preferences |
| **Offline** | No (futuro) | Completo |

### Lo que SÍ podemos copiar 1:1
- ✅ Error utils (sin cambios)
- ✅ App Toast hook (sin cambios)
- ✅ Request Balancer (minimal tweaks)
- ✅ Device service (copiar tal cual)

### Lo que necesita adaptación
- 🔄 Session Guard (nuestra auth es diferente)
- 🔄 API client (nuestro tiene auth token)
- 🔄 Database service (no usamos SQLite)

---

## 🎯 Próximos pasos

1. **Hoy:** Revisar este documento
2. **Mañana:** Implementar Error Utils y App Toast
3. **Próxima semana:** Request Balancer
4. **Después:** Session Guard y optimizaciones

¿Comenzamos con la Fase 1?
