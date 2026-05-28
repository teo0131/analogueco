## Botón "Cuenta Demo" para tu profesora

Añadir un botón visible en la página de Auth (login y registro) y en el Landing público (Pricing) que permita entrar al sistema con un usuario demo de solo lectura/exploración, sin necesidad de crear cuenta ni recordar credenciales.

### Cómo funcionará

1. **Crear un comercio demo poblado** ("Cafetería Demo AnalogueCo") con datos de ejemplo realistas: productos, recetas, proveedores, algunas órdenes históricas, una factura, empleados ficticios, etc. Así tu profesora verá el flujo completo, no pantallas vacías.
2. **Crear un usuario demo fijo** (ej. `demo@analogueco.app` / contraseña aleatoria larga) ya aprobado, miembro del comercio demo con rol `user` (cajero) — para que pueda navegar todo pero sin riesgo de borrar nada importante de tu comercio real.
3. **Botón "Probar cuenta demo"** en:
   - Página `/auth` (login y registro, debajo de los formularios).
   - Página `/` (Pricing/Landing público), arriba del CTA principal.
4. **Acción del botón**: hace `signInWithPassword` con las credenciales demo hardcodeadas (es seguro porque es un usuario público de demostración) y redirige a `/home`. Aparece un toast: "Estás en modo demostración".
5. **Banner de modo demo**: cuando la sesión activa sea el usuario demo, mostrar un banner discreto arriba ("Cuenta de demostración — los cambios pueden ser reiniciados") para que quede claro que es la demo.

### Protecciones

- El usuario demo tendrá rol `user`, por lo que ya no podrá acceder a rutas de owner (configuración fiscal, admin usuarios, etc.) gracias al `ProtectedRoute requireOwner` existente.
- El PIN admin seguirá bloqueando pagos, eliminar órdenes, cierres de caja, etc., así que tu profesora puede explorar sin romper datos sensibles.
- Opcional (recomendado): un job de "reseteo nocturno" del comercio demo. **No lo incluyo en este plan** para mantener el alcance pequeño; lo añadimos después si lo necesitas.

### Detalles técnicos

- **Migración SQL**: insertar el comercio demo + datos de ejemplo (menú, recetas, proveedores, 3–5 órdenes pasadas, 1 factura, 2 empleados). El `user_id` del demo se creará primero por Auth y luego se enlaza vía `comercio_miembros`.
- **Creación del usuario demo**: como `auth.admin.createUser` requiere `service_role`, se hace mediante una pequeña Edge Function `seed-demo-account` que corre una sola vez (idempotente: si ya existe, no hace nada). La invocas tú una vez desde la consola; no queda expuesta al público.
- **Credenciales en frontend**: email `demo@analogueco.app` y password fija visible en código. Es aceptable porque es una cuenta pública de demo (mismo patrón que usan Linear, Cal.com, etc. para sus demos).
- **Archivos a modificar**:
  - `src/pages/Auth.tsx` → botón "Probar cuenta demo" en ambos tabs.
  - `src/pages/Pricing.tsx` → botón "Ver demo en vivo".
  - `src/components/AppLayout.tsx` → banner condicional cuando el email del usuario sea el demo.
  - Nueva migración con datos seed.
  - Nueva Edge Function `seed-demo-account` (one-shot).

### Lo que NO se hace en este plan

- Reseteo automático de datos del demo (se puede añadir después con un cron).
- Modo "solo lectura" estricto (el rol `user` ya limita lo suficiente; bloquear escrituras al 100% requiere policies adicionales).
- Tour guiado dentro del app.

¿Procedo con esta implementación?