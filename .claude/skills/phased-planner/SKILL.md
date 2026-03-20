---
name: phased-planner
description: Planificación por fases con detalle progresivo para features complejas. Estructura CONTEXT/PLAN/REVISION con seguimiento entre sesiones, verificación de planes existentes, y mantenimiento de decisiones de diseño. Invocar con /phased-planner.
---

# Plan Template

Sistema de 3 archivos para planificar e implementar features complejas con seguimiento entre sesiones.

## Cuándo usar (y cuándo no)

Usar plan-template cuando el cambio tiene 3+ fases, toca 5+ archivos, o cruza capas arquitectónicas. No crear un plan para un fix de 1-2 archivos con un solo commit — la estructura agrega overhead sin valor.

## Estructura

Crear la carpeta del plan dentro de `plans/` en el root del proyecto. Si `plans/` no existe, crearla.

```
plans/<nombre-del-plan>/
├── CONTEXT.md   — Investigación del estado actual (solo hechos)
├── PLAN.md      — Decisiones de diseño y fases de implementación
└── REVISION.md  — Correcciones post-plan o durante ejecución (se crea cuando se necesita)
```

Convención de nombres: kebab-case descriptivo (ej: `plans/auth-middleware-rewrite/`).

## Antes de crear un plan nuevo

Revisar `plans/` buscando planes existentes que **toquen los mismos archivos o área**, sin importar si el objetivo es diferente. Si hay overlap, sugerir al usuario extender el plan existente con nuevas fases en lugar de crear uno nuevo.

Un plan existente ya tiene la investigación (CONTEXT.md) y decisiones de diseño (PLAN.md) sobre esos archivos. Crear un plan separado duplica ese contexto y puede contradecir decisiones ya tomadas.

| Quiero hacer | Ya existe | Acción |
|---|---|---|
| Agregar funcionalidad a un módulo | Plan de refactor sobre ese mismo módulo (in-progress) | Agregar fases al existente |
| Code review de un área | Plan que trabajó sobre esos archivos (done) | Agregar fases de revisión al existente |
| Bug fix en un servicio | Plan de refactor del mismo servicio (done) | Evaluar — si el CONTEXT.md cubre los archivos, extender; si no, plan nuevo |
| Feature en un área completamente distinta | Plan sobre otra área | Plan nuevo |

### Cuándo sí crear un plan nuevo

- Los archivos no se solapan significativamente con planes existentes
- El plan existente está `done` y su CONTEXT.md ya no refleja el código actual (demasiadas fases después)
- El scope es tan diferente que las decisiones de diseño del plan existente no aplican

## Orden de trabajo

1. Revisar `plans/` por planes existentes en la misma área
2. Investigar el código → escribir CONTEXT.md
3. Diseñar la solución → escribir PLAN.md
4. Implementar fase por fase, actualizando PLAN.md al completar cada una
5. Si algo necesita corrección → crear REVISION.md

## CONTEXT.md — Investigación del estado actual

Contiene **solo hechos verificados contra el codebase**. No incluye propuestas ni decisiones de diseño.

Su propósito es evitar re-investigar al retomar el plan en otra sesión. Es un snapshot del momento en que se investigó — el agente debe verificar contra el código real antes de cada fase.

### Secciones

#### Problema

Qué está mal y por qué. Evidencia concreta (archivos, líneas, imports).

#### Estado actual del código

Archivos relevantes, sus tamaños, dependencias, contenido clave.

```markdown
| Archivo | Líneas | Rol | Verificado |
|---------|--------|-----|------------|
| `src/...` | ~N | ... | sí/no |
```

Marcar como **verificado** solo datos leídos directamente del código. Datos estimados o de memoria marcar como **no** — verificar antes de implementar.

#### Consumidores

Archivos que importan o usan lo que se va a cambiar, agrupados por capa. Incluir el impacto esperado del cambio.

```markdown
| Capa | Archivo | Qué importa | Impacto |
|------|---------|-------------|---------|
| hooks | `useX.ts` | `calculateY` | Rompe — firma cambia |
| components | `Panel.tsx` | `useX` | Indirecto — sin cambios |
```

