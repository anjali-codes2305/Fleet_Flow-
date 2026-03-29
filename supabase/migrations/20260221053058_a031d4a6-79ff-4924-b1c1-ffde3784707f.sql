
-- Drop and re-create triggers safely (auth trigger already exists)

-- 2. Trip validation on insert
DROP TRIGGER IF EXISTS validate_trip_before_insert ON public.trips;
CREATE TRIGGER validate_trip_before_insert
  BEFORE INSERT ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_trip_creation();

-- 3. Trip status change → update vehicle/driver statuses  
DROP TRIGGER IF EXISTS on_trip_status_change ON public.trips;
CREATE TRIGGER on_trip_status_change
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_trip_status_change();

-- 4. Maintenance insert → vehicle to "In Shop"
DROP TRIGGER IF EXISTS on_maintenance_insert ON public.maintenance_logs;
CREATE TRIGGER on_maintenance_insert
  AFTER INSERT ON public.maintenance_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_maintenance_insert();

-- 5. Maintenance completion → vehicle back to "Available"
DROP TRIGGER IF EXISTS on_maintenance_complete ON public.maintenance_logs;
CREATE TRIGGER on_maintenance_complete
  BEFORE UPDATE ON public.maintenance_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_maintenance_complete();

-- 6. Updated_at triggers
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_drivers_updated_at ON public.drivers;
CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
