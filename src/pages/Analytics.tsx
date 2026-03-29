import PageHeader from "@/components/PageHeader";
import KPICard from "@/components/KPICard";
import { useVehicles, useTrips, useExpenses, useFuelLogs, useDrivers } from "@/hooks/useFleetData";
import { Fuel, TrendingUp, DollarSign, Route, Download } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { toast } from "@/hooks/use-toast";

const Analytics = () => {
  const { data: vehicles = [] } = useVehicles();
  const { data: trips = [] } = useTrips();
  const { data: expenses = [] } = useExpenses();
  const { data: fuelLogs = [] } = useFuelLogs();
  const { data: drivers = [] } = useDrivers();

  const totalFuelCost = (fuelLogs as any[]).reduce((s: number, f: any) => s + Number(f.cost), 0);
  const totalMaintenanceCost = (expenses as any[]).filter((e: any) => e.category === "Maintenance").reduce((s: number, e: any) => s + Number(e.amount), 0);
  const totalLiters = (fuelLogs as any[]).reduce((s: number, f: any) => s + Number(f.liters), 0);
  const totalTripKm = (trips as any[]).filter((t: any) => t.status === "Completed").reduce((s: number, t: any) => s + Number(t.distance), 0);
  const avgFuelEfficiency = totalLiters > 0 ? (totalTripKm / totalLiters).toFixed(1) : "N/A";
  const completedTrips = (trips as any[]).filter((t: any) => t.status === "Completed").length;

  // Aggregate fuel cost by month from real data
  const fuelByMonth: Record<string, number> = {};
  (fuelLogs as any[]).forEach((f: any) => {
    const d = new Date(f.date);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    fuelByMonth[key] = (fuelByMonth[key] || 0) + Number(f.cost);
  });
  const monthlyFuelData = Object.entries(fuelByMonth).map(([month, cost]) => ({ month, cost }));
  if (monthlyFuelData.length === 0) monthlyFuelData.push({ month: "No Data", cost: 0 });

  // Cost per vehicle (real data)
  const vehicleCostData = (vehicles as any[]).map((v: any) => {
    const fuelCost = (fuelLogs as any[]).filter((f: any) => f.vehicle_id === v.id).reduce((s: number, f: any) => s + Number(f.cost), 0);
    const maintCost = (expenses as any[]).filter((e: any) => e.vehicle_id === v.id && e.category === "Maintenance").reduce((s: number, e: any) => s + Number(e.amount), 0);
    return { name: v.name.length > 10 ? v.name.split(" ")[0] : v.name, fuel: fuelCost, maintenance: maintCost, total: fuelCost + maintCost };
  }).filter(v => v.total > 0);

  // ROI calculation: (estimated revenue from trips - costs) / acquisition cost
  const roiData = (vehicles as any[]).map((v: any) => {
    const vehicleTrips = (trips as any[]).filter((t: any) => t.vehicle_id === v.id && t.status === "Completed");
    const tripRevenue = vehicleTrips.reduce((s: number, t: any) => s + Number(t.distance) * 2.5, 0); // $2.50/km estimated
    const fuelCost = (fuelLogs as any[]).filter((f: any) => f.vehicle_id === v.id).reduce((s: number, f: any) => s + Number(f.cost), 0);
    const maintCost = (expenses as any[]).filter((e: any) => e.vehicle_id === v.id && e.category === "Maintenance").reduce((s: number, e: any) => s + Number(e.amount), 0);
    const totalCost = fuelCost + maintCost;
    const roi = Number(v.acquisition_cost) > 0 ? ((tripRevenue - totalCost) / Number(v.acquisition_cost) * 100).toFixed(1) : "0";
    return { Vehicle: v.name, "License Plate": v.license_plate, "Acquisition": `$${Number(v.acquisition_cost).toLocaleString()}`, "Revenue": `$${tripRevenue.toLocaleString()}`, "Fuel": `$${fuelCost.toLocaleString()}`, "Maintenance": `$${maintCost.toLocaleString()}`, "Total Cost": `$${totalCost.toLocaleString()}`, "ROI": `${roi}%`, _roi: Number(roi), _fuelCost: fuelCost, _maintCost: maintCost, _totalCost: totalCost, _revenue: tripRevenue, _acquisition: Number(v.acquisition_cost) };
  });

  // Driver performance data for export
  const driverPerformance = (drivers as any[]).map((d: any) => ({
    Driver: d.name, "License": d.license_number, "Category": d.license_category, "Status": d.status,
    "Total Trips": d.total_trips, "Total KM": d.total_km, "Safety Score": d.safety_score,
    "License Expiry": d.license_expiry,
  }));

  const handleExportCSV = () => { exportToCSV(roiData.map(({ Vehicle, "License Plate": lp, Acquisition, Revenue, Fuel, Maintenance, "Total Cost": tc, ROI }) => ({ Vehicle, "License Plate": lp, Acquisition, Revenue, Fuel, Maintenance, "Total Cost": tc, ROI })), "FleetFlow_Vehicle_ROI"); toast({ title: "CSV Exported" }); };
  const handleExportPDF = () => { exportToPDF("Vehicle ROI Report", roiData.map(({ Vehicle, "License Plate": lp, Acquisition, Revenue, Fuel, Maintenance, "Total Cost": tc, ROI }) => ({ Vehicle, "License Plate": lp, Acquisition, Revenue, Fuel, Maintenance, "Total Cost": tc, ROI }))); toast({ title: "PDF Generated" }); };
  const handleExportDriverCSV = () => { exportToCSV(driverPerformance, "FleetFlow_Driver_Performance"); toast({ title: "Driver Report Exported" }); };

  return (
    <div>
      <PageHeader title="Operational Analytics" description="Financial reports and fleet performance metrics" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Est. Revenue" value={`$${(completedTrips > 0 ? roiData.reduce((s, r) => s + r._revenue, 0) : 0).toLocaleString()}`} subtitle="From completed trips" icon={DollarSign} variant="primary" delay={0} />
        <KPICard title="Total Fleet Cost" value={`$${(totalFuelCost + totalMaintenanceCost).toLocaleString()}`} subtitle="Fuel + Maintenance" icon={TrendingUp} delay={0.05} />
        <KPICard title="Fuel Efficiency" value={`${avgFuelEfficiency} km/L`} subtitle={`${totalTripKm.toLocaleString()} km / ${totalLiters.toLocaleString()} L`} icon={Fuel} delay={0.1} />
        <KPICard title="Completed Trips" value={completedTrips} subtitle={`of ${(trips as any[]).length} total`} icon={Route} delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Fuel Cost Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyFuelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 14%, 18%)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 12 }} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
              <Tooltip contentStyle={{ background: "hsl(222, 18%, 11%)", border: "1px solid hsl(222, 14%, 18%)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="cost" stroke="hsl(38, 92%, 50%)" strokeWidth={2.5} dot={{ fill: "hsl(38, 92%, 50%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Cost per Vehicle</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={vehicleCostData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 14%, 18%)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 12 }} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ background: "hsl(222, 18%, 11%)", border: "1px solid hsl(222, 14%, 18%)", borderRadius: 8, fontSize: 12 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="fuel" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} name="Fuel" />
              <Bar dataKey="maintenance" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} name="Maintenance" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Vehicle ROI Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">Vehicle ROI Summary</h3>
            <p className="text-xs text-muted-foreground">Revenue = Completed Trip Distance × $2.50/km</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="h-8 px-3 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-all flex items-center gap-1"><Download className="w-3 h-3" /> CSV</button>
            <button onClick={handleExportPDF} className="h-8 px-3 text-xs font-medium rounded-lg bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 transition-all flex items-center gap-1"><Download className="w-3 h-3" /> PDF</button>
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead><tr className="border-b border-border/50">
              {["Vehicle", "Acquisition", "Revenue", "Fuel Cost", "Maint Cost", "Total Cost", "Est. ROI"].map(h => (
                <th key={h} className="text-left text-[11px] uppercase tracking-wider font-semibold text-muted-foreground px-4 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {roiData.map((r, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 + i * 0.04 }} className="border-b border-border/30 last:border-0 hover:bg-secondary/40 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{r.Vehicle}</td>
                  <td className="px-4 py-3 text-sm">{r.Acquisition}</td>
                  <td className="px-4 py-3 text-sm text-status-available">{r.Revenue}</td>
                  <td className="px-4 py-3 text-sm">{r.Fuel}</td>
                  <td className="px-4 py-3 text-sm">{r.Maintenance}</td>
                  <td className="px-4 py-3 text-sm font-medium">{r["Total Cost"]}</td>
                  <td className="px-4 py-3 text-sm"><span className={r._roi > 0 ? "text-status-available font-semibold" : "text-destructive font-semibold"}>{r.ROI}</span></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Driver Performance Export */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Driver Performance Report</h3>
          <button onClick={handleExportDriverCSV} className="h-8 px-3 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-all flex items-center gap-1"><Download className="w-3 h-3" /> Export CSV</button>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead><tr className="border-b border-border/50">
              {["Driver", "Status", "Trips", "Total KM", "Safety Score", "License Expiry"].map(h => (
                <th key={h} className="text-left text-[11px] uppercase tracking-wider font-semibold text-muted-foreground px-4 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(drivers as any[]).map((d: any, i: number) => (
                <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 + i * 0.03 }} className="border-b border-border/30 last:border-0 hover:bg-secondary/40 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{d.name}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${d.status === "On Duty" ? "bg-status-available/15 text-status-available" : d.status === "On Trip" ? "bg-status-on-trip/15 text-status-on-trip" : d.status === "Suspended" ? "bg-destructive/15 text-destructive" : "bg-secondary text-muted-foreground"}`}>{d.status}</span></td>
                  <td className="px-4 py-3 text-sm">{d.total_trips}</td>
                  <td className="px-4 py-3 text-sm">{d.total_km.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm"><span className={d.safety_score >= 90 ? "text-status-available font-semibold" : d.safety_score >= 80 ? "text-primary font-semibold" : "text-destructive font-semibold"}>{d.safety_score}</span></td>
                  <td className={`px-4 py-3 text-sm ${new Date(d.license_expiry) < new Date() ? "text-destructive font-semibold" : ""}`}>{d.license_expiry}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Analytics;
