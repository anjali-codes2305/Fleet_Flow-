-- Add complaints column to drivers table for tracking safety incidents
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS complaints integer NOT NULL DEFAULT 0;
