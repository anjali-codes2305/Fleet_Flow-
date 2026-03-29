import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Truck, Route, Wrench, AlertTriangle } from "lucide-react";

const RealtimeNotifications = () => {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const channel = supabase
      .channel("global-notifications")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "trips" }, (payload) => {
        if (!mountedRef.current) return;
        const trip = payload.new as any;
        const old = payload.old as any;
        if (trip.status !== old.status) {
          if (trip.status === "Completed") {
            toast.success(`Trip completed: ${trip.origin} → ${trip.destination}`, {
              icon: <Route className="w-4 h-4" />,
              duration: 5000,
            });
          } else if (trip.status === "Dispatched") {
            toast.info(`Trip dispatched: ${trip.origin} → ${trip.destination}`, {
              icon: <Route className="w-4 h-4" />,
              duration: 4000,
            });
          } else if (trip.status === "Cancelled") {
            toast.warning(`Trip cancelled: ${trip.origin} → ${trip.destination}`, {
              icon: <AlertTriangle className="w-4 h-4" />,
              duration: 5000,
            });
          }
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "vehicles" }, (payload) => {
        if (!mountedRef.current) return;
        const v = payload.new as any;
        const old = payload.old as any;
        if (v.status !== old.status) {
          if (v.status === "In Shop") {
            toast.warning(`${v.name} moved to maintenance`, {
              icon: <Wrench className="w-4 h-4" />,
              duration: 5000,
            });
          } else if (v.status === "Out of Service") {
            toast.error(`${v.name} is now out of service`, {
              icon: <AlertTriangle className="w-4 h-4" />,
              duration: 6000,
            });
          } else if (v.status === "Available" && old.status === "In Shop") {
            toast.success(`${v.name} back in service!`, {
              icon: <Truck className="w-4 h-4" />,
              duration: 4000,
            });
          }
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "maintenance_logs" }, (payload) => {
        if (!mountedRef.current) return;
        const m = payload.new as any;
        toast.info(`New maintenance: ${m.type} - ${m.description.substring(0, 50)}`, {
          icon: <Wrench className="w-4 h-4" />,
          duration: 4000,
        });
      })
      .subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return null; // This is a headless component
};

export default RealtimeNotifications;
