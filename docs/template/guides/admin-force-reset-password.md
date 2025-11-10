# Admin-Initiated Password Reset

Sistema completo para que administradores puedan forzar el restablecimiento de contraseña de cualquier usuario.

## 📋 ¿Qué Incluye?

- ✅ **Panel de gestión de usuarios** (`/settings/users`)
- ✅ **Acción "Forzar reset"** desde tabla de usuarios
- ✅ **Email personalizado** que indica que fue el admin quien solicitó el cambio
- ✅ **Permisos de admin** - Solo usuarios con `role = "admin"`
- ✅ **Auditoría** - Logs de quién forzó el reset
- ✅ **UI completa** - Dialog de confirmación, feedback, estados de carga

---

## 🎯 Casos de Uso

1. **Empleado nuevo** → Admin crea cuenta y fuerza creación de primera contraseña
2. **Seguridad comprometida** → Admin fuerza cambio masivo de contraseñas
3. **Usuario bloqueado** → Admin ayuda a usuario que no puede acceder
4. **Políticas corporativas** → Cambios periódicos obligatorios

---

## 🚀 Cómo Usar

### **Como Administrador:**

1. Ir a **Configuración** → **Usuarios** (`/settings/users`)
2. Encontrar al usuario en la tabla
3. Click en menú de acciones (⋮)
4. Seleccionar **"Forzar reset de contraseña"**
5. Confirmar en el dialog
6. ✅ El usuario recibe un email inmediatamente

### **Como Usuario que Recibe el Email:**

1. Recibir email: **"Cambio de contraseña requerido"**
2. Click en el botón **"Crear nueva contraseña"**
3. Crear nueva contraseña (mínimo 8 caracteres)
4. ✅ Login con la nueva contraseña

---

## 🔧 Arquitectura

### **Componentes Creados:**

```
app/
├── settings/users/
│   ├── page.tsx                  # Página principal (Server Component)
│   └── columns.tsx                # Columnas de DataTable + Acciones

components/
├── emails/
│   └── admin-force-reset-email.tsx  # Template de email específico
└── dialogs/admin/
    └── force-reset-password-dialog.tsx  # Dialog de confirmación

app/api/admin/
└── force-reset-password/
    └── route.ts                   # API endpoint POST
```

### **Flujo Completo:**

```
1. Admin click "Forzar reset" → Dispatch custom event
2. Dialog se abre → Usuario confirma
3. POST /api/admin/force-reset-password { userId }
4. API valida:
   - Sesión activa
   - Usuario es admin
   - Usuario target existe
5. API genera token (UUID v4, expira en 1 hora)
6. API guarda token en tabla `verification`
7. API envía email usando Resend
8. Usuario recibe email y resetea contraseña
```

---

## 🔐 Seguridad

### **Validaciones en el API:**

✅ **Autenticación**

```typescript
const session = await auth.api.getSession({ headers: request.headers });
if (!session?.user) return 401;
```

✅ **Autorización (Admin Only)**

```typescript
const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
if (admin?.role !== "admin") return 403;
```

✅ **Validación de Usuario Target**

```typescript
const targetUser = await prisma.user.findUnique({ where: { id: userId } });
if (!targetUser) return 404;
```

✅ **Token Seguro**

- UUID v4 aleatorio
- Expiración: 1 hora
- Almacenado en BD (tabla `verification`)
- Compatible con Better Auth

✅ **Logs de Auditoría**

```typescript
console.log(`Admin ${admin.name} forzó reset de ${targetUser.email}`);
```

### **Protección de Ruta:**

La página `/settings/users` está protegida:

```typescript
// Verificar autenticación
if (!session?.user) redirect("/login");

// Verificar rol admin
if (currentUser?.role !== "admin") redirect("/");
```

---

## 📧 Email Template

Diferencias vs. auto-servicio (`/forgot-password`):

| Campo           | Auto-servicio                | Admin-initiated                     |
| --------------- | ---------------------------- | ----------------------------------- |
| **Subject**     | "Recupera tu contraseña"     | "Cambio de contraseña requerido"    |
| **Tone**        | Informativo                  | Formal/Corporativo                  |
| **Mensaje**     | "Recibimos una solicitud..." | "El administrador ha solicitado..." |
| **CTA**         | "Restablecer contraseña"     | "Crear nueva contraseña"            |
| **Advertencia** | ⓘ Nota de seguridad          | ⚠️ Importante (destacado amarillo)  |

**Personalizacón:**

- Nombre del usuario
- Nombre del admin que forzó el reset
- Link único con token

---

## 🎨 UI/UX

### **Tabla de Usuarios:**

- ✅ Email (con badge si no verificado)
- ✅ Nombre
- ✅ Rol (Admin/Usuario con badge diferenciado)
- ✅ Fecha de creación
- ✅ Menú de acciones

### **Dialog de Confirmación:**

```
┌─────────────────────────────────────┐
│ ⚠️ Forzar reset de contraseña       │
├─────────────────────────────────────┤
│ Estás a punto de forzar el          │
│ restablecimiento de contraseña para:│
│                                     │
│ Juan Pérez                          │
│                                     │
│ El usuario recibirá un email con    │
│ instrucciones...                    │
│                                     │
│        [Cancelar] [Enviar email ⏳] │
└─────────────────────────────────────┘
```

