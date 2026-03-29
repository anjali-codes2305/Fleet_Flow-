import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Route, Check, AlertTriangle, ShieldAlert } from "lucide-react";
import { vehicles, drivers, Vehicle, Driver } from "@/data/mockData";

interface NewTripModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (trip: any) => void;
  vehiclesList: Vehicle[];
  driversList: Driver[];
}

const NewTripModal = ({ open, onOpenChange, onAdd, vehiclesList, driversList }: NewTripModalProps) => {
  const [form, setForm] = useState({
    vehicleId: "", driverId: "", origin: "", destination: "",
    cargoWeight: "", cargoDescription: "", distance: "", estimatedDuration: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const availableVehicles = useMemo(() => vehiclesList.filter(v => v.status === "Available"), [vehiclesList]);
  const availableDrivers = useMemo(() => {
    return driversList.filter(d => d.status === "On Duty");
  }, [driversList]);

  const selectedVehicle = vehiclesList.find(v => v.id === form.vehicleId);
  const selectedDriver = driversList.find(d => d.id === form.driverId);

  const isLicenseExpired = (date: string) => new Date(date) < new Date();

  const validate = () => {
    const e: Record<string, string> = {};
    const w: string[] = [];
    if (!form.vehicleId) e.vehicleId = "Select a vehicle";
    if (!form.driverId) e.driverId = "Select a driver";
    if (!form.origin.trim()) e.origin = "Required";
    if (!form.destination.trim()) e.destination = "Required";
    if (!form.cargoWeight || Number(form.cargoWeight) <= 0) e.cargoWeight = "Must be > 0";

    // Capacity validation
    if (selectedVehicle && Number(form.cargoWeight) > selectedVehicle.maxCapacity) {
      e.cargoWeight = `Exceeds max capacity of ${(selectedVehicle.maxCapacity / 1000).toFixed(0)}t (${selectedVehicle.maxCapacity.toLocaleString()} kg)`;
    }

    // License expiry validation
    if (selectedDriver && isLicenseExpired(selectedDriver.licenseExpiry)) {
      e.driverId = `License expired on ${selectedDriver.licenseExpiry} — assignment blocked`;
    }

    setErrors(e);
    setWarnings(w);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const today = new Date().toISOString().split("T")[0];
    onAdd({
      id: `T${String(Math.floor(Math.random() * 900) + 100)}`,
      vehicleId: form.vehicleId, driverId: form.driverId,
      origin: form.origin, destination: form.destination,
      cargoWeight: Number(form.cargoWeight), cargoDescription: form.cargoDescription,
      status: "Draft" as const, createdAt: today,
      distance: Number(form.distance) || 0, estimatedDuration: form.estimatedDuration || "TBD",
    });
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setForm({ vehicleId: "", driverId: "", origin: "", destination: "", cargoWeight: "", cargoDescription: "", distance: "", estimatedDuration: "" });
      onOpenChange(false);
    }, 1200);
  };

  const inputCls = "w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all";
  const labelCls = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block";
  const errorInputCls = "ring-2 ring-destructive/50 border-destructive/50";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-12">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }} className="w-16 h-16 rounded-full bg-status-available/20 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-status-available" />
              </motion.div>
              <p className="text-lg font-semibold">Trip Created!</p>
              <p className="text-sm text-muted-foreground">Status: Draft — Ready for dispatch</p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10"><Route className="w-4 h-4 text-primary" /></div>
                  Create New Trip
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 py-4">
                <div>
                  <label className={labelCls}>Vehicle (Available only)</label>
                  <select value={form.vehicleId} onChange={e => setForm(f => ({...f, vehicleId: e.target.value}))} className={`${inputCls} appearance-none ${errors.vehicleId ? errorInputCls : ""}`}>
                    <option value="">Select vehicle...</option>
                    {availableVehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.name} — {(v.maxCapacity / 1000).toFixed(0)}t ({v.licensePlate})</option>
                    ))}
                  </select>
                  {errors.vehicleId && <p className="text-[10px] text-destructive mt-1">{errors.vehicleId}</p>}
                </div>
                <div>
                  <label className={labelCls}>Driver (On Duty only)</label>
                  <select value={form.driverId} onChange={e => setForm(f => ({...f, driverId: e.target.value}))} className={`${inputCls} appearance-none ${errors.driverId ? errorInputCls : ""}`}>
                    <option value="">Select driver...</option>
                    {availableDrivers.map(d => (
                      <option key={d.id} value={d.id} disabled={isLicenseExpired(d.licenseExpiry)}>
                        {d.name} ({d.licenseCategory}) {isLicenseExpired(d.licenseExpiry) ? "⚠ Expired" : ""}
                      </option>
                    ))}
                  </select>
                  {errors.driverId && (
                    <p className="text-[10px] text-destructive mt-1 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> {errors.driverId}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Origin</label>
                  <input value={form.origin} onChange={e => setForm(f => ({...f, origin: e.target.value}))} placeholder="Houston, TX" className={`${inputCls} ${errors.origin ? errorInputCls : ""}`} />
                  {errors.origin && <p className="text-[10px] text-destructive mt-1">{errors.origin}</p>}
                </div>
                <div>
                  <label className={labelCls}>Destination</label>
                  <input value={form.destination} onChange={e => setForm(f => ({...f, destination: e.target.value}))} placeholder="Dallas, TX" className={`${inputCls} ${errors.destination ? errorInputCls : ""}`} />
                  {errors.destination && <p className="text-[10px] text-destructive mt-1">{errors.destination}</p>}
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>
                    Cargo Weight (kg)
                    {selectedVehicle && <span className="text-primary ml-2 normal-case">Max: {selectedVehicle.maxCapacity.toLocaleString()} kg</span>}
                  </label>
                  <input type="number" value={form.cargoWeight} onChange={e => setForm(f => ({...f, cargoWeight: e.target.value}))} placeholder="18000" className={`${inputCls} ${errors.cargoWeight ? errorInputCls : ""}`} />
                  {errors.cargoWeight && (
                    <motion.p initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] text-destructive mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {errors.cargoWeight}
                    </motion.p>
                  )}
                  {selectedVehicle && Number(form.cargoWeight) > 0 && Number(form.cargoWeight) <= selectedVehicle.maxCapacity && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Capacity usage</span>
                        <span>{((Number(form.cargoWeight) / selectedVehicle.maxCapacity) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((Number(form.cargoWeight) / selectedVehicle.maxCapacity) * 100, 100)}%` }}
                          transition={{ duration: 0.5 }}
                          className={`h-full rounded-full ${
                            Number(form.cargoWeight) / selectedVehicle.maxCapacity > 0.9 ? "bg-destructive" :
                            Number(form.cargoWeight) / selectedVehicle.maxCapacity > 0.7 ? "bg-status-in-shop" : "bg-status-available"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Cargo Description</label>
                  <input value={form.cargoDescription} onChange={e => setForm(f => ({...f, cargoDescription: e.target.value}))} placeholder="Industrial Equipment" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Distance (km)</label>
                  <input type="number" value={form.distance} onChange={e => setForm(f => ({...f, distance: e.target.value}))} placeholder="385" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Est. Duration</label>
                  <input value={form.estimatedDuration} onChange={e => setForm(f => ({...f, estimatedDuration: e.target.value}))} placeholder="5h 30m" className={inputCls} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>Create Trip</Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default NewTripModal;
