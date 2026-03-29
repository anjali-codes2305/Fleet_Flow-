import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import KPICard from "@/components/KPICard";
import { useExpenses, useFuelLogs, useVehicles, useAddExpense, useAddFuelLog } from "@/hooks/useFleetData";
import { DollarSign, Fuel, Receipt, TrendingUp, Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const expenseCategories = ["Fuel", "Maintenance", "Insurance", "Toll", "Other"];

const Expenses = () => {
  const { data: expenses = [], isLoading: el } = useExpenses();
  const { data: fuelLogs = [], isLoading: fl } = useFuelLogs();
  const { data: vehicles = [] } = useVehicles();
  const addExpense = useAddExpense();
  const addFuelLog = useAddFuelLog();

  const [expenseModal, setExpenseModal] = useState(false);
  const [fuelModal, setFuelModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ vehicle_id: "", category: "Other", amount: "", date: new Date().toISOString().split("T")[0], description: "" });
  const [fuelForm, setFuelForm] = useState({ vehicle_id: "", date: new Date().toISOString().split("T")[0], liters: "", cost: "", odometer: "", station: "" });
  const [expenseErrors, setExpenseErrors] = useState<Record<string, string>>({});
  const [fuelErrors, setFuelErrors] = useState<Record<string, string>>({});
  const [successType, setSuccessType] = useState<"expense" | "fuel" | null>(null);

  const totalFuel = (fuelLogs as any[]).reduce((s: number, f: any) => s + Number(f.cost), 0);
  const totalExpenses = (expenses as any[]).reduce((s: number, e: any) => s + Number(e.amount), 0);
  const totalMaintenance = (expenses as any[]).filter((e: any) => e.category === "Maintenance").reduce((s: number, e: any) => s + Number(e.amount), 0);
  const totalLiters = (fuelLogs as any[]).reduce((s: number, f: any) => s + Number(f.liters), 0);
  const getVehicleName = (id: string) => (vehicles as any[]).find((v: any) => v.id === id)?.name || "—";

  const vehicleCosts = (vehicles as any[]).map((v: any) => {
    const fuel = (fuelLogs as any[]).filter((f: any) => f.vehicle_id === v.id).reduce((s: number, f: any) => s + Number(f.cost), 0);
    const maint = (expenses as any[]).filter((e: any) => e.vehicle_id === v.id && e.category === "Maintenance").reduce((s: number, e: any) => s + Number(e.amount), 0);
    return { ...v, fuelCost: fuel, maintCost: maint, totalOps: fuel + maint };
  }).filter((v: any) => v.totalOps > 0);

  const validateExpense = () => {
    const e: Record<string, string> = {};
    if (!expenseForm.vehicle_id) e.vehicle_id = "Select a vehicle";
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) e.amount = "Must be > 0";
    setExpenseErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateFuel = () => {
    const e: Record<string, string> = {};
    if (!fuelForm.vehicle_id) e.vehicle_id = "Select a vehicle";
    if (!fuelForm.liters || Number(fuelForm.liters) <= 0) e.liters = "Must be > 0";
    if (!fuelForm.cost || Number(fuelForm.cost) <= 0) e.cost = "Must be > 0";
    setFuelErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddExpense = async () => {
    if (!validateExpense()) return;
    try {
      await addExpense.mutateAsync({ vehicle_id: expenseForm.vehicle_id, category: expenseForm.category, amount: Number(expenseForm.amount), date: expenseForm.date, description: expenseForm.description });
      setSuccessType("expense");
      setTimeout(() => { setSuccessType(null); setExpenseModal(false); setExpenseForm({ vehicle_id: "", category: "Other", amount: "", date: new Date().toISOString().split("T")[0], description: "" }); }, 1200);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleAddFuel = async () => {
    if (!validateFuel()) return;
    try {
      await addFuelLog.mutateAsync({ vehicle_id: fuelForm.vehicle_id, date: fuelForm.date, liters: Number(fuelForm.liters), cost: Number(fuelForm.cost), odometer: Number(fuelForm.odometer) || 0, station: fuelForm.station });
      setSuccessType("fuel");
      setTimeout(() => { setSuccessType(null); setFuelModal(false); setFuelForm({ vehicle_id: "", date: new Date().toISOString().split("T")[0], liters: "", cost: "", odometer: "", station: "" }); }, 1200);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const inputCls = "w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelCls = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block";

  if (el || fl) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="Fuel & Expenses" description="Financial performance tracking and cost analysis">
        <div className="flex gap-2">
          <button onClick={() => setFuelModal(true)} className="h-9 px-4 bg-secondary text-secondary-foreground text-sm font-semibold rounded-lg border border-border hover:bg-secondary/80 transition-all flex items-center gap-2"><Fuel className="w-4 h-4" /> Add Fuel Log</button>
          <button onClick={() => setExpenseModal(true)} className="h-9 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:brightness-110 transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> Add Expense</button>
        </div>
      </PageHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Expenses" value={`$${totalExpenses.toLocaleString()}`} icon={DollarSign} variant="primary" delay={0} />
        <KPICard title="Fuel Costs" value={`$${totalFuel.toLocaleString()}`} icon={Fuel} delay={0.05} />
        <KPICard title="Maintenance Costs" value={`$${totalMaintenance.toLocaleString()}`} icon={Receipt} variant="warning" delay={0.1} />
        <KPICard title="Total Liters" value={totalLiters.toLocaleString()} subtitle="Fuel consumed" icon={TrendingUp} delay={0.15} />
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 mb-6">
        <h3 className="text-sm font-semibold mb-3">Total Operational Cost per Vehicle</h3>
        <p className="text-xs text-muted-foreground mb-4">Fuel Cost + Maintenance Cost = Total Operational Cost</p>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead><tr className="border-b border-border/50">
              <th className="text-left text-[11px] uppercase tracking-wider font-semibold text-muted-foreground px-4 py-3">Vehicle</th>
              <th className="text-left text-[11px] uppercase tracking-wider font-semibold text-muted-foreground px-4 py-3">Fuel Cost</th>
              <th className="text-left text-[11px] uppercase tracking-wider font-semibold text-muted-foreground px-4 py-3">Maint Cost</th>
              <th className="text-left text-[11px] uppercase tracking-wider font-semibold text-muted-foreground px-4 py-3">Total Ops Cost</th>
            </tr></thead>
            <tbody>
              {vehicleCosts.map((v: any) => (
                <tr key={v.id} className="border-b border-border/30 last:border-0 hover:bg-secondary/40 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{v.name} <span className="text-xs text-muted-foreground">({v.license_plate})</span></td>
                  <td className="px-4 py-3 text-sm">${v.fuelCost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">${v.maintCost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-primary">${v.totalOps.toLocaleString()}</td>
                </tr>
              ))}
              {vehicleCosts.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No cost data yet. Add fuel logs or expenses to see per-vehicle costs.</td></tr>}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h3 className="text-sm font-semibold mb-3">Fuel Logs</h3>
          <DataTable data={fuelLogs as any[]} keyField="id" columns={[
            { header: "Vehicle", accessor: (f: any) => getVehicleName(f.vehicle_id) },
            { header: "Date", accessor: "date" as any },
            { header: "Liters", accessor: (f: any) => `${Number(f.liters)} L` },
            { header: "Cost", accessor: (f: any) => `$${Number(f.cost).toFixed(2)}` },
            { header: "Station", accessor: "station" as any },
          ]} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="text-sm font-semibold mb-3">All Expenses</h3>
          <DataTable data={expenses as any[]} keyField="id" columns={[
            { header: "Vehicle", accessor: (e: any) => getVehicleName(e.vehicle_id) },
            { header: "Category", accessor: (e: any) => <span className="px-2 py-0.5 rounded-md bg-secondary text-xs font-medium">{e.category}</span> },
            { header: "Amount", accessor: (e: any) => `$${Number(e.amount).toLocaleString()}` },
            { header: "Date", accessor: "date" as any },
            { header: "Description", accessor: "description" as any, className: "max-w-[200px] truncate" },
          ]} />
        </motion.div>
      </div>

      {/* Add Expense Modal */}
      <Dialog open={expenseModal} onOpenChange={setExpenseModal}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <AnimatePresence mode="wait">
            {successType === "expense" ? (
              <motion.div key="s" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-12">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="w-16 h-16 rounded-full bg-status-available/20 flex items-center justify-center mb-4"><Check className="w-8 h-8 text-status-available" /></motion.div>
                <p className="text-lg font-semibold">Expense Added!</p>
              </motion.div>
            ) : (
              <motion.div key="f" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="p-2 rounded-lg bg-primary/10"><Receipt className="w-4 h-4 text-primary" /></div>Add Expense</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div><label className={labelCls}>Vehicle</label><select value={expenseForm.vehicle_id} onChange={e => setExpenseForm(f => ({...f, vehicle_id: e.target.value}))} className={inputCls + " appearance-none"}><option value="">Select vehicle...</option>{(vehicles as any[]).map((v: any) => <option key={v.id} value={v.id}>{v.name} ({v.license_plate})</option>)}</select>{expenseErrors.vehicle_id && <p className="text-[10px] text-destructive mt-1">{expenseErrors.vehicle_id}</p>}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelCls}>Category</label><select value={expenseForm.category} onChange={e => setExpenseForm(f => ({...f, category: e.target.value}))} className={inputCls + " appearance-none"}>{expenseCategories.map(c => <option key={c}>{c}</option>)}</select></div>
                    <div><label className={labelCls}>Amount ($)</label><input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({...f, amount: e.target.value}))} placeholder="500" className={inputCls} />{expenseErrors.amount && <p className="text-[10px] text-destructive mt-1">{expenseErrors.amount}</p>}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelCls}>Date</label><input type="date" value={expenseForm.date} onChange={e => setExpenseForm(f => ({...f, date: e.target.value}))} className={inputCls} /></div>
                    <div><label className={labelCls}>Description</label><input value={expenseForm.description} onChange={e => setExpenseForm(f => ({...f, description: e.target.value}))} placeholder="Insurance renewal" className={inputCls} /></div>
                  </div>
                </div>
                <DialogFooter><Button variant="outline" onClick={() => setExpenseModal(false)}>Cancel</Button><Button onClick={handleAddExpense} disabled={addExpense.isPending}>{addExpense.isPending ? "Adding..." : "Add Expense"}</Button></DialogFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Add Fuel Log Modal */}
      <Dialog open={fuelModal} onOpenChange={setFuelModal}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <AnimatePresence mode="wait">
            {successType === "fuel" ? (
              <motion.div key="s" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-12">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="w-16 h-16 rounded-full bg-status-available/20 flex items-center justify-center mb-4"><Check className="w-8 h-8 text-status-available" /></motion.div>
                <p className="text-lg font-semibold">Fuel Log Added!</p>
              </motion.div>
            ) : (
              <motion.div key="f" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="p-2 rounded-lg bg-status-in-shop/10"><Fuel className="w-4 h-4 text-status-in-shop" /></div>Add Fuel Log</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div><label className={labelCls}>Vehicle</label><select value={fuelForm.vehicle_id} onChange={e => setFuelForm(f => ({...f, vehicle_id: e.target.value}))} className={inputCls + " appearance-none"}><option value="">Select vehicle...</option>{(vehicles as any[]).map((v: any) => <option key={v.id} value={v.id}>{v.name} ({v.license_plate})</option>)}</select>{fuelErrors.vehicle_id && <p className="text-[10px] text-destructive mt-1">{fuelErrors.vehicle_id}</p>}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelCls}>Liters</label><input type="number" value={fuelForm.liters} onChange={e => setFuelForm(f => ({...f, liters: e.target.value}))} placeholder="120" className={inputCls} />{fuelErrors.liters && <p className="text-[10px] text-destructive mt-1">{fuelErrors.liters}</p>}</div>
                    <div><label className={labelCls}>Cost ($)</label><input type="number" value={fuelForm.cost} onChange={e => setFuelForm(f => ({...f, cost: e.target.value}))} placeholder="180" className={inputCls} />{fuelErrors.cost && <p className="text-[10px] text-destructive mt-1">{fuelErrors.cost}</p>}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelCls}>Date</label><input type="date" value={fuelForm.date} onChange={e => setFuelForm(f => ({...f, date: e.target.value}))} className={inputCls} /></div>
                    <div><label className={labelCls}>Odometer</label><input type="number" value={fuelForm.odometer} onChange={e => setFuelForm(f => ({...f, odometer: e.target.value}))} placeholder="45000" className={inputCls} /></div>
                  </div>
                  <div><label className={labelCls}>Station</label><input value={fuelForm.station} onChange={e => setFuelForm(f => ({...f, station: e.target.value}))} placeholder="Shell Highway 10" className={inputCls} /></div>
                </div>
                <DialogFooter><Button variant="outline" onClick={() => setFuelModal(false)}>Cancel</Button><Button onClick={handleAddFuel} disabled={addFuelLog.isPending}>{addFuelLog.isPending ? "Adding..." : "Add Fuel Log"}</Button></DialogFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expenses;
