import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export function useUserRole() {
  const { user } = useAuth();

  const { data: role, isLoading: loading } = useQuery({
    queryKey: ["userRole", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch user role:", error);
        return null;
      }
      
      return data?.role ?? null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const isManager = role === "manager";
  const isDispatcher = role === "dispatcher";
  const isSafetyOfficer = role === "safety_officer";
  const isFinancialAnalyst = role === "financial_analyst";

  // Permission helpers
  const canAccessMaintenance = isManager || isSafetyOfficer;
  const canAccessExpenses = isManager || isFinancialAnalyst;
  const canAccessAnalytics = isManager || isFinancialAnalyst;
  const canAccessDrivers = true; // all roles can view
  const canEditDrivers = isManager;
  const canEditVehicles = isManager;
  const canCreateTrips = isManager || isDispatcher;

  return {
    role,
    loading,
    isManager,
    isDispatcher,
    isSafetyOfficer,
    isFinancialAnalyst,
    canAccessMaintenance,
    canAccessExpenses,
    canAccessAnalytics,
    canEditDrivers,
    canEditVehicles,
    canCreateTrips,
  };
}
