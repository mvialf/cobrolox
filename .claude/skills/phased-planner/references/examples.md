# Ejemplos de Plan Template

Tres escenarios que ilustran los flujos principales del template.

## 1. Feature nueva — Sistema de notificaciones

Plan que arranca desde cero y crece orgánicamente.

### CONTEXT.md (extracto)

```markdown
## Problema

La aplicación no tiene forma de notificar al usuario sobre eventos asíncronos
(procesamiento completado, errores en background, acciones de otros usuarios).

## Estado actual del código

| Archivo | Líneas | Rol | Verificado |
|---------|--------|-----|------------|
| `src/components/Layout.tsx` | ~120 | Layout principal, donde se montaría el contenedor | sí |
| `src/contexts/AppContext.tsx` | ~80 | Contexto global, candidato a hospedar estado | sí |

## Consumidores

| Capa | Archivo | Qué importa | Impacto |
|------|---------|-------------|---------|
| components | `Layout.tsx` | — | Rompe — debe montar NotificationContainer |
| contexts | `AppContext.tsx` | — | Incierto — evaluar si las notificaciones van aquí o en contexto propio |

## Cobertura de tests

| Archivo afectado | Test directo | Cobertura |
|-----------------|-------------|-----------|
| `Layout.tsx` | layout.test.tsx (3 tests) | Indirecta |
| `AppContext.tsx` | app-context.test.tsx (8 tests) | Completa |
```

### PLAN.md (extracto)

```markdown
# Sistema de Notificaciones

> **Estado**: `in-progress`

## Contexto

Agregar notificaciones toast para eventos asíncronos. Ver `CONTEXT.md`.

## Scope

**Incluye**: Modelo de notificación, contexto, componente toast, integración en layout
**Excluye**: Notificaciones push, persistencia en servidor, sonidos

## Decisiones de diseño

- **Contexto propio en vez de AppContext**: Las notificaciones tienen ciclo de vida
  independiente (auto-dismiss, queue). Meterlas en AppContext acoplaría dos concerns.
  Alternativa descartada: extender AppContext — viola SRP.

- **Queue con límite de 3 visibles**: Evita saturar la pantalla. Las notificaciones
  extra se encolan y aparecen cuando las visibles se cierran.

## Fases

### Fase 1: Modelo y contexto (Prioridad ALTA)

#### Paso 1.1: Crear NotificationContext

- [x] Crear `src/contexts/NotificationContext.tsx` con add/dismiss/clear
- [x] Crear tipos `Notification`, `NotificationType`
- [x] Tests del contexto
- **Commit**: `feat: crear NotificationContext con queue` (abc1234)

#### Al completar la fase

- [x] Checkboxes completados
- [x] Decisión que cambió: originalmente el auto-dismiss iba en el contexto,
      se movió al componente Toast porque depende de animación
- [x] Fase 2 detallada abajo
- **Commit**: `docs: actualizar plan notificaciones con fase 1 completada`

### Fase 2: Componente Toast (Prioridad ALTA)

#### Paso 2.1: Crear Toast y NotificationContainer

- [ ] Crear `src/components/notifications/Toast.tsx`
- [ ] Crear `src/components/notifications/NotificationContainer.tsx`
- [ ] Integrar en Layout.tsx
- [ ] Tests de rendering y auto-dismiss
- **Commit**: `feat: componente Toast con auto-dismiss`

### Fase 3: Integrar en flujos existentes (Prioridad MEDIA)

**Objetivo**: Conectar las notificaciones a operaciones asíncronas existentes.
**Scope**: Hooks que hacen llamadas API.
**Criterio de éxito**: Operaciones exitosas y fallidas muestran toast.
**Depende de**: Fase 2 (NotificationContainer montado en layout).

## Estado actual

**Paso en curso**: Paso 2.1
**Último completado**: Fase 1 (abc1234)
**Siguiente acción concreta**: Crear Toast.tsx con variantes por tipo
**Bloqueadores**: --
```

**Qué ilustra**: Detalle progresivo (fase 3 solo tiene objetivo), decisión que cambió durante implementación, fases que se agregan orgánicamente.

---

## 2. Refactor — Extraer lógica de autenticación

Plan que nace de deuda técnica detectada en code review.

### CONTEXT.md (extracto)

```markdown
## Problema

La lógica de autenticación está duplicada en 4 componentes. Cada uno implementa
su propia verificación de token, redirección y manejo de errores. Los bugs se
corrigen en un lugar y no en los otros.

## Estado actual del código

| Archivo | Líneas | Rol | Verificado |
|---------|--------|-----|------------|
| `src/pages/Dashboard.tsx` | ~280 | Verifica token en useEffect | sí |
| `src/pages/Settings.tsx` | ~190 | Misma lógica, copy-paste | sí |
| `src/pages/Profile.tsx` | ~150 | Variante con refresh token | sí |
| `src/pages/Admin.tsx` | ~320 | Variante con verificación de rol | sí |

## Consumidores

| Capa | Archivo | Qué importa | Impacto |
|------|---------|-------------|---------|
| pages | `Dashboard.tsx` | lógica local de auth | Rompe — se extrae a hook |
| pages | `Settings.tsx` | lógica local de auth | Rompe — se extrae a hook |
| pages | `Profile.tsx` | lógica local + refresh | Rompe — se extrae a hook |
| pages | `Admin.tsx` | lógica local + roles | Incierto — roles puede requerir hook separado |

## Cobertura de tests

| Archivo afectado | Test directo | Cobertura |
|-----------------|-------------|-----------|
| `Dashboard.tsx` | dashboard.test.tsx (12 tests) | Completa |
| `Settings.tsx` | -- | Sin cobertura |
| `Profile.tsx` | profile.test.tsx (5 tests) | Indirecta |
| `Admin.tsx` | admin.test.tsx (8 tests) | Completa |
```

