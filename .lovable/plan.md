# Entregar el código del proyecto como ZIP descargable

## Objetivo
Descartar la conexión a GitHub (no se conectará nada). Entregar todo el código del proyecto en un archivo ZIP para que lo descargues y lo montes donde necesites.

## Estado actual
- El ZIP ya está generado: 222 archivos (código fuente completo, migraciones de base de datos, funciones del backend, logos y configuración), 3.6 MB.
- Contenido: `src/` (toda la app), `supabase/` (funciones y migraciones), `public/`, archivos de configuración (`package.json`, `vite.config.ts`, etc.) y `.env`.
- Excluye lo que no necesitas: `node_modules`, historial de git y cachés.

## Paso pendiente (requiere modo build)
1. Copiar `analogueco-codigo-2026-09-27.zip` a tu sección de archivos descargables (Files).

## Nota
- Las llaves en `.env` son llaves públicas de la app (seguras para compartir con quien tenga acceso al proyecto).
- Los datos de ventas y la base de datos no van en el ZIP: se exportan aparte desde Cloud → Advanced settings → Export data.
