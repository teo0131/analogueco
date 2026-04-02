

# Panel de Super-Admin para AnalogueCo (Aprobación de Comercios)

## Problema actual

Cuando un nuevo dueño de negocio se registra, se crea con `is_approved = false` y ve la pantalla "Pendiente de Aprobación". Pero **no existe ninguna interfaz** para que tú (como dueño de la plataforma AnalogueCo) veas y apruebes estas solicitudes. Actualmente hay 4 comercios pendientes de aprobación en la base de datos.

## Concepto: Super-Admin de Plataforma

Necesitas un rol de **super-admin** que sea independiente de cualquier comercio. Este es el dueño de AnalogueCo como plataforma SaaS, no un dueño de comercio.

## Plan de implementación

### 1. Base de datos - Tabla `platform_admins`

Crear una tabla simple y ultra-privada:

```text
platform_admins
├── id (uuid)
├── user_id (uuid, referencia a auth.users)
└── created_at (timestamp)
```

- RLS: solo los propios platform_admins pueden leer esta tabla (usando una función `SECURITY DEFINER`)
- Se insertará tu usuario como el primer y único platform admin via migración
- Para agregar futuros platform admins, solo se podrá hacer directamente desde el backend (no hay UI para eso, ultra-privado)

### 2. Edge Function - `platform-admin-actions`

- Verificar que el usuario autenticado sea platform_admin
- Endpoints: listar comercios pendientes, aprobar, rechazar (eliminar)
- Usa `SUPABASE_SERVICE_ROLE_KEY` para operar sobre perfiles sin restricciones de RLS

### 3. Nueva página - `/platform/solicitudes`

- Accesible solo si eres platform_admin
- Lista de comercios pendientes con: email del owner, nombre del comercio, fecha de registro
- Botones: Aprobar (pone `is_approved = true`) / Rechazar (elimina comercio + usuario)
- UI minimalista y funcional

### 4. Ruta protegida con verificación de super-admin

- Nuevo componente `PlatformAdminRoute` que verifica contra la tabla `platform_admins`
- Ruta `/platform/solicitudes` solo visible en el sidebar si eres platform admin
- No aparece en el menú de navegación para nadie más

### 5. Tu cuenta

Puedes usar tu cuenta existente (teovallejoe@gmail.com / user_id: ac808997...) como platform admin. No necesitas crear una cuenta separada -- simplemente te registramos en `platform_admins` y tendrás acceso dual: eres owner de "Fraterno Cafe" Y super-admin de la plataforma.

## Secciones técnicas

- La tabla `platform_admins` usa una función `is_platform_admin(user_id)` con `SECURITY DEFINER` para evitar recursión en RLS
- La edge function valida el JWT y cruza contra `platform_admins` antes de ejecutar cualquier acción
- El frontend nunca almacena el estado de super-admin en localStorage (siempre verificación server-side)

