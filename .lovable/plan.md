# Conectar el proyecto a GitHub para análisis e integraciones

## Objetivo
Tener todo el código de AnalogueCo en un repositorio de GitHub propio, con sincronización automática en ambos sentidos, para analizarlo y construir conexiones externas que potencien las funcionalidades.

## Pasos (los haces tú desde la interfaz de Lovable, toma 2 minutos)

1. **Conectar GitHub**: En el editor de Lovable, abre el menú **Plus (+)** en la caja de chat (abajo a la izquierda) → **GitHub** → **Connect project**.
2. **Autorizar**: Autoriza la app de Lovable en tu cuenta de GitHub.
3. **Crear el repositorio**: Elige tu cuenta u organización de GitHub y haz clic en **Create Repository**. Lovable crea el repo con todo el código del proyecto.
4. **Listo**: Desde ahí, cada cambio que hagamos en Lovable se sube automáticamente a GitHub, y lo que subas a GitHub se sincroniza de vuelta a Lovable.

## Alternativa rápida (solo descarga, sin sync)
- Abre el **Code Editor** en Lovable → **Download codebase** (abajo en el árbol de archivos) para bajar un ZIP del código actual.

## Qué podrás hacer después
- Clonar el repo localmente y analizar el código con tus herramientas.
- Crear ramas, pull requests y CI/CD con GitHub Actions.
- Construir integraciones externas contra el backend (Edge Functions, webhooks para cámaras/sensores, etc.).

## Nota técnica
- Los datos de la base de datos no van en el repo: se exportan aparte desde Cloud → Advanced settings → Export data.
- Las llaves y secretos (API keys) nunca se incluyen en el código; se configuran como variables de entorno en cada entorno.
- Si luego quieres que la app misma llame la API de GitHub (automatizaciones, dashboards), existe un conector de GitHub que puedo integrar con una Edge Function — dime si te interesa.