### PLAN.md (extracto)

```markdown
# Extraer Lógica de Autenticación

> **Estado**: `in-progress`

## Contexto

Centralizar lógica de auth duplicada en 4 páginas. Ver `CONTEXT.md`.

## Scope

**Incluye**: Extraer hook useAuth, integrar en las 4 páginas, eliminar código muerto
**Excluye**: Cambiar el mecanismo de auth, agregar nuevas funcionalidades

## Decisiones de diseño

- **Un hook useAuth con opciones, no múltiples hooks**: `useAuth({ requireRole?: string })`
  cubre todos los casos. Alternativa descartada: useAuth + useAuthWithRole — duplica
  la lógica base.

## Estrategia de tests

| Fase | Tipo de cambio | Verificación |
|------|---------------|--------------|
| Fase 1 | Crear hook nuevo | Tests nuevos para useAuth |
| Fase 2 | Mover lógica de páginas a hook | Tests existentes deben pasar sin cambios |
| Fase 3 | Eliminar código muerto | Compilador + tests existentes |

## Fases

### Fase 1: Crear useAuth (Prioridad ALTA)

#### Paso 1.1: Hook con tests

- [x] Crear `src/hooks/useAuth.ts` con verificación, redirección y refresh
- [x] Tests unitarios cubriendo todos los escenarios de las 4 páginas
- **Commit**: `feat: crear useAuth centralizando lógica de autenticación` (def5678)

### Fase 2: Integrar en páginas (Prioridad ALTA)

#### Paso 2.1: Dashboard y Settings

- [ ] Reemplazar lógica local por useAuth en Dashboard.tsx
- [ ] Reemplazar lógica local por useAuth en Settings.tsx
- [ ] Verificar que tests existentes de Dashboard pasan sin cambios
- **Commit**: `refactor: integrar useAuth en Dashboard y Settings`

#### Paso 2.2: Profile y Admin

- [ ] Reemplazar lógica local por useAuth en Profile.tsx
- [ ] Reemplazar lógica local por useAuth({ requireRole }) en Admin.tsx
- [ ] Verificar que tests existentes de Admin pasan sin cambios
- **Commit**: `refactor: integrar useAuth en Profile y Admin`

## Estado actual

**Paso en curso**: Paso 2.1
**Último completado**: Fase 1 (def5678)
**Siguiente acción concreta**: Reemplazar useEffect de auth en Dashboard.tsx por useAuth()
**Bloqueadores**: --
```

**Qué ilustra**: Estrategia de tests explícita (tests existentes deben pasar sin cambios al mover lógica), consumidores con impacto claro, item Incierto que se resolvió en decisión de diseño.

---

## 3. Extensión de plan existente — Nuevas fases sobre plan done

Plan completado que se reactiva para agregar funcionalidad relacionada.

### PLAN.md (extracto — solo las partes relevantes)

```markdown
# Sistema de Notificaciones

> **Estado**: `in-progress`

## Scope

**Incluye**: Modelo de notificación, contexto, componente toast, integración en layout,
notificaciones persistentes con historial
**Excluye**: Notificaciones push, sonidos

## Decisiones de diseño

- **Contexto propio en vez de AppContext**: Las notificaciones tienen ciclo de vida
  independiente. Alternativa descartada: extender AppContext.

- **Queue con límite de 3 visibles**: Evita saturar la pantalla.

- **Historial en localStorage, no en servidor**: Para MVP, el historial es local.
  Se migrará a servidor cuando haya backend de notificaciones.
  Alternativa descartada: indexedDB — overkill para una lista simple.

## Fases

### Fase 1: Modelo y contexto (done, abc1234)
### Fase 2: Componente Toast (done, ghi9012)
### Fase 3: Integrar en flujos existentes (done, jkl3456)

### Fase 4: Historial de notificaciones (Prioridad MEDIA)

[Nuevo — agregado al reactivar el plan]

#### Paso 4.1: Persistencia en localStorage

- [ ] Agregar `notificationHistory` al contexto con persist/load
- [ ] Límite de 50 notificaciones, FIFO
- [ ] Tests de persistencia y límite
- **Commit**: `feat: persistir historial de notificaciones en localStorage`

#### Paso 4.2: Panel de historial

- [ ] Crear `NotificationHistory.tsx` con lista scrollable
- [ ] Botón "Ver historial" en NotificationContainer
- [ ] Tests de rendering
- **Commit**: `feat: panel de historial de notificaciones`

## Estado actual

**Paso en curso**: Paso 4.1
**Último completado**: Fase 3 (jkl3456)
**Siguiente acción concreta**: Agregar array notificationHistory al NotificationContext
**Bloqueadores**: --
```

**Qué ilustra**: Plan reactivado (estado vuelve a `in-progress`), scope actualizado para reflejar el nuevo alcance, nueva decisión de diseño agregada, fases completadas colapsadas a una línea, numeración continua.
