import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ===== VEHICLES =====
export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vehicle: {
      name: string; model: string; license_plate: string; type: string;
      max_capacity: number; odometer: number; region: string; fuel_type: string;
      year: number; acquisition_cost: number;
    }) => {
      const { data, error } = await supabase.from("vehicles").insert(vehicle as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from("vehicles").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

// ===== DRIVERS =====
export function useDrivers() {
  return useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drivers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (driver: {
      name: string; license_number: string; license_expiry: string;
      license_category: string; phone: string;
    }) => {
      const { data, error } = await supabase.from("drivers").insert(driver as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  });
}

// ===== TRIPS =====
export function useTrips() {
  return useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trips").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (trip: {
      vehicle_id: string; driver_id: string; origin: string; destination: string;
      cargo_weight: number; cargo_description: string; distance: number; estimated_duration: string;
      created_by?: string;
    }) => {
      const { data, error } = await supabase.from("trips").insert(trip as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}

export function useUpdateTripStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase.from("trips").update({ status } as any).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}

// ===== MAINTENANCE =====
export function useMaintenanceLogs() {
  return useQuery({
    queryKey: ["maintenance_logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("maintenance_logs").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddMaintenanceLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: {
      vehicle_id: string; type: string; description: string;
      date: string; cost: number; technician: string;
    }) => {
      const { data, error } = await supabase.from("maintenance_logs").insert(log as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance_logs"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

// ===== FUEL LOGS =====
export function useFuelLogs() {
  return useQuery({
    queryKey: ["fuel_logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fuel_logs").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddFuelLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: {
      vehicle_id: string; date: string; liters: number;
      cost: number; odometer: number; station: string;
    }) => {
      const { data, error } = await supabase.from("fuel_logs").insert(log as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fuel_logs"] }),
  });
}

// ===== EXPENSES =====
export function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (expense: {
      vehicle_id: string; category: string; amount: number;
      date: string; description: string;
    }) => {
      const { data, error } = await supabase.from("expenses").insert(expense as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

// ===== REALTIME SUBSCRIPTIONS =====
export function useRealtimeVehicles(callback: () => void) {
  const channel = supabase.channel("vehicles-changes").on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => callback()).subscribe();
  return () => supabase.removeChannel(channel);
}

export function useRealtimeTrips(callback: () => void) {
  const channel = supabase.channel("trips-changes").on("postgres_changes", { event: "*", schema: "public", table: "trips" }, () => callback()).subscribe();
  return () => supabase.removeChannel(channel);
}
