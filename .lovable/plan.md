
## Plan: Sistema de Roles Jerárquico — Owner / Admin / Usuario

### Contexto actual
El sistema tiene dos roles en `user_roles`: `admin` y `user`. No existe el rol `owner`. La Edge Function `verify-admin` solo devuelve `isAdmin` e `isApproved`. El `AppLayout` muestra todos los módulos a todos los usuarios aprobados, ocultando solo la sección Admin a no-admins.

---

### Definición de roles y módulos por nivel

```text
OWNER (dueño)       → Acceso total a todo
ADMIN (supervisor)  → Operación + Supervisión (sin configuración crítica ni usuarios)
USER (empleado)     → Solo operación básica (POS, caja, ordenes activas)
```

**Módulos por rol:**

| Módulo | User | Admin | Owner |
|--------|------|-------|-------|
| POS / Facturación | ✓ | ✓ | ✓ |
| Caja | ✓ | ✓ | ✓ |
| Mi Menú | ✗ | ✓ | ✓ |
| Proveedores | ✗ | ✓ | ✓ |
| Recetas | ✗ | ✓ | ✓ |
| Ingreso inventario | ✗ | ✓ | ✓ |
| Historial Ingresos | ✗ | ✓ | ✓ |
| Kardex | ✗ | ✓ | ✓ |
| Ventas Diarias | ✗ | ✓ | ✓ |
| Utilidad | ✗ | ✓ | ✓ |
| Dashboard | ✗ | ✓ | ✓ |
| Mesas | ✗ | ✓ | ✓ |
| Datos Fiscales | ✗ | ✗ | ✓ |
| Mi Cuenta | ✓ | ✓ | ✓ |
| Supervisión | ✗ | ✓ | ✓ |
| Alertas | ✗ | ✓ | ✓ |
| Timeline | ✗ | ✓ | ✓ |
| Motor Inconsistencias | ✗ | ✓ | ✓ |
| Cámaras | ✗ | ✓ | ✓ |
| Sensores | ✗ | ✓ | ✓ |
| Audio | ✗ | ✓ | ✓ |
| Turnos | ✓ | ✓ | ✓ |
| Reportes | ✗ | ✓ | ✓ |
| Admin: Usuarios | ✗ | ✗ | ✓ |
| Admin: Chat IA | ✗ | ✗ | ✓ |

---

### Cambios técnicos

**1. Base de datos — Migración**
- Agregar `'owner'` al enum `app_role` (actualmente tiene `admin`, `moderator`, `user`)
- Agregar función helper `is_owner(_user_id uuid)` con `SECURITY DEFINER`

**2. Edge Function `verify-admin`**
- Extender la respuesta para incluir `isOwner: boolean` (rol `owner`)
- Mantener `isAdmin` como `role = 'admin' OR role = 'owner'` para compatibilidad

**3. Hook `useUserRole`**
- Añadir estado `isOwner` 
- Retornar `{ isAdmin, isOwner, isApproved, loading, userId }`
- `isAdmin` se mantiene `true` si tiene rol `admin` o `owner` (retrocompatibilidad)

**4. AppLayout**
- Consumir `isOwner` además de `isAdmin`
- Filtrar `navRow1`, `navRow2`, `navSupervision` según rol activo
- Mostrar sección Admin solo si `isOwner`

**5. `AdminUsuarios`**
- Mostrar tres roles: `owner`, `admin`, `user`
- Solo `owner` puede asignar/remover roles
- El owner puede asignar rol `admin` o `user` a otros; nunca puede degradar a otro `owner`
- Agregar selector de rol (dropdown) en lugar del toggle binario actual

**6. `ProtectedRoute`**
- Extender para recibir `requireOwner` prop además de `requireAdmin`
- Rutas `/configuracion-fiscal`, `/admin/*` requieren `requireOwner`

---

### Archivos a modificar/crear

1. **Nueva migración SQL** — Agrega `'owner'` al enum, función `is_owner()`
2. **`supabase/functions/verify-admin/index.ts`** — Devuelve `isOwner`
3. **`src/hooks/useUserRole.ts`** — Añade `isOwner`
4. **`src/components/ProtectedRoute.tsx`** — Soporta `requireOwner`
5. **`src/components/AppLayout.tsx`** — Filtrado de nav por rol
6. **`src/pages/AdminUsuarios.tsx`** — Gestión de 3 roles, solo owner puede cambiar roles
7. **`src/App.tsx`** — Agregar `requireOwner` a rutas sensibles

### Jerarquía visual en Admin
El panel de usuarios mostrará claramente los badges por rol con colores: Owner (dorado), Admin (azul), User (gris). Solo el owner ve los controles de cambio de rol.
