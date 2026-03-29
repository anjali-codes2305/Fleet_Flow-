import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export interface VehicleLocation {
  id: string;
  vehicle_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  updated_at: string;
}

export function useVehicleLocations() {
  const [locations, setLocations] = useState<VehicleLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from("vehicle_locations")
        .select("*");
      if (!error && data) setLocations(data as VehicleLocation[]);
      setLoading(false);
    };

    fetchLocations();

    const channel = supabase
      .channel("vehicle-locations-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vehicle_locations" },
        (payload) => {
          setLocations((prev) => {
            const updated = payload.new as VehicleLocation;
            const existing = prev.findIndex((l) => l.vehicle_id === updated.vehicle_id);
            if (existing >= 0) {
              const copy = [...prev];
              copy[existing] = updated;
              return copy;
            }
            return [...prev, updated];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { locations, loading };
}
