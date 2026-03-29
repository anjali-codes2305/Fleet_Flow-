import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { useMaintenanceLogs, useAddMaintenanceLog, useVehicles } from "@/hooks/useFleetData";
import { Plus, AlertTriangle, Wrench, Check, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const maintenanceTypes = ["Preventive", "Repair", "Inspection", "Tire Service", "Engine"];

const Maintenance = () => {
  const { data: logs = [], isLoading } = useMaintenanceLogs();
  const { data: vehicles = [] } = useVehicles();
  const addLog = useAddMaintenanceLog();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ vehicle_id: "", type: "Preventive", description: "", cost: "", technician: "", date: new Date().toISOString().split("T")[0] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const getVehicle = (id: string) => (vehicles as any[]).find((v: any) => v.id === id);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.vehicle_id) e.vehicle_id = "Select a vehicle";
    if (!form.description.trim()) e.description = "Required";
    if (!form.cost || Number(form.cost) <= 0) e.cost = "Must be > 0";
    if (!form.technician.trim()) e.technician = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    try {
      await addLog.mutateAsync({ vehicle_id: form.vehicle_id, type: form.type, description: form.description, date: form.date, cost: Number(form.cost), technician: form.technician });
      setSuccess(true);
      toast({ title: "Service Log Added", description: "Vehicle automatically moved to 'In Shop'" });
      setTimeout(() => { setSuccess(false); setModalOpen(false); setForm({ vehicle_id: "", type: "Preventive", description: "", cost: "", technician: "", date: new Date().toISOString().split("T")[0] }); }, 1200);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleComplete = async (logId: string) => {
    try {
      const { error } = await supabase.from("maintenance_logs").update({ status: "Completed" } as any).eq("id", logId);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["maintenance_logs"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast({ title: "Maintenance Completed", description: "Vehicle returned to 'Available' status" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const scheduled = (logs as any[]).filter((l: any) => l.status === "Scheduled").length;
  const inProgress = (logs as any[]).filter((l: any) => l.status === "In Progress").length;
  const completed = (logs as any[]).filter((l: any) => l.status === "Completed").length;
  const totalCost = (logs as any[]).reduce((s: number, l: any) => s + Number(l.cost), 0);

  const inputCls = "w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelCls = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block";

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="Maintenance & Service Logs" description="Preventive and reactive maintenance tracking">
        <button onClick={() => setModalOpen(true)} className="h-9 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:brightness-110 transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> Add Service Log</button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Scheduled", value: scheduled, color: "text-status-dispatched" },
          { label: "In Progress", value: inProgress, color: "text-status-in-shop" },
          { label: "Completed", value: completed, color: "text-status-completed" },
          { label: "Total Cost", value: `$${totalCost.toLocaleString()}`, color: "text-primary" },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-3">
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </motion.div>
        ))}
      </div>

      <DataTable data={logs as any[]} keyField="id" columns={[
        { header: "Vehicle", accessor: (m: any) => { const v = getVehicle(m.vehicle_id); return v ? (<div><p className="font-medium">{v.name}</p><p className="text-xs text-muted-foreground">{v.license_plate}</p></div>) : m.vehicle_id; } },
        { header: "Type", accessor: (m: any) => <span className="px-2 py-0.5 rounded-md bg-secondary text-xs font-medium">{m.type}</span> },
        { header: "Description", accessor: "description" as any, className: "max-w-[250px] truncate" },
        { header: "Date", accessor: "date" as any },
        { header: "Cost", accessor: (m: any) => `$${Number(m.cost).toLocaleString()}` },
        { header: "Technician", accessor: "technician" as any },
        { header: "Status", accessor: (m: any) => <StatusBadge status={m.status} /> },
        { header: "Actions", accessor: (m: any) => (
          m.status !== "Completed" ? (
            <button onClick={() => handleComplete(m.id)} className="p-1.5 rounded-md hover:bg-status-available/10 text-status-available flex items-center gap-1 text-xs" title="Mark Complete">
              <CheckCircle className="w-3.5 h-3.5" /> Complete
            </button>
          ) : <span className="text-xs text-muted-foreground">Done</span>
        )},
      ]} />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div key="s" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-12">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="w-16 h-16 rounded-full bg-status-in-shop/20 flex items-center justify-center mb-4"><Check className="w-8 h-8 text-status-in-shop" /></motion.div>
                <p className="text-lg font-semibold">Service Log Added!</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-status-in-shop" /> Vehicle moved to "In Shop"</p>
              </motion.div>
            ) : (
              <motion.div key="f" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="p-2 rounded-lg bg-status-in-shop/10"><Wrench className="w-4 h-4 text-status-in-shop" /></div>Add Service Log</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div><label className={labelCls}>Vehicle</label><select value={form.vehicle_id} onChange={e => setForm(f => ({...f, vehicle_id: e.target.value}))} className={inputCls + " appearance-none"}><option value="">Select vehicle...</option>{(vehicles as any[]).map((v: any) => <option key={v.id} value={v.id}>{v.name} ({v.license_plate})</option>)}</select>{errors.vehicle_id && <p className="text-[10px] text-destructive mt-1">{errors.vehicle_id}</p>}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelCls}>Type</label><select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} className={inputCls + " appearance-none"}>{maintenanceTypes.map(t => <option key={t}>{t}</option>)}</select></div>
                    <div><label className={labelCls}>Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className={inputCls} /></div>
                  </div>
                  <div><label className={labelCls}>Description</label><input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Oil change and filter replacement" className={inputCls} />{errors.description && <p className="text-[10px] text-destructive mt-1">{errors.description}</p>}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelCls}>Cost ($)</label><input type="number" value={form.cost} onChange={e => setForm(f => ({...f, cost: e.target.value}))} placeholder="350" className={inputCls} />{errors.cost && <p className="text-[10px] text-destructive mt-1">{errors.cost}</p>}</div>
                    <div><label className={labelCls}>Technician</label><input value={form.technician} onChange={e => setForm(f => ({...f, technician: e.target.value}))} placeholder="Mike Reynolds" className={inputCls} />{errors.technician && <p className="text-[10px] text-destructive mt-1">{errors.technician}</p>}</div>
                  </div>
                </div>
                <p className="text-[10px] text-status-in-shop bg-status-in-shop/5 border border-status-in-shop/20 rounded-lg px-3 py-2 mb-4 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 shrink-0" />Vehicle will automatically be set to "In Shop" and removed from dispatch pool.</p>
                <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleAdd} disabled={addLog.isPending}>{addLog.isPending ? "Adding..." : "Add Service Log"}</Button></DialogFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Maintenance;
