
-- Fix mutable search_path on update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Remove duplicate triggers (keep the ones we created)
DROP TRIGGER IF EXISTS set_drivers_updated_at ON public.drivers;
DROP TRIGGER IF EXISTS set_vehicles_updated_at ON public.vehicles;
