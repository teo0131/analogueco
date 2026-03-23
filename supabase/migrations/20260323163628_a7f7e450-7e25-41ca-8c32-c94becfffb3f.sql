-- Add PIN column to empleados table for kiosk clock-in/out
ALTER TABLE public.empleados ADD COLUMN IF NOT EXISTS pin text DEFAULT NULL;