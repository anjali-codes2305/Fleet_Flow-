import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useUserRole } from "@/hooks/useUserRole";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { useVehicles, useAddVehicle, useUpdateVehicle } from "@/hooks/useFleetData";
import { Plus, Search, Power } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const statusFilters = ["All", "Available", "On Trip", "In Shop", "Out of Service"];
const vehicleTypes = ["Truck", "Van", "Trailer", "Tanker"];
const regions = ["North", "South", "East", "West"];

const Vehicles = () => {
  const { data: vehicles = [], isLoading } = useVehicles();
  const addVehicle = useAddVehicle();
  const updateVehicle = useUpdateVehicle();
  const { canEditVehicles } = useUserRole();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", model: "", license_plate: "", type: "Truck", max_capacity: "", odometer: "", region: "North", fuel_type: "Diesel", year: String(new Date().getFullYear()), acquisition_cost: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const filtered = (vehicles as any[]).filter((v: any) => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.license_plate.toLowerCase().includes(search.toLowerCase()) || v.model.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts: Record<string, number> = {
    Available: (vehicles as any[]).filter((v: any) => v.status === "Available").length,
    "On Trip": (vehicles as any[]).filter((v: any) => v.status === "On Trip").length,
    "In Shop": (vehicles as any[]).filter((v: any) => v.status === "In Shop").length,
    "Out of Service": (vehicles as any[]).filter((v: any) => v.status === "Out of Service").length,
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.model.trim()) e.model = "Required";
    if (!form.license_plate.trim()) e.license_plate = "Required";
    if (!form.max_capacity || Number(form.max_capacity) <= 0) e.max_capacity = "Must be > 0";
    if (!form.acquisition_cost || Number(form.acquisition_cost) <= 0) e.acquisition_cost = "Must be > 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    try {
      await addVehicle.mutateAsync({
        name: form.name, model: form.model, license_plate: form.license_plate,
        type: form.type, max_capacity: Number(form.max_capacity), odometer: Number(form.odometer) || 0,
        region: form.region, fuel_type: form.fuel_type, year: Number(form.year),
        acquisition_cost: Number(form.acquisition_cost),
      });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setModalOpen(false); setForm({ name: "", model: "", license_plate: "", type: "Truck", max_capacity: "", odometer: "", region: "North", fuel_type: "Diesel", year: String(new Date().getFullYear()), acquisition_cost: "" }); }, 1200);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleStatus = async (vehicleId: string, currentStatus: string) => {
    const newStatus = currentStatus === "Out of Service" ? "Available" : "Out of Service";
    try {
      await updateVehicle.mutateAsync({ id: vehicleId, status: newStatus });
      toast({ title: `Vehicle ${newStatus === "Out of Service" ? "Retired" : "Reactivated"}`, description: `Status set to ${newStatus}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const inputCls = "w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelCls = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block";

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="Vehicle Registry" description="Central vehicle database and asset management">
        {canEditVehicles && (
          <button onClick={() => setModalOpen(true)} className="h-9 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:brightness-110 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {(["Available", "On Trip", "In Shop", "Out of Service"]).map((s, i) => (
          <motion.div key={s} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`glass-card p-3 cursor-pointer transition-all hover:scale-[1.02] ${statusFilter === s ? "ring-1 ring-primary/30" : ""}`}
            onClick={() => setStatusFilter(statusFilter === s ? "All" : s)}>
            <p className="text-2xl font-bold">{statusCounts[s] || 0}</p>
            <p className="text-xs text-muted-foreground">{s}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vehicles..." className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statusFilters.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`h-9 px-3 text-xs font-medium rounded-lg border transition-all ${statusFilter === s ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <DataTable data={filtered} keyField="id" columns={[
        { header: "Vehicle", accessor: (v: any) => (<div><p className="font-medium">{v.name}</p><p className="text-xs text-muted-foreground">{v.model}</p></div>) },
        { header: "License Plate", accessor: "license_plate" as any, className: "font-mono" },
        { header: "Type", accessor: (v: any) => <span className="px-2 py-0.5 rounded-md bg-secondary text-xs font-medium">{v.type}</span> },
        { header: "Max Capacity", accessor: (v: any) => `${(v.max_capacity / 1000).toFixed(0)}t` },
        { header: "Odometer", accessor: (v: any) => `${v.odometer.toLocaleString()} km` },
        { header: "Region", accessor: "region" as any },
        { header: "Status", accessor: (v: any) => <StatusBadge status={v.status} /> },
        { header: "Actions", accessor: (v: any) => (
          canEditVehicles && (v.status === "Available" || v.status === "Out of Service") ? (
            <button onClick={() => handleToggleStatus(v.id, v.status)} className={`p-1.5 rounded-md flex items-center gap-1 text-xs font-medium transition-all ${v.status === "Out of Service" ? "hover:bg-status-available/10 text-status-available" : "hover:bg-destructive/10 text-destructive"}`} title={v.status === "Out of Service" ? "Reactivate" : "Retire"}>
              <Power className="w-3.5 h-3.5" /> {v.status === "Out of Service" ? "Reactivate" : "Retire"}
            </button>
          ) : <span className="text-xs text-muted-foreground">—</span>
        )},
      ]} />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div key="s" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-12">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="w-16 h-16 rounded-full bg-status-available/20 flex items-center justify-center mb-4"><Check className="w-8 h-8 text-status-available" /></motion.div>
                <p className="text-lg font-semibold">Vehicle Added!</p>
              </motion.div>
            ) : (
              <motion.div key="f" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <DialogHeader><DialogTitle>Add New Vehicle</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div><label className={labelCls}>Name</label><input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Hauler Alpha" className={inputCls} />{errors.name && <p className="text-[10px] text-destructive mt-1">{errors.name}</p>}</div>
                  <div><label className={labelCls}>Model</label><input value={form.model} onChange={e => setForm(f => ({...f, model: e.target.value}))} placeholder="Volvo FH16" className={inputCls} />{errors.model && <p className="text-[10px] text-destructive mt-1">{errors.model}</p>}</div>
                  <div><label className={labelCls}>License Plate</label><input value={form.license_plate} onChange={e => setForm(f => ({...f, license_plate: e.target.value}))} placeholder="FL-XXXX-XX" className={inputCls} />{errors.license_plate && <p className="text-[10px] text-destructive mt-1">{errors.license_plate}</p>}</div>
                  <div><label className={labelCls}>Type</label><select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} className={inputCls + " appearance-none"}>{vehicleTypes.map(t => <option key={t}>{t}</option>)}</select></div>
                  <div><label className={labelCls}>Max Capacity (kg)</label><input type="number" value={form.max_capacity} onChange={e => setForm(f => ({...f, max_capacity: e.target.value}))} placeholder="25000" className={inputCls} />{errors.max_capacity && <p className="text-[10px] text-destructive mt-1">{errors.max_capacity}</p>}</div>
                  <div><label className={labelCls}>Odometer (km)</label><input type="number" value={form.odometer} onChange={e => setForm(f => ({...f, odometer: e.target.value}))} placeholder="0" className={inputCls} /></div>
                  <div><label className={labelCls}>Region</label><select value={form.region} onChange={e => setForm(f => ({...f, region: e.target.value}))} className={inputCls + " appearance-none"}>{regions.map(r => <option key={r}>{r}</option>)}</select></div>
                  <div><label className={labelCls}>Acquisition Cost ($)</label><input type="number" value={form.acquisition_cost} onChange={e => setForm(f => ({...f, acquisition_cost: e.target.value}))} placeholder="120000" className={inputCls} />{errors.acquisition_cost && <p className="text-[10px] text-destructive mt-1">{errors.acquisition_cost}</p>}</div>
                </div>
                <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleAdd} disabled={addVehicle.isPending}>{addVehicle.isPending ? "Adding..." : "Add Vehicle"}</Button></DialogFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vehicles;
