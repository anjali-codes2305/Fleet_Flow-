import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Geofence {
  id: string;
  name: string;
  description: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  color: string;
  is_active: boolean;
  alert_on_exit: boolean;
  alert_on_enter: boolean;
  created_at: string;
}

export interface GeofenceEvent {
  id: string;
  vehicle_id: string;
  geofence_id: string;
  event_type: "enter" | "exit";
  latitude: number;
  longitude: number;
  created_at: string;
}

export function useGeofences() {
  return useQuery({
    queryKey: ["geofences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("geofences")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Geofence[];
    },
  });
}

export function useGeofenceEvents(limit = 20) {
  return useQuery({
    queryKey: ["geofence_events", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("geofence_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as GeofenceEvent[];
    },
  });
}

export function useAddGeofence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (geofence: {
      name: string;
      description: string;
      center_lat: number;
      center_lng: number;
      radius_km: number;
      color: string;
      alert_on_exit: boolean;
      alert_on_enter: boolean;
    }) => {
      const { data, error } = await supabase
        .from("geofences")
        .insert(geofence as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["geofences"] }),
  });
}

export function useDeleteGeofence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("geofences").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["geofences"] }),
  });
}

export function useAddGeofenceEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (event: {
      vehicle_id: string;
      geofence_id: string;
      event_type: string;
      latitude: number;
      longitude: number;
    }) => {
      const { data, error } = await supabase
        .from("geofence_events")
        .insert(event as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["geofence_events"] }),
  });
}

// Utility: check if a point is inside a geofence circle
export function isInsideGeofence(
  lat: number,
  lng: number,
  fence: { center_lat: number; center_lng: number; radius_km: number }
): boolean {
  const R = 6371; // Earth radius in km
  const dLat = ((fence.center_lat - lat) * Math.PI) / 180;
  const dLng = ((fence.center_lng - lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat * Math.PI) / 180) *
      Math.cos((fence.center_lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c <= fence.radius_km;
}