### **Feedback:**

✅ **Success Toast:**

```
✓ Email de reset enviado
  Se ha enviado un email a Juan Pérez para restablecer su contraseña.
```

❌ **Error Toast:**

```
✗ Error al enviar email
  No se pudo enviar el email de reset. Intenta nuevamente.
```

---

## 🧪 Testing

### **Verificar que Funciona:**

1. **Crear usuario admin:**

   ```bash
   # En Prisma Studio o usando script
   UPDATE "user" SET role = 'admin' WHERE email = 'tu@email.com';
   ```

2. **Acceder al panel:**
   - Login como admin
   - Ir a `/settings/users`
   - Verificar que ves todos los usuarios

3. **Forzar reset:**
   - Click en menú de un usuario
   - Forzar reset de contraseña
   - Verificar toast de éxito

4. **Verificar email:**
   - Revisar email del usuario
   - Email debe llegar en ~5 segundos
   - Verificar que el link funciona

5. **Logs del servidor:**
   ```
   Admin [Nombre Admin] (xxx-uuid-xxx) forzó reset de contraseña para user@email.com. Email ID: xxxxxx
   ```

### **Casos de Error:**

| Escenario                                            | Resultado Esperado                     |
| ---------------------------------------------------- | -------------------------------------- |
| Usuario no admin intenta acceder a `/settings/users` | Redirect a `/`                         |
| No hay sesión activa                                 | Redirect a `/login`                    |
| API key de Resend inválida                           | Toast de error "Error al enviar email" |
| Usuario target no existe                             | Toast de error con mensaje específico  |

---

## 📊 Base de Datos

### **Modelo User (ya existente):**

```prisma
model User {
  id     String @id @default(uuid())
  email  String @unique
  name   String
  role   String @default("user")  // "user" | "admin"
  // ...
}
```

### **Tabla Verification (Better Auth):**

```prisma
model Verification {
  id         String   @id @default(uuid())
  identifier String   // email del usuario
  value      String   // token UUID
  expiresAt  DateTime // 1 hora desde creación
  // ...
}
```

El token se genera igual que Better Auth para compatibilidad total.

---

## 🔗 API Reference

### **POST /api/admin/force-reset-password**

**Headers:**

```typescript
Cookie: cobrolox-auth_session.token=xxx  // Sesión activa (automático)
Content-Type: application/json
```

**Body:**

```json
{
  "userId": "uuid-del-usuario"
}
```

**Response Success (200):**

```json
{
  "success": true,
  "message": "Email de reset enviado exitosamente",
  "emailId": "xxxxxx-xxxx-xxxx"
}
```

**Response Errors:**

| Status | Error                                 | Descripción         |
| ------ | ------------------------------------- | ------------------- |
| 401    | "No autenticado"                      | Sin sesión activa   |
| 403    | "No tienes permisos de administrador" | Usuario no es admin |
| 400    | "userId es requerido"                 | Body sin userId     |
| 404    | "Usuario no encontrado"               | userId inválido     |
| 500    | "Error al enviar email"               | Fallo en Resend     |

---

## 🎯 Comparación de Flujos

### **Auto-servicio (/forgot-password):**

```
Usuario → Solicita reset → Email automático → Reset
```

- ✅ Self-service
- ✅ No requiere intervención
- ❌ Usuario debe iniciar el proceso

### **Admin-initiated:**

```
Admin → Selecciona usuario → Fuerza reset → Email al usuario → Reset
```

- ✅ Admin tiene control total
- ✅ Útil para nuevos empleados
- ✅ Útil para emergencias de seguridad
- ❌ Requiere que admin haga la acción

---

## 🚧 Próximas Mejoras (Opcional)

1. **Bulk Actions** - Forzar reset a múltiples usuarios
2. **Filtros avanzados** - Buscar por email, rol, fecha
3. **Desactivar usuarios** - Bloquear acceso sin eliminar
4. **Historial de acciones** - Tabla de auditoría
5. **Notificar al admin** - Cuando usuario completa el reset
6. **Rate limiting** - Limitar intentos de forzar reset

---

## 📚 Referencias

- **Email Template:** `components/emails/admin-force-reset-email.tsx`
- **API Endpoint:** `app/api/admin/force-reset-password/route.ts`
- **Página de Gestión:** `app/settings/users/page.tsx`
- **Dialog:** `components/dialogs/admin/force-reset-password-dialog.tsx`
- **Better Auth Docs:** https://www.better-auth.com/docs
- **Resend Docs:** https://resend.com/docs

---

## ✅ Checklist de Producción

Antes de lanzar:

- [ ] Al menos un usuario tiene `role = "admin"`
- [ ] Resend API key configurada y funcionando
- [ ] Emails de prueba enviados exitosamente
- [ ] Verificado que no-admins no pueden acceder
- [ ] Logs de auditoría funcionando
- [ ] Template de email personalizado con branding
- [ ] Rate limiting considerado (opcional)

---

**¿Problemas?** Verifica los logs del servidor y el Resend dashboard.
