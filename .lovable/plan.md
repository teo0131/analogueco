

## Separar Pricing pública de la plataforma funcional

Mantener la Pricing Page como home pública (`/`) y la plataforma como área protegida, con redirecciones inteligentes según el estado de sesión.

### Cambios

**1. `src/pages/Pricing.tsx` — Auto-redirect si hay sesión**
- Al montar la página, verificar si existe sesión Supabase activa.
- Si hay sesión → redirigir automáticamente a `/supervision` (no tiene sentido mostrar pricing a un cliente ya logueado).
- Si no hay sesión → mostrar la Pricing Page normal con el botón "Login" arriba a la derecha (ya existe).

**2. `src/pages/Auth.tsx` — Confirmar redirect post-login**
- Verificar que después de iniciar sesión el usuario va a `/supervision` (ya está así, solo confirmar).
- Mantener `/` libre para visitantes nuevos.

**3. Logout desde la plataforma → vuelve a Pricing**
- Revisar dónde está el botón de logout actual (probablemente en `AppLayout.tsx` o `ConfiguracionCuenta.tsx`).
- Asegurar que al hacer signout, el usuario sea redirigido a `/` (Pricing) y no a `/auth`.

**4. Verificación visual**
- Confirmar que `/` carga la Pricing Page para visitantes anónimos.
- Confirmar que el botón "Login" en la esquina superior derecha de Pricing lleva a `/auth`.

### Resultado

| Estado del usuario | Entra a `/` | Ve |
|---|---|---|
| Sin sesión | `/` | Pricing Page con botón Login |
| Con sesión | `/` | Redirigido a `/supervision` |
| Después de login | — | `/supervision` |
| Después de logout | — | `/` (Pricing) |

### Notas técnicas

- Usar `supabase.auth.getSession()` + `onAuthStateChange` en `Pricing.tsx` para el chequeo inicial.
- El redirect debe ejecutarse en `useEffect` con `navigate("/supervision", { replace: true })` para no ensuciar el historial del navegador.
- No tocar `ProtectedRoute.tsx` — sigue funcionando igual para las rutas internas.