Impacto: **Rompe** (requiere cambios), **Indirecto** (no requiere cambios), **Incierto** (verificar durante implementación). Items marcados Incierto deben resolverse antes de iniciar la fase que los toca.

#### Cobertura de tests

Dato objetivo para la estrategia de tests en PLAN.md.

```markdown
| Archivo afectado | Test directo | Cobertura |
|-----------------|-------------|-----------|
| `src/...` | archivo.test.ts (N tests) | Completa / Indirecta / Sin cobertura |
```

#### Riesgos identificados

```markdown
| Riesgo | Mitigación |
|--------|------------|
| ... | ... |
```

---

## PLAN.md — Decisiones y fases

Contiene el **cómo** resolver. El **qué** y **por qué** están en CONTEXT.md.

### Secciones

#### Encabezado

```markdown
# [Nombre del Plan]

> **Estado**: `draft` | `in-progress` | `done`
```

Un plan en `done` no está cerrado — puede reactivarse con nuevas fases en cualquier momento. `done` significa que no hay fases pendientes, no que el plan terminó para siempre.

#### Contexto

Qué se logra y por qué (2-3 oraciones). Referencia a `CONTEXT.md` para la investigación completa.

#### Scope

```markdown
**Incluye**: ...
**Excluye**: ...
```

#### Decisiones de diseño

Cada decisión documenta la razón y la alternativa descartada.

```markdown
- **[Decisión]**: [razón]. Alternativa descartada: [cuál y por qué].
```

#### Diseño

Cómo queda la solución: qué se crea, qué se transforma, cómo se integra. Adaptar el formato al tipo de cambio:

| Tipo de cambio | Qué documentar |
|---------------|----------------|
| Nuevo módulo/abstracción | Interfaz pública, responsabilidad, dónde se integra |
| Refactor/mover código | Antes vs después (qué se mueve y a dónde) |
| Nuevo flujo de datos | De dónde sale el dato, cómo se transforma, quién lo consume |
| Cambio de API/firma | Firma anterior → firma nueva, consumidores afectados |

Solo lo necesario para implementar. No documentar lo obvio.

#### Estrategia de tests

La verificación varía según el tipo de cambio. Referencia a la sección "Cobertura de tests" de CONTEXT.md.

```markdown
| Fase | Tipo de cambio | Verificación |
|------|---------------|--------------|
| Fase 1 | ... | Compilador / tests existentes / tests nuevos |
```

Criterio para decidir si se necesitan tests nuevos:

```markdown
| Cobertura actual | Tipo de cambio | Acción |
|-----------------|----------------|--------|
| Completa/Indirecta | Mover código | Tests existentes validan |
| Sin cobertura | Solo imports/tipos | Compilador basta |
| Sin cobertura | Mover lógica | Paso previo: escribir tests del comportamiento actual |
```

Regla: si un paso mueve lógica (no solo imports), los tests existentes deben pasar sin modificarlos. Si hay que cambiar un test, es señal de que el refactor alteró comportamiento.

#### Fases

Cada fase agrupa pasos relacionados con un entregable independiente. Cada paso es un checkpoint: tests pasan, lint limpio, commit.

**Detalle progresivo**: solo la fase siguiente a implementar tiene pasos detallados (archivos, tareas concretas). Las fases posteriores tienen solo objetivo, scope y criterio de éxito — se detallan al iniciar, cuando el estado del código es real.

Las fases se pueden agregar conforme avanza el desarrollo. No es necesario definir todas al inicio.

Si al detallar una fase resulta que toca más de 8-10 archivos o requiere más de 3 pasos, considerar dividirla en sub-fases (ej: Fase 3a, Fase 3b). Una fase grande es más difícil de verificar y genera commits demasiado amplios.

```markdown
### Fase 1: [Nombre] (Prioridad [ALTA|MEDIA|BAJA])

[Descripción breve del entregable]

#### Paso 1.1: [Nombre]

- [ ] Tarea
- [ ] Tests
- **Commit**: `tipo: mensaje`

#### Al completar la fase

- [ ] Marcar checkboxes completados, anotar hashes de commits
- [ ] Registrar decisiones que cambiaron vs lo planeado
- [ ] Detallar los pasos de la fase siguiente
- [ ] Actualizar "Estado actual" al fondo del archivo
- **Commit**: `docs: actualizar plan [nombre] con fase N completada`
```

