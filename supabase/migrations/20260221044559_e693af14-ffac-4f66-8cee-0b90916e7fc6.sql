
-- ===== ROLE ENUM =====
CREATE TYPE public.app_role AS ENUM ('manager', 'dispatcher', 'safety_officer', 'financial_analyst');
CREATE TYPE public.vehicle_status AS ENUM ('Available', 'On Trip', 'In Shop', 'Out of Service');
CREATE TYPE public.vehicle_type AS ENUM ('Truck', 'Van', 'Trailer', 'Tanker');
CREATE TYPE public.driver_status AS ENUM ('On Duty', 'Off Duty', 'On Trip', 'Suspended');
CREATE TYPE public.trip_status AS ENUM ('Draft', 'Dispatched', 'Completed', 'Cancelled');
CREATE TYPE public.maintenance_status AS ENUM ('Scheduled', 'In Progress', 'Completed');
CREATE TYPE public.maintenance_type AS ENUM ('Preventive', 'Repair', 'Inspection', 'Tire Service', 'Engine');
CREATE TYPE public.expense_category AS ENUM ('Fuel', 'Maintenance', 'Insurance', 'Toll', 'Other');

-- ===== PROFILES =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ===== USER ROLES =====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Managers can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'manager'));

-- ===== AUTO-CREATE PROFILE + DEFAULT ROLE ON SIGNUP =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'manager');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== VEHICLES =====
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  license_plate TEXT UNIQUE NOT NULL,
  type vehicle_type NOT NULL DEFAULT 'Truck',
  max_capacity INTEGER NOT NULL DEFAULT 10000,
  odometer INTEGER NOT NULL DEFAULT 0,
  status vehicle_status NOT NULL DEFAULT 'Available',
  region TEXT NOT NULL DEFAULT 'North',
  fuel_type TEXT NOT NULL DEFAULT 'Diesel',
  year INTEGER NOT NULL DEFAULT 2024,
  acquisition_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete vehicles" ON public.vehicles FOR DELETE TO authenticated USING (true);

-- ===== DRIVERS =====
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  license_expiry DATE NOT NULL,
  license_category TEXT NOT NULL DEFAULT 'C',
  status driver_status NOT NULL DEFAULT 'On Duty',
  phone TEXT NOT NULL DEFAULT '',
  safety_score INTEGER NOT NULL DEFAULT 100,
  total_trips INTEGER NOT NULL DEFAULT 0,
  total_km INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view drivers" ON public.drivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert drivers" ON public.drivers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update drivers" ON public.drivers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete drivers" ON public.drivers FOR DELETE TO authenticated USING (true);

-- ===== TRIPS =====
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  driver_id UUID NOT NULL REFERENCES public.drivers(id),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  cargo_weight INTEGER NOT NULL DEFAULT 0,
  cargo_description TEXT NOT NULL DEFAULT '',
  status trip_status NOT NULL DEFAULT 'Draft',
  distance INTEGER NOT NULL DEFAULT 0,
  estimated_duration TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dispatched_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view trips" ON public.trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert trips" ON public.trips FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update trips" ON public.trips FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete trips" ON public.trips FOR DELETE TO authenticated USING (true);

-- ===== TRIP DISPATCH TRIGGER: Vehicle+Driver → On Trip =====
CREATE OR REPLACE FUNCTION public.handle_trip_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- On Dispatch
  IF NEW.status = 'Dispatched' AND (OLD.status IS NULL OR OLD.status != 'Dispatched') THEN
    NEW.dispatched_at = now();
    UPDATE public.vehicles SET status = 'On Trip', updated_at = now() WHERE id = NEW.vehicle_id;
    UPDATE public.drivers SET status = 'On Trip', updated_at = now() WHERE id = NEW.driver_id;
  END IF;
  -- On Completion
  IF NEW.status = 'Completed' AND (OLD.status IS NULL OR OLD.status != 'Completed') THEN
    NEW.completed_at = now();
    UPDATE public.vehicles SET status = 'Available', updated_at = now() WHERE id = NEW.vehicle_id;
    UPDATE public.drivers SET status = 'On Duty', updated_at = now() WHERE id = NEW.driver_id;
    UPDATE public.drivers SET total_trips = total_trips + 1, total_km = total_km + NEW.distance WHERE id = NEW.driver_id;
  END IF;
  -- On Cancellation
  IF NEW.status = 'Cancelled' AND OLD.status = 'Dispatched' THEN
    UPDATE public.vehicles SET status = 'Available', updated_at = now() WHERE id = NEW.vehicle_id;
    UPDATE public.drivers SET status = 'On Duty', updated_at = now() WHERE id = NEW.driver_id;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_trip_status_change BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.handle_trip_status_change();

