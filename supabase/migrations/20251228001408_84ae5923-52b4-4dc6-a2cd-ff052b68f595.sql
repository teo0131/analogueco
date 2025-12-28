-- Agregar columna pin_seguridad a user_settings
ALTER TABLE public.user_settings 
ADD COLUMN pin_seguridad text DEFAULT NULL;

-- Comentario para documentar el propósito
COMMENT ON COLUMN public.user_settings.pin_seguridad IS 'PIN de 4 dígitos para operaciones sensibles como eliminación';