
-- Add created_by column to trips for dispatcher-scoped filtering
ALTER TABLE public.trips ADD COLUMN created_by uuid REFERENCES auth.users(id);

-- Backfill existing trips with NULL (manager sees all, so this is fine)

-- Update trips RLS: dispatchers can only see their own trips
DROP POLICY IF EXISTS "Authenticated users can view trips" ON public.trips;

CREATE POLICY "Users can view trips based on role" ON public.trips FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'manager') 
  OR public.has_role(auth.uid(), 'safety_officer')
  OR public.has_role(auth.uid(), 'financial_analyst')
  OR (public.has_role(auth.uid(), 'dispatcher') AND created_by = auth.uid())
);

-- Update trips INSERT to auto-set created_by
DROP POLICY IF EXISTS "Managers and dispatchers can insert trips" ON public.trips;
CREATE POLICY "Managers and dispatchers can insert trips" ON public.trips FOR INSERT TO authenticated
WITH CHECK (
  (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'dispatcher'))
  AND (created_by = auth.uid())
);

-- Update trips UPDATE: dispatchers can only update their own
DROP POLICY IF EXISTS "Managers and dispatchers can update trips" ON public.trips;
CREATE POLICY "Managers and dispatchers can update trips" ON public.trips FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'manager') 
  OR (public.has_role(auth.uid(), 'dispatcher') AND created_by = auth.uid())
);

-- Update trips DELETE: dispatchers can only delete their own
DROP POLICY IF EXISTS "Managers and dispatchers can delete trips" ON public.trips;
CREATE POLICY "Managers and dispatchers can delete trips" ON public.trips FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'manager') 
  OR (public.has_role(auth.uid(), 'dispatcher') AND created_by = auth.uid())
);
