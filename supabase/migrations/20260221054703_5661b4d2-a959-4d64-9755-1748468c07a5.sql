
-- Tighten RLS write policies to role-based access
-- All authenticated users can still SELECT (needed for operations)
-- Only managers and dispatchers can INSERT/UPDATE/DELETE

-- VEHICLES: Only managers can modify
DROP POLICY IF EXISTS "Authenticated users can insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Authenticated users can update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Authenticated users can delete vehicles" ON public.vehicles;

CREATE POLICY "Managers can insert vehicles" ON public.vehicles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can update vehicles" ON public.vehicles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can delete vehicles" ON public.vehicles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'manager'));

-- DRIVERS: Only managers can modify
DROP POLICY IF EXISTS "Authenticated users can insert drivers" ON public.drivers;
DROP POLICY IF EXISTS "Authenticated users can update drivers" ON public.drivers;
DROP POLICY IF EXISTS "Authenticated users can delete drivers" ON public.drivers;

CREATE POLICY "Managers can insert drivers" ON public.drivers FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can update drivers" ON public.drivers FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can delete drivers" ON public.drivers FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'manager'));

-- TRIPS: Managers and dispatchers can modify
DROP POLICY IF EXISTS "Authenticated users can insert trips" ON public.trips;
DROP POLICY IF EXISTS "Authenticated users can update trips" ON public.trips;
DROP POLICY IF EXISTS "Authenticated users can delete trips" ON public.trips;

CREATE POLICY "Managers and dispatchers can insert trips" ON public.trips FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'dispatcher'));

CREATE POLICY "Managers and dispatchers can update trips" ON public.trips FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'dispatcher'));

CREATE POLICY "Managers and dispatchers can delete trips" ON public.trips FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'dispatcher'));

-- MAINTENANCE_LOGS: Managers and safety officers can modify
DROP POLICY IF EXISTS "Authenticated users can insert maintenance" ON public.maintenance_logs;
DROP POLICY IF EXISTS "Authenticated users can update maintenance" ON public.maintenance_logs;
DROP POLICY IF EXISTS "Authenticated users can delete maintenance" ON public.maintenance_logs;

CREATE POLICY "Managers can insert maintenance" ON public.maintenance_logs FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'safety_officer'));

CREATE POLICY "Managers can update maintenance" ON public.maintenance_logs FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'safety_officer'));

CREATE POLICY "Managers can delete maintenance" ON public.maintenance_logs FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'manager'));

-- EXPENSES: Managers and financial analysts can modify
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can update expenses" ON public.expenses;

CREATE POLICY "Managers can insert expenses" ON public.expenses FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'financial_analyst'));

CREATE POLICY "Managers can update expenses" ON public.expenses FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'financial_analyst'));

-- FUEL_LOGS: Managers and dispatchers can modify
DROP POLICY IF EXISTS "Authenticated users can insert fuel_logs" ON public.fuel_logs;
DROP POLICY IF EXISTS "Authenticated users can update fuel_logs" ON public.fuel_logs;

CREATE POLICY "Managers can insert fuel_logs" ON public.fuel_logs FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'dispatcher'));

CREATE POLICY "Managers can update fuel_logs" ON public.fuel_logs FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'dispatcher'));
