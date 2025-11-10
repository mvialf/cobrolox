# Email Setup con Resend

Guía para configurar el envío de emails con Resend en tu proyecto Cobrolox.

## 📋 ¿Qué Incluye Esta Configuración?

Este template incluye **integración completa con Resend** para:

- ✅ **Recuperación de contraseña** - Emails automáticos con enlaces seguros
- ✅ **Template profesional** - HTML responsive con branding de Cobrolox
- ✅ **Better Auth integrado** - Funciona out-of-the-box con el sistema de auth
- ✅ **Manejo de errores** - Logs detallados y error handling

---

## 🚀 Setup Rápido (5 minutos)

### **Paso 1: Crear Cuenta en Resend**

1. Visita [https://resend.com](https://resend.com)
2. Crea una cuenta gratuita
3. Verifica tu email

**Free Tier:**

- ✅ 3,000 emails/mes gratis
- ✅ 100 emails/día
- ✅ Perfecto para desarrollo y MVPs

### **Paso 2: Obtener API Key**

1. En el dashboard de Resend, ve a **API Keys**
2. Click en **Create API Key**
3. Nombre: `Cobrolox - Production` (o `Dev` para desarrollo)
4. Permisos: **Sending access** (por defecto)
5. Copia la API key (solo se muestra una vez)

⚠️ **Importante:** Guarda la API key en un lugar seguro. No se puede recuperar después.

### **Paso 3: Configurar Variables de Entorno**

Agrega a tu archivo `.env.local`:

```bash
# ============================================
# EMAIL (Resend)
# ============================================

# API Key de Resend para envío de emails
# Obtener en: https://resend.com/api-keys
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**En Vercel (Producción):**

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega `RESEND_API_KEY` con el valor de tu API key
4. Scope: **Production**, **Preview**, y **Development**
5. Re-deploy tu proyecto

### **Paso 4: Verificar Dominio (Opcional - Recomendado)**

Por defecto, los emails se envían desde `mvial@cristaluxspa.cl`. Para usar tu propio dominio:

1. En Resend dashboard, ve a **Domains**
2. Click **Add Domain**
3. Ingresa tu dominio (ej: `cobrolox.com`)
4. Agrega los registros DNS que Resend proporciona
5. Espera verificación (usualmente < 5 minutos)

Una vez verificado, actualiza el remitente en `lib/auth.ts`:

```typescript
// Cambiar de:
from: "Cobrolox <mvial@cristaluxspa.cl>",

// A:
from: "Cobrolox <noreply@tudominio.com>",
```

---

## ✅ Verificar que Funciona

### **Test en Desarrollo:**

1. Inicia tu app: `npm run dev`
2. Ve a `/forgot-password`
3. Ingresa un email válido (de un usuario existente)
4. Revisa la consola del servidor - deberías ver:

```bash
===================================
PASSWORD RESET REQUEST
User: usuario@ejemplo.com
Reset URL: http://localhost:3000/reset-password?token=xxxxx
===================================
Email de reset enviado exitosamente: xxxxxx-xxxx-xxxx
```

5. **Revisa tu email** - deberías recibir el correo en ~5 segundos

### **Si No Recibes el Email:**

**Verifica en Resend Dashboard:**

1. Ve a **Logs** en Resend
2. Busca el email enviado
3. Status posibles:
   - ✅ **Delivered** - Email enviado exitosamente
   - ⏳ **Queued** - En cola (normal, llega en segundos)
   - ❌ **Bounced** - Email inválido o problema
   - ❌ **Failed** - Error en envío

**Problemas comunes:**

| Problema         | Solución                                         |
| ---------------- | ------------------------------------------------ |
| Email no llega   | Revisa spam/junk folder                          |
| API key inválida | Verifica que copiaste la key completa            |
| Error 401        | API key incorrecta o expirada                    |
| Error 422        | Email remitente no verificado (verifica dominio) |
| Rate limit       | Superaste el límite gratuito (3000/mes)          |

---

## 🎨 Personalizar el Template de Email

El template de email está en: `components/emails/reset-password-email.tsx`

### **Cambiar Colores:**

```typescript
// Header background
backgroundColor: "#18181b",  // Negro zinc-900

// CTA Button
backgroundColor: "#18181b",  // Cambiar a tu color de marca
```

### **Cambiar Logo/Branding:**

```typescript
<h1 style={{ color: "#ffffff", fontSize: "24px" }}>
  Cobrolox  {/* Reemplazar con tu marca */}
</h1>
```

O agregar una imagen:

```typescript
<img
  src="https://tudominio.com/logo.png"
  alt="Tu Marca"
  style={{ height: "32px" }}
/>
```

### **Agregar Más Información:**

El template recibe estas props:

```typescript
interface ResetPasswordEmailProps {
  resetUrl: string; // URL con token
  userName?: string; // Nombre del usuario (opcional)
}
```

Puedes extenderlo en `lib/auth.ts`:

```typescript
const emailHtml = renderResetPasswordEmail({
  resetUrl: url,
  userName: user.name,
  // Agregar más datos aquí
});
```

---

## 📊 Monitoreo y Analytics

### **Dashboard de Resend:**

- **Logs:** Ver todos los emails enviados
- **Analytics:** Tasas de apertura, clicks, bounces
- **Domains:** Estado de verificación de dominios
- **API Keys:** Gestionar claves de acceso

### **Métricas Importantes:**

- **Delivery Rate:** % de emails entregados exitosamente
- **Bounce Rate:** % de emails que rebotaron (ideal < 5%)
- **Open Rate:** % de emails abiertos (solo si trackeas opens)

---

## 🔒 Seguridad

### **Variables de Entorno:**

✅ **Hacer:**

- Usar `.env.local` para desarrollo
- Agregar a `.gitignore` (ya incluido)
- Usar Vercel Environment Variables en producción
- Rotar API keys periódicamente

❌ **NO Hacer:**

- Commitear API keys al repositorio
- Compartir API keys en Slack/email
- Usar la misma key en dev y prod

### **Rate Limiting:**

Por defecto, Better Auth NO tiene rate limiting en `/forget-password`. Considera agregar:

```typescript
// lib/rate-limit.ts (ejemplo simple)
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const passwordResetRateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 h"), // 3 intentos por hora
});
```

---

## 📧 Otros Tipos de Emails

Puedes extender el sistema para enviar otros emails:

### **Email de Bienvenida:**

```typescript
// components/emails/welcome-email.tsx
export function renderWelcomeEmail({ userName }: { userName: string }) {
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <h1>Bienvenido, ${userName}!</h1>
        <p>Gracias por unirte a Cobrolox...</p>
      </body>
    </html>
  `;
}
```

Enviar en `lib/auth.ts`:

```typescript
// En hooks.after (después de signup exitoso)
after: createAuthMiddleware(async (ctx) => {
  if (ctx.path === "/sign-up/email") {
    const user = ctx.context.user;

    await resend.emails.send({
      from: "Cobrolox <mvial@cristaluxspa.cl>",
      to: user.email,
      subject: "¡Bienvenido a Cobrolox!",
      html: renderWelcomeEmail({ userName: user.name }),
    });
  }
}),
```

### **Email de Invitación:**

Ya implementado en el sistema. Ver:

- `app/(auth)/invite-user/page.tsx` - UI de invitación
- `app/api/invite/route.ts` - API endpoint
- Template: Implementar similar a reset password

---

## 🧪 Testing

### **Emails de Prueba (Sandbox Mode):**

Resend permite enviar emails a dominios de prueba sin usar tu cuota:

```typescript
// Solo en desarrollo
const testEmail =
  process.env.NODE_ENV === "development"
    ? "delivered@resend.dev" // Email de prueba
    : user.email; // Email real

await resend.emails.send({
  to: testEmail,
  // ...
});
```

### **Verificar HTML Localmente:**

```typescript
// test-email.ts
import { renderResetPasswordEmail } from "@/components/emails/reset-password-email";
import fs from "fs";

const html = renderResetPasswordEmail({
  resetUrl: "http://localhost:3000/reset-password?token=test-123",
  userName: "Usuario de Prueba",
});

fs.writeFileSync("email-preview.html", html);
console.log("Preview guardado en email-preview.html");
```

Ejecutar:

```bash
npx tsx test-email.ts
open email-preview.html  # macOS
xdg-open email-preview.html  # Linux
```

---

## 💰 Costos y Límites

### **Free Tier:**

- 3,000 emails/mes
- 100 emails/día
- Sin tarjeta de crédito requerida
- Ideal para: MVPs, testing, proyectos pequeños

### **Pro Plan ($20/mes):**

- 50,000 emails/mes
- $1 por cada 1,000 emails adicionales
- Analytics avanzado
- Soporte prioritario
- Ideal para: Producción, empresas

### **Comparación con Alternativas:**

| Servicio   | Free Tier   | Costo Pro     | Pros                          |
| ---------- | ----------- | ------------- | ----------------------------- |
| **Resend** | 3,000/mes   | $20/mes → 50k | Simple, moderno, excelente DX |
| SendGrid   | 100/día     | $15/mes → 50k | Maduro, features enterprise   |
| Mailgun    | 1,000/mes   | $35/mes → 50k | Robusto, para volumen alto    |
| AWS SES    | 0.10 USD/1k | Pay-as-you-go | Más barato, más complejo      |

**Recomendación:** Resend es ideal para este template por su simplicidad y DX.

---

## 🔄 Migrar Desde Otro Servicio

### **Desde SendGrid:**

```typescript
// Antes (SendGrid):
import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: user.email,
  from: "noreply@ejemplo.com",
  subject: "Reset Password",
  html: emailHtml,
});

// Después (Resend):
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  to: user.email,
  from: "Cobrolox <noreply@ejemplo.com>",
  subject: "Reset Password",
  html: emailHtml,
});
```

La API es casi idéntica, solo cambia:

1. Instalar `resend` en vez de `@sendgrid/mail`
2. Reemplazar API key
3. Actualizar código de envío (casi 1:1)

---

## 📚 Referencias

- [Resend Documentation](https://resend.com/docs)
- [Resend + Next.js Guide](https://resend.com/docs/send-with-nextjs)
- [Better Auth Email Configuration](https://www.better-auth.com/docs/integrations/email)
- [React Email (templates avanzados)](https://react.email/)

---

## 🆘 Troubleshooting

### **Email no se envía:**

1. Verifica API key en `.env.local`
2. Revisa logs de Resend dashboard
3. Asegúrate de que el servidor esté corriendo
4. Verifica que el email existe en la BD

### **Error: "Invalid API key":**

```bash
Error al enviar email de reset: { message: 'Invalid API key' }
```

**Solución:**

- Genera una nueva API key en Resend
- Copia completa (empieza con `re_`)
- Actualiza `.env.local`
- Reinicia el servidor (`npm run dev`)

### **Email va a spam:**

**Causas comunes:**

- Dominio no verificado
- Contenido detectado como spam
- IP de Resend en blacklist (raro)

**Soluciones:**

- Verifica tu dominio en Resend
- Agrega SPF, DKIM, DMARC records
- Evita palabras spam ("gratis", "urgente", etc.)
- Usa un remitente consistente

### **Logs útiles:**

```typescript
// En lib/auth.ts
console.log("Email enviado exitosamente:", data?.id);
console.error("Error al enviar email:", error);
```

Revisa la terminal del servidor para estos mensajes.

---

## ✅ Checklist de Producción

Antes de lanzar a producción:

- [ ] API key configurada en Vercel
- [ ] Dominio verificado en Resend
- [ ] Template de email personalizado (logo, colores)
- [ ] Emails de prueba enviados exitosamente
- [ ] Monitoring configurado (Resend dashboard)
- [ ] Rate limiting implementado (opcional pero recomendado)
- [ ] Variables de entorno seguras (no en código)
- [ ] Logs de error configurados
- [ ] Plan de Resend evaluado (free vs pro)

---

**¿Problemas?** Abre un issue en el repositorio del template o consulta los logs de Resend.