-- ===== TRIP VALIDATION FUNCTION =====
CREATE OR REPLACE FUNCTION public.validate_trip_creation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_max_capacity INTEGER;
  v_status vehicle_status;
  d_status driver_status;
  d_license_expiry DATE;
BEGIN
  SELECT max_capacity, status INTO v_max_capacity, v_status FROM public.vehicles WHERE id = NEW.vehicle_id;
  SELECT status, license_expiry INTO d_status, d_license_expiry FROM public.drivers WHERE id = NEW.driver_id;
  
  IF v_status != 'Available' THEN
    RAISE EXCEPTION 'Vehicle is not available (current status: %)', v_status;
  END IF;
  IF d_status NOT IN ('On Duty') THEN
    RAISE EXCEPTION 'Driver is not on duty (current status: %)', d_status;
  END IF;
  IF d_license_expiry < CURRENT_DATE THEN
    RAISE EXCEPTION 'Driver license has expired on %', d_license_expiry;
  END IF;
  IF NEW.cargo_weight > v_max_capacity THEN
    RAISE EXCEPTION 'Cargo weight (%) exceeds vehicle max capacity (%)', NEW.cargo_weight, v_max_capacity;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_trip_before_insert BEFORE INSERT ON public.trips FOR EACH ROW EXECUTE FUNCTION public.validate_trip_creation();

-- ===== MAINTENANCE LOGS =====
CREATE TABLE public.maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  type maintenance_type NOT NULL DEFAULT 'Preventive',
  description TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  status maintenance_status NOT NULL DEFAULT 'In Progress',
  technician TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view maintenance" ON public.maintenance_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert maintenance" ON public.maintenance_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update maintenance" ON public.maintenance_logs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete maintenance" ON public.maintenance_logs FOR DELETE TO authenticated USING (true);

-- ===== MAINTENANCE → Vehicle "In Shop" auto-logic =====
CREATE OR REPLACE FUNCTION public.handle_maintenance_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('In Progress', 'Scheduled') THEN
    UPDATE public.vehicles SET status = 'In Shop', updated_at = now() WHERE id = NEW.vehicle_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_maintenance_insert AFTER INSERT ON public.maintenance_logs FOR EACH ROW EXECUTE FUNCTION public.handle_maintenance_insert();

-- When maintenance completed, set vehicle back to Available
CREATE OR REPLACE FUNCTION public.handle_maintenance_complete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
    UPDATE public.vehicles SET status = 'Available', updated_at = now() WHERE id = NEW.vehicle_id;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_maintenance_update BEFORE UPDATE ON public.maintenance_logs FOR EACH ROW EXECUTE FUNCTION public.handle_maintenance_complete();

-- ===== FUEL LOGS =====
CREATE TABLE public.fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  liters NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  odometer INTEGER NOT NULL DEFAULT 0,
  station TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view fuel_logs" ON public.fuel_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert fuel_logs" ON public.fuel_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update fuel_logs" ON public.fuel_logs FOR UPDATE TO authenticated USING (true);

-- ===== EXPENSES =====
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  category expense_category NOT NULL DEFAULT 'Other',
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update expenses" ON public.expenses FOR UPDATE TO authenticated USING (true);

-- ===== ENABLE REALTIME =====
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_logs;

-- ===== UPDATED_AT TRIGGER =====
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER set_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
