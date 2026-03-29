
-- Create vehicle_locations table for GPS tracking
CREATE TABLE public.vehicle_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed DOUBLE PRECISION NOT NULL DEFAULT 0,
  heading DOUBLE PRECISION NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vehicle_id)
);

-- Enable RLS
ALTER TABLE public.vehicle_locations ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view locations
CREATE POLICY "Authenticated users can view locations"
  ON public.vehicle_locations FOR SELECT
  USING (true);

-- Managers and dispatchers can insert/update locations
CREATE POLICY "Managers and dispatchers can insert locations"
  ON public.vehicle_locations FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'dispatcher'::app_role));

CREATE POLICY "Managers and dispatchers can update locations"
  ON public.vehicle_locations FOR UPDATE
  USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'dispatcher'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_locations;
