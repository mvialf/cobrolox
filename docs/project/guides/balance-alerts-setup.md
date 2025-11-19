# Configuración de Alertas de Balances

Guía completa para configurar alertas automáticas cuando se detectan inconsistencias en balances de clientes.

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Configuración de Email (Resend)](#configuración-de-email-resend)
3. [Configuración de Slack](#configuración-de-slack)
4. [Tipos de Alertas](#tipos-de-alertas)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## Descripción General

El sistema de alertas envía notificaciones automáticas cuando:

1. **Fallo crítico en recálculo** - Después de 3 reintentos fallidos al crear factura/pago
2. **Reporte diario** - Cuando el job nocturno detecta inconsistencias

### Canales Disponibles

- ✉️ **Email** (Resend) - Para reportes detallados
- 💬 **Slack** (Webhook) - Para alertas en tiempo real
- 📝 **Console** - Fallback si no hay canales configurados

---

## Configuración de Email (Resend)

### 1. Crear Cuenta en Resend

1. Ir a [resend.com](https://resend.com/)
2. Crear cuenta gratuita (100 emails/día)
3. Verificar tu dominio (o usar dominio sandbox para testing)

### 2. Obtener API Key

1. En el dashboard de Resend, ir a **API Keys**
2. Crear nueva API Key
3. Copiar el valor (comienza con `re_...`)

### 3. Configurar Variables de Entorno

Edita tu archivo `.env` o `.env.local`:

```bash
# API Key de Resend (REQUERIDO)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"

# Email FROM (debe ser de tu dominio verificado)
RESEND_FROM_EMAIL="Cobrolox <alerts@tudominio.com>"

# Email del administrador (REQUERIDO para recibir alertas)
ADMIN_EMAIL="admin@tudominio.com"
```

### 4. Verificar Configuración

Ejecuta este comando para probar el envío de emails:

```bash
npx tsx scripts/verify-and-fix-customer-balances.ts
```

Si hay inconsistencias, recibirás un email en `ADMIN_EMAIL`.

---

## Configuración de Slack

### 1. Crear Slack Webhook

1. Ir a tu workspace de Slack
2. Abrir **Apps** → **Manage Apps**
3. Buscar **Incoming Webhooks**
4. Click en **Add to Slack**
5. Seleccionar el canal donde quieres recibir alertas (ej: `#alertas-sistema`)
6. Copiar la **Webhook URL**

### 2. Configurar Variable de Entorno

```bash
# Slack Webhook URL (OPCIONAL)
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX"
```

### 3. Testing

Puedes probar enviando una alerta manualmente:

```typescript
// test-slack-alert.ts
import { sendBalanceCalculationFailureSlack } from "@/lib/alerts/balance-alerts";

await sendBalanceCalculationFailureSlack({
  customerId: "test-123",
  error: "Test error",
  attempts: 3,
  timestamp: new Date(),
});
```

---

## Tipos de Alertas

### 🚨 Alerta Crítica - Fallo en Recálculo

**Cuándo se envía:**

- Después de 3 reintentos fallidos
- Al crear/actualizar factura o pago
- Balance del cliente queda desactualizado

**Canales:**

- Email (si configurado)
- Slack (si configurado)
- Console logs (siempre)

**Ejemplo de email:**

```
🚨 CRITICAL: Balance Calculation Failed (Customer abc-123)

Customer ID: abc-123
Intentos fallidos: 3
Error: Connection timeout to database

⚠️ IMPACTO:
Los balances del cliente están potencialmente desactualizados.

🔧 ACCIÓN REQUERIDA:
1. Revisar logs del servidor
2. Verificar conectividad con DB
3. Ejecutar recálculo manual si es necesario
```

---

### 📊 Reporte Diario - Inconsistencias Detectadas

**Cuándo se envía:**

- Job diario (configurado para 3am)
- Solo si se detectan inconsistencias o errores

**Canales:**

- Email (si configurado)

**Ejemplo de email:**

```
📊 Balance Report: 2 inconsistencies fixed

Resumen:
- Total clientes verificados: 50
- Inconsistencias detectadas: 2
- Corregidas automáticamente: 2

Top Inconsistencias:
┌──────────────┬─────────────────┬──────────────────┬───────────┐
│ RUT          │ Cliente         │ Diferencia       │ Severidad │
├──────────────┼─────────────────┼──────────────────┼───────────┤
│ 76798456-1   │ Cliente ABC     │ $18.967          │ ⚠ Warning │
│ 77673121-8   │ Cliente XYZ     │ $1.126.930       │ ⚠️ CRITICAL│
└──────────────┴─────────────────┴──────────────────┴───────────┘
```

---

## Testing

### Test Local

1. **Crear inconsistencia artificial:**

```bash
# Modificar manualmente un balance en la BD
npx tsx -e "
import { prisma } from '@/lib/db';
const customer = await prisma.customer.findFirst();
await prisma.customer.update({
  where: { id: customer.id },
  data: { balanceVencido: 999999 }
});
"
```

2. **Ejecutar verificación:**

```bash
npx tsx scripts/verify-and-fix-customer-balances.ts
```

3. **Verificar que recibes:**
   - Email en `ADMIN_EMAIL` (si configurado)
   - Mensaje en Slack (si configurado)
   - Output en consola (siempre)

### Test de Fallo Crítico

Para simular un fallo en recálculo:

```typescript
// En desarrollo, puedes modificar temporalmente customer-balance.ts
// para lanzar un error artificial
export async function recalculateCustomerBalances(customerId: string) {
  throw new Error("Test: Simulated database timeout");
}
```

Luego crea una factura y verifica que recibes la alerta crítica.

---

## Troubleshooting

### ❌ No recibo emails

**Verificar:**

1. `RESEND_API_KEY` está correctamente configurada
2. `ADMIN_EMAIL` está definida
3. `RESEND_FROM_EMAIL` usa un dominio verificado en Resend
4. Revisar logs de la aplicación para errores de Resend
5. Verificar cuota de emails en Resend (plan gratuito: 100/día)

**Revisar logs:**

```bash
# Logs del job de verificación
tail -f logs/balance-verification.log

# Logs de la aplicación (Next.js)
npm run dev
```

### ❌ No recibo mensajes de Slack

**Verificar:**

1. `SLACK_WEBHOOK_URL` está correctamente configurada
2. La URL comienza con `https://hooks.slack.com/`
3. El webhook no fue revocado en Slack
4. El canal de Slack todavía existe

**Test manual:**

```bash
curl -X POST \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test desde Cobrolox"}' \
  $SLACK_WEBHOOK_URL
```

### ❌ Alertas se envían demasiado frecuentemente

Si recibes muchas alertas:

1. **Revisar logs** para identificar la causa raíz del problema
2. **Aumentar umbral** de severidad en `verify-and-fix-customer-balances.ts`:

```typescript
severity:
  Math.abs(inc.diff.total) > 500000 || // Aumentar de 100000 a 500000
  Math.abs(inc.diff.vencido) > 250000  // Aumentar de 50000 a 250000
    ? "critical"
    : "warning",
```

3. **Filtrar reportes diarios** para solo enviar si hay errores críticos:

```typescript
// Solo enviar si hay CRITICAL o FAILED
if (
  alerts.some((a) => a.severity === "critical") ||
  fixErrorCount > 0
) {
  await sendDailyInconsistencyReport(...);
}
```

---

## Configuración de Cron Job

### Linux/Mac (usando crontab)

```bash
# Editar crontab
crontab -e

# Agregar línea (ejecutar diario a las 3am)
0 3 * * * cd /path/to/Cobrolox && npx tsx scripts/verify-and-fix-customer-balances.ts >> logs/balance-verification.log 2>&1
```

### Vercel Cron (Producción)

Crear archivo `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/verify-balances",
      "schedule": "0 3 * * *"
    }
  ]
}
```

Crear API route `app/api/cron/verify-balances/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(request: Request) {
  // Verificar autorización de Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { stdout, stderr } = await execAsync(
      "npx tsx scripts/verify-and-fix-customer-balances.ts"
    );

    return NextResponse.json({
      success: true,
      stdout,
      stderr,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
```

---

## Mejores Prácticas

1. **✅ Configurar al menos un canal** (email o Slack)
2. **✅ Probar alertas en staging** antes de producción
3. **✅ Revisar logs regularmente** para detectar patrones
4. **✅ Documentar falsos positivos** y ajustar umbrales
5. **✅ Tener un plan de respuesta** para alertas críticas

---

## Próximos Pasos

- [ ] Agregar soporte para Discord/Telegram
- [ ] Implementar rate limiting para prevenir spam
- [ ] Dashboard de métricas de balances
- [ ] Tabla de "pending retries" para fallos transitorios

---

**¿Preguntas?** Consulta la documentación completa en `docs/project/`
