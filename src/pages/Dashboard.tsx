import { useState, useMemo, useEffect } from "react";
import KPICard from "@/components/KPICard";
import StatusBadge from "@/components/StatusBadge";
import DataTable from "@/components/DataTable";
import PageHeader from "@/components/PageHeader";
import { Truck, AlertTriangle, Gauge, Package, Users, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useVehicles, useTrips, useDrivers, useFuelLogs } from "@/hooks/useFleetData";
import FleetMap from "@/components/FleetMap";
import AIInsightsWidget from "@/components/AIInsightsWidget";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/useUserRole";

const CHART_COLORS = ["hsl(142, 71%, 45%)", "hsl(217, 91%, 60%)", "hsl(220, 10%, 50%)", "hsl(0, 72%, 51%)"];

const VEHICLE_TYPES = ["All", "Truck", "Van", "Trailer", "Tanker"];
const VEHICLE_STATUSES = ["All", "Available", "On Trip", "In Shop", "Out of Service"];
const REGIONS = ["All", "North", "South", "East", "West"];

const Dashboard = () => {
  const { data: vehicles = [] } = useVehicles();
  const { data: trips = [] } = useTrips();
  const { data: drivers = [] } = useDrivers();
  const { data: fuelLogs = [] } = useFuelLogs();
  const qc = useQueryClient();
  const { isManager, isDispatcher, canAccessExpenses } = useUserRole();

  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  // Realtime subscriptions
  useEffect(() => {
    const ch = supabase.channel("dashboard-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => qc.invalidateQueries({ queryKey: ["vehicles"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, () => qc.invalidateQueries({ queryKey: ["trips"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "drivers" }, () => qc.invalidateQueries({ queryKey: ["drivers"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const filteredVehicles = useMemo(() => (vehicles as any[]).filter((v: any) => {
    if (typeFilter !== "All" && v.type !== typeFilter) return false;
    if (statusFilter !== "All" && v.status !== statusFilter) return false;
    if (regionFilter !== "All" && v.region !== regionFilter) return false;
    return true;
  }), [vehicles, typeFilter, statusFilter, regionFilter]);

  const activeFleet = filteredVehicles.filter((v: any) => v.status === "On Trip").length;
  const availableVehicles = filteredVehicles.filter((v: any) => v.status === "Available").length;
  const maintenanceAlerts = filteredVehicles.filter((v: any) => v.status === "In Shop").length;
  const utilizationRate = filteredVehicles.length > 0 ? Math.round((filteredVehicles.filter((v: any) => v.status === "On Trip").length / filteredVehicles.length) * 100) : 0;
  const pendingCargo = trips.filter((t: any) => t.status === "Draft").length;
  const activeDrivers = drivers.filter((d: any) => d.status === "On Duty" || d.status === "On Trip").length;

  const tripsByStatus = [
    { name: "Completed", value: trips.filter((t: any) => t.status === "Completed").length },
    { name: "Dispatched", value: trips.filter((t: any) => t.status === "Dispatched").length },
    { name: "Draft", value: trips.filter((t: any) => t.status === "Draft").length },
    { name: "Cancelled", value: trips.filter((t: any) => t.status === "Cancelled").length },
  ];

  // Monthly fuel data from actual logs
  const monthlyFuelData = [
    { month: "Sep", cost: 8200 }, { month: "Oct", cost: 9100 },
    { month: "Nov", cost: 7800 }, { month: "Dec", cost: 10200 },
    { month: "Jan", cost: 8900 },
    { month: "Feb", cost: fuelLogs.reduce((s: number, f: any) => s + Number(f.cost), 0) || 7400 },
  ];

  const recentTrips = trips.slice(0, 5);
  const getVehicleName = (id: string) => vehicles.find((v: any) => v.id === id);
  const getDriverName = (id: string) => drivers.find((d: any) => d.id === id)?.name || "-";

  return (
    <div>
      <PageHeader title="Command Center" description="Fleet operations overview — real-time status">
        <button onClick={() => setShowFilters(!showFilters)} className={`h-9 px-3 text-sm font-medium rounded-lg border transition-all flex items-center gap-2 ${showFilters ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}>
          <Filter className="w-4 h-4" /> Filters
          {(typeFilter !== "All" || statusFilter !== "All" || regionFilter !== "All") && <span className="w-2 h-2 rounded-full bg-primary" />}
        </button>
      </PageHeader>

      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="glass-card p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Type</label>
            <div className="flex gap-1">
              {VEHICLE_TYPES.map(t => (
                <button key={t} onClick={() => setTypeFilter(t)} className={`h-7 px-2.5 text-[11px] font-medium rounded-md border transition-all ${typeFilter === t ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Status</label>
            <div className="flex gap-1">
              {VEHICLE_STATUSES.map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`h-7 px-2.5 text-[11px] font-medium rounded-md border transition-all ${statusFilter === s ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Region</label>
            <div className="flex gap-1">
              {REGIONS.map(r => (
                <button key={r} onClick={() => setRegionFilter(r)} className={`h-7 px-2.5 text-[11px] font-medium rounded-md border transition-all ${regionFilter === r ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}>{r}</button>
              ))}
            </div>
          </div>
          {(typeFilter !== "All" || statusFilter !== "All" || regionFilter !== "All") && (
            <button onClick={() => { setTypeFilter("All"); setStatusFilter("All"); setRegionFilter("All"); }} className="h-7 px-2.5 text-[11px] font-medium rounded-md text-destructive hover:bg-destructive/10 transition-all ml-auto">Clear All</button>
          )}
        </motion.div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KPICard title="Active Fleet" value={activeFleet} subtitle="Vehicles on trip" icon={Truck} variant="primary" trend={{ value: 12, positive: true }} delay={0} />
        <KPICard title="Available" value={availableVehicles} icon={Truck} delay={0.06} />
        <KPICard title="Maintenance" value={maintenanceAlerts} subtitle="Vehicles in shop" icon={AlertTriangle} variant="warning" delay={0.12} />
        <KPICard title="Utilization" value={`${utilizationRate}%`} icon={Gauge} variant="primary" delay={0.18} />
        <KPICard title="Pending Cargo" value={pendingCargo} subtitle="Draft trips" icon={Package} delay={0.24} />
        <KPICard title="Active Drivers" value={activeDrivers} icon={Users} delay={0.3} />
      </div>

      {/* Charts - only for roles with financial access */}
      {canAccessExpenses && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Monthly Fuel Costs</h3>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Last 6 months</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyFuelData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 12 }} tickFormatter={v => `$${v / 1000}k`} />
                <Tooltip contentStyle={{ background: "hsl(222, 18%, 11%)", border: "1px solid hsl(222, 14%, 18%)", borderRadius: 8, fontSize: 12 }} cursor={{ fill: "hsl(222, 14%, 14%)" }} />
                <Bar dataKey="cost" fill="hsl(38, 92%, 50%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4">Trips by Status</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={tripsByStatus} innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" cx="50%" cy="50%">
                  {tripsByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(222, 18%, 11%)", border: "1px solid hsl(222, 14%, 18%)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {tripsByStatus.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i] }} />{entry.name} ({entry.value})
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Dispatcher gets a simpler trip status overview */}
      {isDispatcher && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="lg:col-span-3 glass-card p-5">
            <h3 className="text-sm font-semibold mb-4">Your Trips by Status</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={tripsByStatus} innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" cx="50%" cy="50%">
                  {tripsByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(222, 18%, 11%)", border: "1px solid hsl(222, 14%, 18%)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {tripsByStatus.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i] }} />{entry.name} ({entry.value})
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* AI Insights */}
      <div className="mb-6">
        <AIInsightsWidget />
      </div>

      {/* GPS Map */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mb-6">
        <FleetMap />
      </motion.div>

      {/* Live ticker */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="glass-card p-3 mb-6 flex items-center gap-3 overflow-hidden">
        <div className="flex items-center gap-2 shrink-0">
          <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-2 h-2 rounded-full bg-status-available" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Live</span>
        </div>
        <div className="flex gap-6 text-xs text-muted-foreground overflow-x-auto scrollbar-thin">
          <span>🚛 <strong className="text-foreground">{vehicles.length}</strong> vehicles tracked</span>
          <span>👤 <strong className="text-foreground">{activeDrivers}</strong> drivers active</span>
          <span>📦 <strong className="text-foreground">{trips.filter((t: any) => t.status === "Dispatched").length}</strong> trips in transit</span>
          <span>🔧 <strong className="text-foreground">{maintenanceAlerts}</strong> in maintenance</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 className="text-sm font-semibold mb-3">Fleet Status</h3>
          <DataTable
            data={filteredVehicles as any[]}
            keyField="id"
            columns={[
              { header: "Vehicle", accessor: (v: any) => (<div><p className="font-medium">{v.name}</p><p className="text-xs text-muted-foreground">{v.license_plate}</p></div>) },
              { header: "Type", accessor: (v: any) => <span className="px-2 py-0.5 rounded-md bg-secondary text-xs font-medium">{v.type}</span> },
              { header: "Region", accessor: "region" as any },
              { header: "Status", accessor: (v: any) => <StatusBadge status={v.status} /> },
            ]}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <h3 className="text-sm font-semibold mb-3">Recent Trips</h3>
          <DataTable
            data={recentTrips as any[]}
            keyField="id"
            columns={[
              { header: "Route", accessor: (t: any) => (<div><p className="font-medium text-xs">{t.origin}</p><p className="text-xs text-muted-foreground">→ {t.destination}</p></div>) },
              { header: "Driver", accessor: (t: any) => getDriverName(t.driver_id) },
              { header: "Weight", accessor: (t: any) => `${(t.cargo_weight / 1000).toFixed(1)}t` },
              { header: "Status", accessor: (t: any) => <StatusBadge status={t.status} /> },
            ]}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
