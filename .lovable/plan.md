## Objetivo
Reemplazar el placeholder gris de la "Cámara Caja Principal" en `/camaras` por la imagen subida, simulando una cámara en vivo con su badge "En vivo" y overlays.

## Cambios

### 1. Agregar la imagen al proyecto
- Copiar `user-uploads://Gemini_Generated_Image_qpxwjuqpxwjuqpxw_1.png` a `src/assets/camara-caja-principal-demo.jpg` (o `.png`).

### 2. Editar `src/pages/Camaras.tsx`
- Importar la imagen como módulo ES6:
  ```ts
  import camaraCajaDemo from "@/assets/camara-caja-principal-demo.png";
  ```
- Agregar campo `previewImage` opcional en el objeto de cámara. Solo "Cámara Caja Principal" lo usa por ahora.
- En `CameraCard`:
  - Si `camera.previewImage` existe y `status === 'online'`, renderizar la imagen como `<img>` cubriendo el `aspect-video` (`object-cover w-full h-full`).
  - Encima, mantener overlays existentes en posición absoluta:
    - Badge "En vivo" (esquina superior izquierda) con punto verde pulsante.
    - Botones de Maximizar/Settings (esquina inferior derecha).
    - Pequeño timestamp simulado opcional (ej. "10:34:21") para reforzar la sensación de cámara real.
  - Si no hay `previewImage`, conservar el placeholder actual con ícono `Camera`.

### 3. Sin cambios de backend
Solo es una portada visual de demostración. Las otras 3 cámaras siguen con el placeholder original.

## Archivos afectados
- `src/assets/camara-caja-principal-demo.png` (nuevo)
- `src/pages/Camaras.tsx` (editado)
