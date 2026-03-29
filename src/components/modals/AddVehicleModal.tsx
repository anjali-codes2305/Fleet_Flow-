import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, Check } from "lucide-react";
import { VehicleType } from "@/data/mockData";

interface AddVehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (vehicle: any) => void;
}

const vehicleTypes: VehicleType[] = ["Truck", "Van", "Trailer", "Tanker"];
const regions = ["North", "South", "East", "West"];
const fuelTypes = ["Diesel", "Gasoline", "Electric", "Hybrid"];

const AddVehicleModal = ({ open, onOpenChange, onAdd }: AddVehicleModalProps) => {
  const [form, setForm] = useState({
    name: "", model: "", licensePlate: "", type: "Truck" as VehicleType,
    maxCapacity: "", odometer: "", region: "North", fuelType: "Diesel",
    year: new Date().getFullYear().toString(), acquisitionCost: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.model.trim()) e.model = "Required";
    if (!form.licensePlate.trim()) e.licensePlate = "Required";
    if (!form.maxCapacity || Number(form.maxCapacity) <= 0) e.maxCapacity = "Must be > 0";
    if (!form.odometer || Number(form.odometer) < 0) e.odometer = "Must be ≥ 0";
    if (!form.acquisitionCost || Number(form.acquisitionCost) <= 0) e.acquisitionCost = "Must be > 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onAdd({
      id: `V${String(Math.floor(Math.random() * 900) + 100)}`,
      name: form.name, model: form.model, licensePlate: form.licensePlate,
      type: form.type, maxCapacity: Number(form.maxCapacity),
      odometer: Number(form.odometer), status: "Available" as const,
      region: form.region, fuelType: form.fuelType,
      year: Number(form.year), acquisitionCost: Number(form.acquisitionCost),
    });
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setForm({ name: "", model: "", licensePlate: "", type: "Truck", maxCapacity: "", odometer: "", region: "North", fuelType: "Diesel", year: new Date().getFullYear().toString(), acquisitionCost: "" });
      onOpenChange(false);
    }, 1200);
  };

  const inputCls = "w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all";
  const labelCls = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-12">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }} className="w-16 h-16 rounded-full bg-status-available/20 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-status-available" />
              </motion.div>
              <p className="text-lg font-semibold">Vehicle Added!</p>
              <p className="text-sm text-muted-foreground">Status set to Available</p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10"><Truck className="w-4 h-4 text-primary" /></div>
                  Add New Vehicle
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div>
                  <label className={labelCls}>Vehicle Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Hauler Alpha" className={inputCls} />
                  {errors.name && <p className="text-[10px] text-destructive mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className={labelCls}>Model</label>
                  <input value={form.model} onChange={e => setForm(f => ({...f, model: e.target.value}))} placeholder="e.g. Volvo FH16" className={inputCls} />
                  {errors.model && <p className="text-[10px] text-destructive mt-1">{errors.model}</p>}
                </div>
                <div>
                  <label className={labelCls}>License Plate</label>
                  <input value={form.licensePlate} onChange={e => setForm(f => ({...f, licensePlate: e.target.value}))} placeholder="FL-XXXX-XX" className={inputCls} />
                  {errors.licensePlate && <p className="text-[10px] text-destructive mt-1">{errors.licensePlate}</p>}
                </div>
                <div>
                  <label className={labelCls}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value as VehicleType}))} className={inputCls + " appearance-none"}>
                    {vehicleTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Max Capacity (kg)</label>
                  <input type="number" value={form.maxCapacity} onChange={e => setForm(f => ({...f, maxCapacity: e.target.value}))} placeholder="25000" className={inputCls} />
                  {errors.maxCapacity && <p className="text-[10px] text-destructive mt-1">{errors.maxCapacity}</p>}
                </div>
                <div>
                  <label className={labelCls}>Odometer (km)</label>
                  <input type="number" value={form.odometer} onChange={e => setForm(f => ({...f, odometer: e.target.value}))} placeholder="0" className={inputCls} />
                  {errors.odometer && <p className="text-[10px] text-destructive mt-1">{errors.odometer}</p>}
                </div>
                <div>
                  <label className={labelCls}>Region</label>
                  <select value={form.region} onChange={e => setForm(f => ({...f, region: e.target.value}))} className={inputCls + " appearance-none"}>
                    {regions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Fuel Type</label>
                  <select value={form.fuelType} onChange={e => setForm(f => ({...f, fuelType: e.target.value}))} className={inputCls + " appearance-none"}>
                    {fuelTypes.map(ft => <option key={ft} value={ft}>{ft}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Year</label>
                  <input type="number" value={form.year} onChange={e => setForm(f => ({...f, year: e.target.value}))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Acquisition Cost ($)</label>
                  <input type="number" value={form.acquisitionCost} onChange={e => setForm(f => ({...f, acquisitionCost: e.target.value}))} placeholder="120000" className={inputCls} />
                  {errors.acquisitionCost && <p className="text-[10px] text-destructive mt-1">{errors.acquisitionCost}</p>}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>Add Vehicle</Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default AddVehicleModal;
