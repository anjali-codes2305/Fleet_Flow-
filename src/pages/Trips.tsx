import { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { useTrips, useVehicles, useDrivers, useAddTrip, useUpdateTripStatus } from "@/hooks/useFleetData";
import { Plus, Search, AlertTriangle, ShieldAlert, Play, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Route } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

const statusFilters = ["All", "Draft", "Dispatched", "Completed", "Cancelled"];

const Trips = () => {
  const { data: trips = [], isLoading } = useTrips();
  const { data: vehicles = [] } = useVehicles();
  const { data: drivers = [] } = useDrivers();
  const addTrip = useAddTrip();
  const updateStatus = useUpdateTripStatus();
  const { user } = useAuth();
  const { canCreateTrips, isManager } = useUserRole();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ vehicle_id: "", driver_id: "", origin: "", destination: "", cargo_weight: "", cargo_description: "", distance: "", estimated_duration: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const availableVehicles = useMemo(() => (vehicles as any[]).filter((v: any) => v.status === "Available"), [vehicles]);
  const availableDrivers = useMemo(() => (drivers as any[]).filter((d: any) => d.status === "On Duty"), [drivers]);
  const selectedVehicle = (vehicles as any[]).find((v: any) => v.id === form.vehicle_id);
  const selectedDriver = (drivers as any[]).find((d: any) => d.id === form.driver_id);
  const isExpired = (date: string) => new Date(date) < new Date();

  const filtered = (trips as any[]).filter((t: any) => {
    const matchSearch = t.origin.toLowerCase().includes(search.toLowerCase()) || t.destination.toLowerCase().includes(search.toLowerCase()) || t.cargo_description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts: Record<string, number> = {
    Draft: (trips as any[]).filter((t: any) => t.status === "Draft").length,
    Dispatched: (trips as any[]).filter((t: any) => t.status === "Dispatched").length,
    Completed: (trips as any[]).filter((t: any) => t.status === "Completed").length,
    Cancelled: (trips as any[]).filter((t: any) => t.status === "Cancelled").length,
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.vehicle_id) e.vehicle_id = "Select a vehicle";
    if (!form.driver_id) e.driver_id = "Select a driver";
    if (!form.origin.trim()) e.origin = "Required";
    if (!form.destination.trim()) e.destination = "Required";
    if (!form.cargo_weight || Number(form.cargo_weight) <= 0) e.cargo_weight = "Must be > 0";
    if (selectedVehicle && Number(form.cargo_weight) > selectedVehicle.max_capacity) e.cargo_weight = `Exceeds max capacity of ${selectedVehicle.max_capacity.toLocaleString()} kg`;
    if (selectedDriver && isExpired(selectedDriver.license_expiry)) e.driver_id = `License expired — assignment blocked`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    try {
      await addTrip.mutateAsync({
        vehicle_id: form.vehicle_id, driver_id: form.driver_id, origin: form.origin, destination: form.destination,
        cargo_weight: Number(form.cargo_weight), cargo_description: form.cargo_description,
        distance: Number(form.distance) || 0, estimated_duration: form.estimated_duration || "TBD",
        created_by: user?.id,
      });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setModalOpen(false); setForm({ vehicle_id: "", driver_id: "", origin: "", destination: "", cargo_weight: "", cargo_description: "", distance: "", estimated_duration: "" }); }, 1200);
    } catch (err: any) {
      toast({ title: "Validation Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleStatusChange = async (tripId: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id: tripId, status: newStatus });
      toast({ title: `Trip ${newStatus}`, description: `Status updated successfully` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const getVehicleName = (id: string) => (vehicles as any[]).find((v: any) => v.id === id);
  const getDriverName = (id: string) => (drivers as any[]).find((d: any) => d.id === id)?.name || "-";

  const inputCls = "w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelCls = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block";

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="Trip Dispatcher" description="Manage dispatches, assign vehicles and drivers">
        {canCreateTrips && <button onClick={() => setModalOpen(true)} className="h-9 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:brightness-110 transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> New Trip</button>}
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {(["Draft", "Dispatched", "Completed", "Cancelled"]).map((s, i) => (
          <motion.div key={s} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`glass-card p-3 cursor-pointer transition-all hover:scale-[1.02] ${statusFilter === s ? "ring-1 ring-primary/30" : ""}`}
            onClick={() => setStatusFilter(statusFilter === s ? "All" : s)}>
            <p className="text-2xl font-bold">{statusCounts[s] || 0}</p>
            <StatusBadge status={s} className="scale-90 origin-left" />
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search trips..." className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statusFilters.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`h-9 px-3 text-xs font-medium rounded-lg border transition-all ${statusFilter === s ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}>{s}</button>
          ))}
        </div>
      </div>

      <DataTable data={filtered} keyField="id" columns={[
        { header: "Route", accessor: (t: any) => (<div><p className="font-medium">{t.origin}</p><p className="text-xs text-muted-foreground">→ {t.destination}</p></div>) },
        { header: "Vehicle", accessor: (t: any) => { const v = getVehicleName(t.vehicle_id); return v ? <span>{v.name} <span className="text-muted-foreground text-xs">({v.license_plate})</span></span> : "-"; } },
        { header: "Driver", accessor: (t: any) => getDriverName(t.driver_id) },
        { header: "Cargo", accessor: (t: any) => (<div><p className="text-sm">{(t.cargo_weight / 1000).toFixed(1)}t</p><p className="text-xs text-muted-foreground">{t.cargo_description}</p></div>) },
        { header: "Distance", accessor: (t: any) => `${t.distance} km` },
        { header: "Status", accessor: (t: any) => <StatusBadge status={t.status} /> },
        { header: "Actions", accessor: (t: any) => (
          <div className="flex gap-1">
            {t.status === "Draft" && <button onClick={() => handleStatusChange(t.id, "Dispatched")} className="p-1.5 rounded-md hover:bg-status-dispatched/10 text-status-dispatched" title="Dispatch"><Play className="w-3.5 h-3.5" /></button>}
            {t.status === "Dispatched" && <button onClick={() => handleStatusChange(t.id, "Completed")} className="p-1.5 rounded-md hover:bg-status-available/10 text-status-available" title="Complete"><CheckCircle className="w-3.5 h-3.5" /></button>}
            {(t.status === "Draft" || t.status === "Dispatched") && <button onClick={() => handleStatusChange(t.id, "Cancelled")} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive" title="Cancel"><XCircle className="w-3.5 h-3.5" /></button>}
          </div>
        )},
      ]} />

      {/* New Trip Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div key="s" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-12">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="w-16 h-16 rounded-full bg-status-available/20 flex items-center justify-center mb-4"><Check className="w-8 h-8 text-status-available" /></motion.div>
                <p className="text-lg font-semibold">Trip Created!</p>
                <p className="text-sm text-muted-foreground">Status: Draft — Ready for dispatch</p>
              </motion.div>
            ) : (
              <motion.div key="f" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="p-2 rounded-lg bg-primary/10"><Route className="w-4 h-4 text-primary" /></div>Create New Trip</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div>
                    <label className={labelCls}>Vehicle (Available)</label>
                    <select value={form.vehicle_id} onChange={e => setForm(f => ({...f, vehicle_id: e.target.value}))} className={`${inputCls} appearance-none ${errors.vehicle_id ? "ring-2 ring-destructive/50" : ""}`}>
                      <option value="">Select vehicle...</option>
                      {availableVehicles.map((v: any) => <option key={v.id} value={v.id}>{v.name} — {(v.max_capacity/1000).toFixed(0)}t ({v.license_plate})</option>)}
                    </select>
                    {errors.vehicle_id && <p className="text-[10px] text-destructive mt-1">{errors.vehicle_id}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Driver (On Duty)</label>
                    <select value={form.driver_id} onChange={e => setForm(f => ({...f, driver_id: e.target.value}))} className={`${inputCls} appearance-none ${errors.driver_id ? "ring-2 ring-destructive/50" : ""}`}>
                      <option value="">Select driver...</option>
                      {availableDrivers.map((d: any) => <option key={d.id} value={d.id} disabled={isExpired(d.license_expiry)}>{d.name} ({d.license_category}) {isExpired(d.license_expiry) ? "⚠ Expired" : ""}</option>)}
                    </select>
                    {errors.driver_id && <p className="text-[10px] text-destructive mt-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3" />{errors.driver_id}</p>}
                  </div>
                  <div><label className={labelCls}>Origin</label><input value={form.origin} onChange={e => setForm(f => ({...f, origin: e.target.value}))} placeholder="Houston, TX" className={inputCls} />{errors.origin && <p className="text-[10px] text-destructive mt-1">{errors.origin}</p>}</div>
                  <div><label className={labelCls}>Destination</label><input value={form.destination} onChange={e => setForm(f => ({...f, destination: e.target.value}))} placeholder="Dallas, TX" className={inputCls} />{errors.destination && <p className="text-[10px] text-destructive mt-1">{errors.destination}</p>}</div>
                  <div className="col-span-2">
                    <label className={labelCls}>Cargo Weight (kg){selectedVehicle && <span className="text-primary ml-2 normal-case">Max: {selectedVehicle.max_capacity.toLocaleString()} kg</span>}</label>
                    <input type="number" value={form.cargo_weight} onChange={e => setForm(f => ({...f, cargo_weight: e.target.value}))} placeholder="18000" className={`${inputCls} ${errors.cargo_weight ? "ring-2 ring-destructive/50" : ""}`} />
                    {errors.cargo_weight && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-destructive mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{errors.cargo_weight}</motion.p>}
                    {selectedVehicle && Number(form.cargo_weight) > 0 && Number(form.cargo_weight) <= selectedVehicle.max_capacity && (
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1"><span>Capacity usage</span><span>{((Number(form.cargo_weight) / selectedVehicle.max_capacity) * 100).toFixed(0)}%</span></div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((Number(form.cargo_weight) / selectedVehicle.max_capacity) * 100, 100)}%` }} transition={{ duration: 0.5 }}
                            className={`h-full rounded-full ${Number(form.cargo_weight) / selectedVehicle.max_capacity > 0.9 ? "bg-destructive" : Number(form.cargo_weight) / selectedVehicle.max_capacity > 0.7 ? "bg-status-in-shop" : "bg-status-available"}`} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2"><label className={labelCls}>Cargo Description</label><input value={form.cargo_description} onChange={e => setForm(f => ({...f, cargo_description: e.target.value}))} placeholder="Industrial Equipment" className={inputCls} /></div>
                  <div><label className={labelCls}>Distance (km)</label><input type="number" value={form.distance} onChange={e => setForm(f => ({...f, distance: e.target.value}))} placeholder="385" className={inputCls} /></div>
                  <div><label className={labelCls}>Est. Duration</label><input value={form.estimated_duration} onChange={e => setForm(f => ({...f, estimated_duration: e.target.value}))} placeholder="5h 30m" className={inputCls} /></div>
                </div>
                <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleAdd} disabled={addTrip.isPending}>{addTrip.isPending ? "Creating..." : "Create Trip"}</Button></DialogFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Trips;
