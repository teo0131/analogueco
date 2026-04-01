
# Migración Multi-Tenant — Fase 1: Estructura Base

## Objetivo
Crear la infraestructura base para que AnalogueCo soporte múltiples usuarios por comercio, sin romper nada existente.

## Paso 1: Tabla `comercios` (tenants)
- `id`, `nombre`, `owner_user_id`, `created_at`, `updated_at`
- Representa cada negocio suscrito a AnalogueCo

## Paso 2: Tabla `comercio_miembros` (membresías)
- `id`, `comercio_id`, `user_id`, `rol` (owner/admin/user), `created_at`
- Un usuario pertenece a un comercio con un rol específico
- Reemplaza el uso actual de `user_roles` para roles dentro del comercio

## Paso 3: Migrar datos existentes
- Crear un comercio automático por cada usuario que tenga datos (basado en `user_settings.store_name` o email)
- Asignar cada usuario existente como `owner` de su comercio
- Agregar columna `comercio_id` a `profiles` para saber a qué comercio pertenece el usuario

## Paso 4: Funciones helper
- `get_user_comercio_id(user_id)` → devuelve el comercio_id del usuario (SECURITY DEFINER)
- `has_comercio_role(user_id, role)` → verifica rol dentro del comercio

## Paso 5: Actualizar Auth flow
- Al registrarse un nuevo owner → se crea automáticamente su comercio
- Al ser invitado un empleado → se asocia al comercio existente

## Fases futuras (NO en esta fase):
- Fase 2: Migrar tablas de operación (menu_items, productos, ordenes_pos, etc.) a usar `comercio_id`
- Fase 3: Actualizar RLS policies para filtrar por comercio
- Fase 4: UI de invitación de empleados
- Fase 5: Migrar tablas restantes (RRHH, finanzas, CRM, etc.)

## Principio clave
Todo seguirá funcionando con `user_id` mientras se migra. La columna `comercio_id` se agregará gradualmente y será nullable al inicio para no romper inserts existentes.
