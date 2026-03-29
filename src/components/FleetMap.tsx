import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { useVehicleLocations } from "@/hooks/useVehicleLocations";
import { useVehicles } from "@/hooks/useFleetData";
import { useGeofences, useAddGeofenceEvent, isInsideGeofence } from "@/hooks/useGeofences";
import { MapPin, Play, Pause, Shield, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  Available: "#22c55e",
  "On Trip": "#3b82f6",
  "In Shop": "#f59e0b",
  "Out of Service": "#ef4444",
};

function createIcon(status: string) {
  const color = statusColors[status] || "#6b7280";
  return L.divIcon({
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
    </div>`,
  });
}

const FleetMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const circlesRef = useRef<Map<string, L.Circle>>(new Map());
  const prevInsideRef = useRef<Map<string, Set<string>>>(new Map());
  const { locations, loading } = useVehicleLocations();
  const { data: vehicles = [] } = useVehicles();
  const { data: geofences = [] } = useGeofences();
  const addGeofenceEvent = useAddGeofenceEvent();
  const [simulating, setSimulating] = useState(false);
  const [showGeofences, setShowGeofences] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationsRef = useRef(locations);
  locationsRef.current = locations;

  const vehicleMap = useMemo(() => {
    const m = new Map<string, any>();
    (vehicles as any[]).forEach((v) => m.set(v.id, v));
    return m;
  }, [vehicles]);
  const vehicleMapRef = useRef(vehicleMap);
  vehicleMapRef.current = vehicleMap;

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = L.map(mapRef.current, { zoomControl: false }).setView([22.5, 78.5], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 18,
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapInstance.current = map;

    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [loading]);

  // Sync markers with locations
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const current = new Set<string>();

    locations.forEach((loc) => {
      current.add(loc.vehicle_id);
      const vehicle = vehicleMap.get(loc.vehicle_id);
      const name = vehicle?.name || "Unknown";
      const plate = vehicle?.license_plate || "";
      const status = vehicle?.status || "Available";

      const popup = `<div style="font-size:12px;min-width:140px">
        <b>${name}</b><br/><span style="color:#888">${plate}</span>
        <hr style="margin:4px 0;border-color:#eee"/>
        📍 ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}<br/>
        🚀 ${loc.speed} km/h &nbsp; 🧭 ${loc.heading}°<br/>
        📊 ${status}
      </div>`;

      const existing = markersRef.current.get(loc.vehicle_id);
      if (existing) {
        existing.setLatLng([loc.latitude, loc.longitude]);
        existing.setIcon(createIcon(status));
        existing.setPopupContent(popup);
      } else {
        const marker = L.marker([loc.latitude, loc.longitude], { icon: createIcon(status) })
          .bindPopup(popup)
          .addTo(map);
        markersRef.current.set(loc.vehicle_id, marker);
      }
    });

    markersRef.current.forEach((marker, vid) => {
      if (!current.has(vid)) {
        map.removeLayer(marker);
        markersRef.current.delete(vid);
      }
    });

    if (locations.length > 0 && markersRef.current.size === locations.length) {
      const bounds = L.latLngBounds(locations.map((l) => [l.latitude, l.longitude] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 7 });
    }
  }, [locations, vehicleMap]);

  // Draw geofence circles
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Remove old circles
    circlesRef.current.forEach((circle) => map.removeLayer(circle));
    circlesRef.current.clear();

    if (!showGeofences) return;

    geofences.forEach((fence) => {
      if (!fence.is_active) return;
      const circle = L.circle([fence.center_lat, fence.center_lng], {
        radius: fence.radius_km * 1000,
        color: fence.color,
        fillColor: fence.color,
        fillOpacity: 0.08,
        weight: 2,
        dashArray: "8 4",
      }).addTo(map);

      circle.bindPopup(`<div style="font-size:12px;">
        <b>🛡️ ${fence.name}</b><br/>
        <span style="color:#888">${fence.description}</span><br/>
        Radius: ${fence.radius_km} km<br/>
        ${fence.alert_on_exit ? "⚠️ Exit alert" : ""} ${fence.alert_on_enter ? "📥 Enter alert" : ""}
      </div>`);

      circlesRef.current.set(fence.id, circle);
    });
  }, [geofences, showGeofences]);

  // Geofence monitoring — check vehicle positions against zones
  useEffect(() => {
    if (geofences.length === 0 || locations.length === 0) return;

    const currentInside = new Map<string, Set<string>>();

    locations.forEach((loc) => {
      const vehicleZones = new Set<string>();
      geofences.forEach((fence) => {
        if (!fence.is_active) return;
        if (isInsideGeofence(loc.latitude, loc.longitude, fence)) {
          vehicleZones.add(fence.id);
        }
      });
      currentInside.set(loc.vehicle_id, vehicleZones);
    });

    // Compare with previous state
    const prev = prevInsideRef.current;
    if (prev.size > 0) {
      currentInside.forEach((zones, vid) => {
        const prevZones = prev.get(vid) || new Set();
        const vehicle = vehicleMap.get(vid);
        const vName = vehicle?.name || "Vehicle";

        // Check exits
        prevZones.forEach((fenceId) => {
          if (!zones.has(fenceId)) {
            const fence = geofences.find((f) => f.id === fenceId);
            if (fence?.alert_on_exit) {
              toast.warning(`⚠️ ${vName} exited "${fence.name}" zone!`, { duration: 6000 });
              const loc2 = locations.find((l) => l.vehicle_id === vid);
              if (loc2) {
                addGeofenceEvent.mutate({
                  vehicle_id: vid,
                  geofence_id: fenceId,
                  event_type: "exit",
                  latitude: loc2.latitude,
                  longitude: loc2.longitude,
                });
              }
            }
          }
        });

        // Check enters
        zones.forEach((fenceId) => {
          if (!prevZones.has(fenceId)) {
            const fence = geofences.find((f) => f.id === fenceId);
            if (fence?.alert_on_enter) {
              toast.info(`📥 ${vName} entered "${fence.name}" zone`, { duration: 4000 });
              const loc2 = locations.find((l) => l.vehicle_id === vid);
              if (loc2) {
                addGeofenceEvent.mutate({
                  vehicle_id: vid,
                  geofence_id: fenceId,
                  event_type: "enter",
                  latitude: loc2.latitude,
                  longitude: loc2.longitude,
                });
              }
            }
          }
        });
      });
    }

    prevInsideRef.current = currentInside;
  }, [locations, geofences, vehicleMap]);

  // Simulation
  const simulateStep = async () => {
    const locs = locationsRef.current;
    const vMap = vehicleMapRef.current;
    for (const loc of locs) {
      const vehicle = vMap.get(loc.vehicle_id);
      if (!vehicle || vehicle.status === "In Shop" || vehicle.status === "Out of Service") continue;

      const headingRad = ((loc.heading + (Math.random() - 0.5) * 30) * Math.PI) / 180;
      const speedKmh = 30 + Math.random() * 40;
      const dist = (speedKmh / 3600) * 5;
      const newLat = loc.latitude + (dist / 111) * Math.cos(headingRad);
      const newLng = loc.longitude + (dist / (111 * Math.cos((loc.latitude * Math.PI) / 180))) * Math.sin(headingRad);

      await supabase
        .from("vehicle_locations")
        .update({
          latitude: newLat,
          longitude: newLng,
          speed: Math.round(speedKmh),
          heading: Math.round((headingRad * 180) / Math.PI),
          updated_at: new Date().toISOString(),
        })
        .eq("vehicle_id", loc.vehicle_id);
    }
  };

  const toggleSimulation = () => {
    if (simulating) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setSimulating(false);
      toast.info("GPS simulation paused");
    } else {
      intervalRef.current = setInterval(simulateStep, 5000);
      setSimulating(true);
      toast.success("GPS simulation started — vehicles move every 5s");
    }
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  if (loading) {
    return (
      <div className="glass-card p-5 h-[400px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading GPS data…</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between p-4 pb-2 bg-card/80">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Live Fleet Tracking</h3>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider ml-2">
            {locations.length} vehicles
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-2 text-[10px]">
            {Object.entries(statusColors).map(([status, color]) => (
              <span key={status} className="flex items-center gap-1 text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                {status}
              </span>
            ))}
          </div>
          <button
            onClick={() => setShowGeofences(!showGeofences)}
            className={`h-7 px-2.5 text-[11px] font-medium rounded-md border transition-all flex items-center gap-1.5 ${
              showGeofences
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-secondary border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="w-3 h-3" />
            Zones
          </button>
          <button
            onClick={toggleSimulation}
            className={`h-7 px-2.5 text-[11px] font-medium rounded-md border transition-all flex items-center gap-1.5 ${
              simulating
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-secondary border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {simulating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {simulating ? "Stop" : "Simulate"}
          </button>
        </div>
      </div>
      <div ref={mapRef} className="h-[420px] w-full" />
    </div>
  );
};

export default FleetMap;
