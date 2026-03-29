-- Geofencing zones table
CREATE TABLE public.geofences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  radius_km DOUBLE PRECISION NOT NULL DEFAULT 50,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  alert_on_exit BOOLEAN NOT NULL DEFAULT true,
  alert_on_enter BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Geofence violation logs
CREATE TABLE public.geofence_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  geofence_id UUID NOT NULL REFERENCES public.geofences(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('enter', 'exit')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofence_events ENABLE ROW LEVEL SECURITY;

-- Policies for geofences
CREATE POLICY "Authenticated users can view geofences"
  ON public.geofences FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers and dispatchers can manage geofences"
  ON public.geofences FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('manager', 'dispatcher'))
  );

CREATE POLICY "Managers and dispatchers can update geofences"
  ON public.geofences FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('manager', 'dispatcher'))
  );

CREATE POLICY "Managers can delete geofences"
  ON public.geofences FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'manager')
  );

-- Policies for geofence events
CREATE POLICY "Authenticated users can view geofence events"
  ON public.geofence_events FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert geofence events"
  ON public.geofence_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime for geofence events
ALTER PUBLICATION supabase_realtime ADD TABLE public.geofence_events;

-- Seed some demo geofence zones
INSERT INTO public.geofences (name, description, center_lat, center_lng, radius_km, color, alert_on_exit, alert_on_enter)
VALUES
  ('Delhi NCR Zone', 'Capital region operational zone', 28.6139, 77.2090, 80, '#3b82f6', true, false),
  ('Mumbai Port Area', 'Mumbai port and logistics hub', 19.0760, 72.8777, 60, '#22c55e', true, true),
  ('Bangalore Tech Park', 'Southern tech corridor zone', 12.9716, 77.5946, 45, '#f59e0b', true, false),
  ('Chennai Industrial', 'East coast industrial belt', 13.0827, 80.2707, 55, '#ef4444', true, true);
