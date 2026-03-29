
-- Drop existing triggers to avoid conflicts, then recreate
DROP TRIGGER IF EXISTS validate_trip_before_insert ON public.trips;
DROP TRIGGER IF EXISTS on_trip_status_change ON public.trips;
DROP TRIGGER IF EXISTS on_maintenance_insert ON public.maintenance_logs;
DROP TRIGGER IF EXISTS on_maintenance_complete ON public.maintenance_logs;
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON public.vehicles;
DROP TRIGGER IF EXISTS update_drivers_updated_at ON public.drivers;

-- 2. Validate trip creation (cargo weight, license expiry, availability)
CREATE TRIGGER validate_trip_before_insert
  BEFORE INSERT ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_trip_creation();

-- 3. Sync vehicle/driver status on trip lifecycle changes
CREATE TRIGGER on_trip_status_change
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_trip_status_change();

-- 4. Auto-set vehicle to "In Shop" on maintenance insert
CREATE TRIGGER on_maintenance_insert
  AFTER INSERT ON public.maintenance_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_maintenance_insert();

-- 5. Return vehicle to "Available" when maintenance completed
CREATE TRIGGER on_maintenance_complete
  BEFORE UPDATE ON public.maintenance_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_maintenance_complete();

-- 6. Auto-update updated_at on vehicles
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 7. Auto-update updated_at on drivers
CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