Fases futuras (sin detalle):

```markdown
### Fase 2: [Nombre] (Prioridad [ALTA|MEDIA|BAJA])

**Objetivo**: Qué se logra en esta fase.
**Scope**: Qué archivos/áreas se tocan.
**Criterio de éxito**: Cómo se verifica que la fase está completa.
**Depende de**: Fase 1 (qué cambio afecta esta fase).
```

#### Estado actual

Punto de retoma entre sesiones. Mantener actualizado al cerrar cada fase.

```markdown
**Paso en curso**: --
**Último completado**: --
**Siguiente acción concreta**: --
**Bloqueadores**: --
```

---

## REVISION.md — Correcciones

Se crea cuando algo necesita corrección, ya sea durante la ejecución del plan o después de completarlo. No se crea al inicio.

### Cuándo crear REVISION.md

- Descubres durante una fase que el approach de una fase anterior fue incorrecto
- El plan se completó pero algo no quedó bien
- Necesitas agregar trabajo que no estaba contemplado en el plan original

### Secciones

#### Encabezado

```markdown
# Revisión: [Nombre del Plan]

> **Estado**: `draft` | `in-progress` | `done`

Plan original: `PLAN.md` ([completado|en fase N]).
```

#### Diagnóstico

Qué no quedó bien y por qué. Evidencia concreta.

```markdown
| Problema | Evidencia | Impacto |
|----------|-----------|---------|
| ... | archivo:línea o comportamiento observable | ... |
```

#### Scope de la revisión

```markdown
**Mejora**: ...
**No se toca**: ...
```

#### Decisiones de diseño

Decisiones nuevas o correcciones sobre decisiones del plan original.

#### Fases

La numeración continúa desde el plan original. Mismas reglas de detalle progresivo y checklist al completar.

#### Estado actual

Mismo formato que PLAN.md. Este es el único estado activo cuando REVISION.md existe — no duplicar con PLAN.md.

---

## Mantenimiento del plan

El plan documenta el estado actual del código y las razones detrás de su diseño. No es un changelog — el histórico está en git. El plan siempre debe reflejar la realidad actual.

### Decisiones que cambian

Si una fase posterior invalida una decisión tomada antes, actualizar la sección "Decisiones de diseño" directamente. No marcar como "superada" ni mantener el histórico en el plan — para eso está `git log`.

### Consolidación

Cuando un plan acumula demasiados archivos auxiliares (múltiples revisiones, documentos de análisis) o el CONTEXT/PLAN divergen significativamente del código actual, reescribir ambos con scope reducido. Eliminar archivos obsoletos.

Señales de que un plan necesita consolidación:
- CONTEXT.md describe archivos que ya no existen o cambiaron radicalmente
- Hay múltiples archivos auxiliares (REVISION.md + documentos ad-hoc)
- Las decisiones de diseño contradicen el código implementado

### Extracción

Si una fase resulta ser transversal — aplica más allá del scope del plan original — extraerla a su propio plan con su propio CONTEXT.md y PLAN.md.

---

## Ejemplos

Ver `references/examples.md` para 3 ejemplos concretos que ilustran los flujos principales:
1. **Feature nueva** — detalle progresivo, decisiones que cambian, fases orgánicas
2. **Refactor** — estrategia de tests, consumidores con impacto, código muerto
3. **Extensión de plan existente** — reactivación, scope actualizado, numeración continua

## Instrucciones para el agente

### Antes de cada fase

1. Leer PLAN.md completo para tener el contexto de decisiones y scope
2. Si la fase toca archivos listados en CONTEXT.md, re-verificar esas filas contra el código actual es obligatorio, no opcional
3. Si existe REVISION.md, es la fuente de verdad para el estado actual

### Al completar cada fase

Seguir el checklist "Al completar la fase" de PLAN.md. Esto incluye detallar la fase siguiente y hacer commit del plan actualizado.

### Al retomar entre sesiones

Leer la sección "Estado actual" del archivo activo (PLAN.md o REVISION.md) para saber dónde se quedó el trabajo.
