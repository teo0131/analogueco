
## Plan: Proveedores ↔ Stock + Órdenes de Compra con WhatsApp Business

### What we're building

Three interconnected features:

1. **Vinculación producto-proveedor**: Cada producto del inventario puede asociarse a un proveedor predeterminado, con el precio habitual de compra.
2. **Panel de stock bajo + Orden de compra**: En Proveedores, se detectan automáticamente los productos con stock bajo vinculados a ese proveedor, y se genera una orden de compra itemizada con cantidades sugeridas.
3. **Envío por WhatsApp Business API**: Con un solo clic de "Aprobar y Enviar", se envía el mensaje de pedido directamente al número del proveedor vía WhatsApp Business API (usando la API de Meta).

---

### Arquitectura

```
productos (tabla existente)
  + proveedor_id (FK → proveedores)       ← nuevo campo
  + precio_compra_habitual (numeric)      ← nuevo campo
  + cantidad_pedido_sugerida (numeric)    ← nuevo campo

ordenes_compra (tabla nueva)
  - id, user_id, proveedor_id, estado ('borrador'|'enviada'|'recibida')
  - mensaje_generado (text)
  - whatsapp_enviado (boolean)
  - created_at, updated_at

detalle_ordenes_compra (tabla nueva)
  - id, orden_id, producto_id
  - cantidad_solicitada, precio_unitario
  - nombre_producto, unidad
```

---

### WhatsApp Business API

Se usa la API oficial de Meta (Cloud API). El flujo es:
1. El usuario configura su **WhatsApp Business Phone Number ID** y **Token de acceso permanente** (desde Meta Business Manager) en Configuración de la plataforma.
2. Se crea una Edge Function `send-whatsapp-order` que recibe el texto del pedido y el número del proveedor y lo envía via `POST https://graph.facebook.com/v19.0/{phone_number_id}/messages`.
3. En la UI, el usuario ve el mensaje pre-generado, puede editarlo, y aprueba con un botón.

---

### Cambios detallados

**Base de datos (2 migraciones)**
- Migración 1: Agregar `proveedor_id`, `precio_compra_habitual`, `cantidad_pedido_sugerida` a tabla `productos`. RLS ya existe.
- Migración 2: Crear tablas `ordenes_compra` y `detalle_ordenes_compra` con RLS por `user_id`.

**Edge Function: `send-whatsapp-order`**
- Recibe `{ numero_destino, mensaje, phone_number_id }` desde el frontend.
- Lee `WHATSAPP_ACCESS_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID` de secrets.
- Llama a la Graph API de Meta y retorna el resultado.

**Configuración de Cuenta (`src/pages/ConfiguracionCuenta.tsx`)**
- Agregar sección "Integración WhatsApp Business" con campos para Phone Number ID y Access Token (guardados en `user_settings`).

**`src/pages/ProveedoresManagement.tsx`** (cambios principales)
- Nueva columna "Productos con stock bajo" por proveedor (badge rojo).
- Botón "Crear Orden" que abre un Sheet lateral con:
  - Lista de productos bajo stock de ese proveedor, con campo de cantidad a pedir.
  - Vista previa del mensaje WhatsApp generado automáticamente en formato texto.
  - Botón "Editar mensaje" para ajustar el texto.
  - Botón "Aprobar y Enviar por WhatsApp" (requiere PIN de administrador).
  - Botón "Solo guardar orden" (sin WhatsApp).

**`src/pages/IngresoUnificado.tsx`** o pantalla de productos
- Al editar un producto/insumo, añadir selector de proveedor predeterminado + precio habitual de compra.

**Secrets requeridos** (el usuario los ingresa una vez):
- `WHATSAPP_ACCESS_TOKEN` — token permanente de Meta
- `WHATSAPP_PHONE_NUMBER_ID` — ID del número emisor de la empresa

---

### Flujo de usuario

```
Módulo Proveedores
  → Ver proveedor → badge "3 productos bajo stock"
  → Clic "Crear Orden de Compra"
  → Sheet: lista de productos con stock actual / stock mínimo / cantidad sugerida
  → Se genera texto del pedido automáticamente:
      "Hola [Proveedor], necesitamos pedido:
       - Tomates: 50 kg
       - Aceite: 10 L
       Por favor confirmar disponibilidad."
  → Usuario edita si necesita
  → Aprobar con PIN → Enviar por WhatsApp
  → Orden queda registrada como "enviada"
```

---

### Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `supabase/migrations/...` | Agregar campos a `productos` |
| `supabase/migrations/...` | Crear `ordenes_compra` + `detalle_ordenes_compra` |
| `supabase/functions/send-whatsapp-order/index.ts` | Nueva edge function |
| `src/pages/ProveedoresManagement.tsx` | Panel de stock bajo + Sheet de orden + envío WA |
| `src/pages/IngresoUnificado.tsx` | Vincular producto a proveedor predeterminado |
| `src/pages/ConfiguracionCuenta.tsx` | Sección config WhatsApp Business |

---

### Antes de implementar

Para la integración de WhatsApp necesitarás proporcionar:
- El **Access Token permanente** de tu Meta Business App
- El **Phone Number ID** de tu número de WhatsApp Business

Se solicitarán de forma segura una vez se apruebe el plan. La UI funciona completamente aunque no se configuren (la orden se guarda igual, el botón de WhatsApp simplemente indica que falta configuración).
