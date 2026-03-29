import { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import DataTable from "@/components/DataTable";
import { useUserRole } from "@/hooks/useUserRole";
import StatusBadge from "@/components/StatusBadge";
import KPICard from "@/components/KPICard";
import { useDrivers, useTrips, useAddDriver } from "@/hooks/useFleetData";
import {
  Search, Shield, AlertTriangle, Plus, Check, Users, UserCheck, UserX,
  Filter, ArrowUpDown, ArrowUp, ArrowDown, Layers, ChevronDown, Phone, Award, X,
  TrendingUp, TrendingDown, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_FILTERS = ["All", "On Duty", "Off Duty", "On Trip", "Suspended"];
const DRIVER_STATUSES = ["On Duty", "Off Duty", "Suspended"];
const LICENSE_CATS = ["All", "A", "B", "C", "CE", "D"];
const SORT_OPTIONS = [
  { label: "Name A-Z", key: "name", dir: "asc" },
  { label: "Name Z-A", key: "name", dir: "desc" },
  { label: "Safety ↑", key: "safety_score", dir: "desc" },
  { label: "Safety ↓", key: "safety_score", dir: "asc" },
  { label: "Trips ↑", key: "total_trips", dir: "desc" },
  { label: "Trips ↓", key: "total_trips", dir: "asc" },
  { label: "Complaints ↑", key: "complaints", dir: "desc" },
  { label: "Expiry Soon", key: "license_expiry", dir: "asc" },
] as const;
const GROUP_OPTIONS = ["None", "Status", "License Category", "Safety Tier"];
type ViewMode = "cards" | "table";

const Drivers = () => {
  const { data: drivers = [], isLoading } = useDrivers();
  const { data: trips = [] } = useTrips();
  const addDriver = useAddDriver();
  const qc = useQueryClient();
  const { canEditDrivers } = useUserRole();

  // Controls
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [licenseFilter, setLicenseFilter] = useState("All");
  const [sortBy, setSortBy] = useState<typeof SORT_OPTIONS[number]>(SORT_OPTIONS[0]);
  const [groupBy, setGroupBy] = useState("None");
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [detailDriver, setDetailDriver] = useState<any>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", license_number: "", license_expiry: "", license_category: "C", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const isExpired = (date: string) => new Date(date) < new Date();
  const daysUntilExpiry = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  // Compute completion rate per driver from trips
  const completionRates = useMemo(() => {
    const rates: Record<string, { completed: number; total: number }> = {};
    (trips as any[]).forEach((t: any) => {
      if (!rates[t.driver_id]) rates[t.driver_id] = { completed: 0, total: 0 };
      rates[t.driver_id].total++;
      if (t.status === "Completed") rates[t.driver_id].completed++;
    });
    return rates;
  }, [trips]);

  const getCompletionRate = (driverId: string) => {
    const r = completionRates[driverId];
    if (!r || r.total === 0) return null;
    return Math.round((r.completed / r.total) * 100);
  };

  const getSafetyTier = (score: number) => {
    if (score >= 95) return "Elite";
    if (score >= 85) return "Good";
    if (score >= 70) return "Fair";
    return "At Risk";
  };

  // Filter, sort, then group
  const processed = useMemo(() => {
    let list = (drivers as any[]).filter((d: any) => {
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.license_number.toLowerCase().includes(search.toLowerCase()) ||
        d.phone?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || d.status === statusFilter;
      const matchLicense = licenseFilter === "All" || d.license_category === licenseFilter;
      return matchSearch && matchStatus && matchLicense;
    });

    // Sort
    list = [...list].sort((a, b) => {
      const key = sortBy.key;
      const dir = sortBy.dir === "asc" ? 1 : -1;
      if (key === "name") return a.name.localeCompare(b.name) * dir;
      if (key === "license_expiry") return (new Date(a.license_expiry).getTime() - new Date(b.license_expiry).getTime()) * dir;
      return ((a[key] ?? 0) - (b[key] ?? 0)) * dir;
    });

    return list;
  }, [drivers, search, statusFilter, licenseFilter, sortBy]);

  // Group
  const grouped = useMemo(() => {
    if (groupBy === "None") return { "": processed };
    const groups: Record<string, any[]> = {};
    processed.forEach(d => {
      let key = "";
      if (groupBy === "Status") key = d.status;
      else if (groupBy === "License Category") key = `Category ${d.license_category}`;
      else if (groupBy === "Safety Tier") key = getSafetyTier(d.safety_score);
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });
    return groups;
  }, [processed, groupBy]);

  // KPIs
  const allDrivers = drivers as any[];
  const onDuty = allDrivers.filter(d => d.status === "On Duty").length;
  const onTrip = allDrivers.filter(d => d.status === "On Trip").length;
  const suspended = allDrivers.filter(d => d.status === "Suspended").length;
  const expiredLicenses = allDrivers.filter(d => isExpired(d.license_expiry)).length;
  const avgSafety = allDrivers.length > 0 ? Math.round(allDrivers.reduce((s, d) => s + d.safety_score, 0) / allDrivers.length) : 0;
  const totalComplaints = allDrivers.reduce((s, d) => s + (d.complaints ?? 0), 0);

  const handleStatusToggle = async (driverId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("drivers").update({ status: newStatus } as any).eq("id", driverId);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["drivers"] });
      toast({ title: "Status Updated", description: `Driver set to ${newStatus}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.license_number.trim()) e.license_number = "Required";
    if (!form.license_expiry) e.license_expiry = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    try {
      await addDriver.mutateAsync({
        name: form.name, license_number: form.license_number,
        license_expiry: form.license_expiry, license_category: form.license_category, phone: form.phone,
      });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setModalOpen(false); setForm({ name: "", license_number: "", license_expiry: "", license_category: "C", phone: "" }); }, 1200);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const inputCls = "w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelCls = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block";

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="Driver Performance & Safety" description="Compliance tracking, safety scores, performance analytics">
        {canEditDrivers && (
          <button onClick={() => setModalOpen(true)} className="h-9 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:brightness-110 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Driver
          </button>
        )}
      </PageHeader>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <KPICard title="Total Drivers" value={allDrivers.length} icon={Users} delay={0} />
        <KPICard title="On Duty" value={onDuty} icon={UserCheck} variant="primary" delay={0.04} />
        <KPICard title="On Trip" value={onTrip} icon={Users} variant="primary" delay={0.08} />
        <KPICard title="Suspended" value={suspended} icon={UserX} variant="warning" delay={0.12} />
        <KPICard title="Avg Safety" value={avgSafety} icon={Shield} delay={0.16} />
        <KPICard title="Expired Licenses" value={expiredLicenses} icon={AlertTriangle} variant="warning" delay={0.2} />
      </div>

      {/* Safety Score Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {/* Bar Chart: Safety Scores by Driver */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Safety Scores by Driver
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={allDrivers.map(d => ({ name: d.name.split(" ")[0], score: d.safety_score, full: d.name })).sort((a, b) => b.score - a.score)} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => [`${value}`, "Safety Score"]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.full || label}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {allDrivers.sort((a, b) => b.safety_score - a.safety_score).map((d, i) => (
                    <Cell key={i} fill={d.safety_score >= 90 ? "hsl(var(--status-available))" : d.safety_score >= 80 ? "hsl(var(--primary))" : "hsl(var(--destructive))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie Chart: Safety Tier Distribution */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" /> Safety Tier Distribution
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(() => {
                    const tiers = { Elite: 0, Good: 0, Fair: 0, "At Risk": 0 };
                    allDrivers.forEach(d => { tiers[getSafetyTier(d.safety_score) as keyof typeof tiers]++; });
                    return Object.entries(tiers).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
                  })()}
                  cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {[
                    { name: "Elite", color: "hsl(var(--status-available))" },
                    { name: "Good", color: "hsl(var(--primary))" },
                    { name: "Fair", color: "hsl(var(--status-in-shop))" },
                    { name: "At Risk", color: "hsl(var(--destructive))" },
                  ].map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Toolbar: Search + Filter + Group By + Sort By + View Toggle */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, license, phone..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Filter toggle */}
            <button onClick={() => setShowFilters(!showFilters)}
              className={`h-9 px-3 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${showFilters ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}>
              <Filter className="w-3.5 h-3.5" /> Filter
              {(statusFilter !== "All" || licenseFilter !== "All") && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </button>

            {/* Group By */}
            <div className="relative">
              <button onClick={() => { setShowGroupMenu(!showGroupMenu); setShowSortMenu(false); }}
                className={`h-9 px-3 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${groupBy !== "None" ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}>
                <Layers className="w-3.5 h-3.5" /> Group by {groupBy !== "None" && <span className="text-primary font-semibold">• {groupBy}</span>}
                <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {showGroupMenu && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full mt-1 right-0 z-30 w-44 bg-card border border-border rounded-lg shadow-xl p-1">
                    {GROUP_OPTIONS.map(g => (
                      <button key={g} onClick={() => { setGroupBy(g); setShowGroupMenu(false); }}
                        className={`w-full text-left text-xs px-3 py-2 rounded-md transition-all ${groupBy === g ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-secondary"}`}>
                        {g}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sort By */}
            <div className="relative">
              <button onClick={() => { setShowSortMenu(!showSortMenu); setShowGroupMenu(false); }}
                className="h-9 px-3 text-xs font-medium rounded-lg border bg-secondary border-border text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort by…
                <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full mt-1 right-0 z-30 w-44 bg-card border border-border rounded-lg shadow-xl p-1">
                    {SORT_OPTIONS.map((s, i) => (
                      <button key={i} onClick={() => { setSortBy(s); setShowSortMenu(false); }}
                        className={`w-full text-left text-xs px-3 py-2 rounded-md transition-all flex items-center gap-2 ${sortBy === s ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-secondary"}`}>
                        {s.dir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {s.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View Toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button onClick={() => setViewMode("cards")} className={`h-9 px-3 text-xs font-medium transition-all ${viewMode === "cards" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>Cards</button>
              <button onClick={() => setViewMode("table")} className={`h-9 px-3 text-xs font-medium transition-all ${viewMode === "table" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>Table</button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="glass-card p-4 flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Status</label>
                <div className="flex gap-1">
                  {STATUS_FILTERS.map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={`h-7 px-2.5 text-[11px] font-medium rounded-md border transition-all ${statusFilter === s ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">License Category</label>
                <div className="flex gap-1">
                  {LICENSE_CATS.map(c => (
                    <button key={c} onClick={() => setLicenseFilter(c)}
                      className={`h-7 px-2.5 text-[11px] font-medium rounded-md border transition-all ${licenseFilter === c ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}>{c}</button>
                  ))}
                </div>
              </div>
              {(statusFilter !== "All" || licenseFilter !== "All") && (
                <button onClick={() => { setStatusFilter("All"); setLicenseFilter("All"); }}
                  className="h-7 px-2.5 text-[11px] font-medium rounded-md text-destructive hover:bg-destructive/10 transition-all flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">{processed.length} driver{processed.length !== 1 ? "s" : ""} found</p>
        {totalComplaints > 0 && <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{totalComplaints} total complaints</p>}
      </div>

      {/* Content: Grouped sections */}
      {Object.entries(grouped).map(([groupLabel, groupDrivers]) => (
        <div key={groupLabel} className="mb-6">
          {groupLabel && (
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-2">{groupLabel} ({groupDrivers.length})</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}

          {viewMode === "table" ? (
            <DataTable
              data={groupDrivers}
              keyField="id"
              columns={[
                {
                  header: "Driver", accessor: (d: any) => (
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${d.safety_score >= 90 ? "bg-status-available/15 text-status-available" : d.safety_score >= 80 ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                        {d.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{d.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{d.license_number}</p>
                      </div>
                    </div>
                  )
                },
                { header: "License", accessor: (d: any) => (
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px] font-semibold">{d.license_category}</span>
                    <span className={`text-xs ${isExpired(d.license_expiry) ? "text-destructive font-semibold" : daysUntilExpiry(d.license_expiry) < 30 ? "text-status-in-shop" : "text-muted-foreground"}`}>
                      {isExpired(d.license_expiry) ? "EXPIRED" : d.license_expiry}
                      {!isExpired(d.license_expiry) && daysUntilExpiry(d.license_expiry) < 30 && <span className="ml-1">⚠</span>}
                    </span>
                  </div>
                )},
                { header: "Completion", accessor: (d: any) => {
                  const rate = getCompletionRate(d.id);
                  return rate !== null ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className={`h-full rounded-full ${rate >= 80 ? "bg-status-available" : rate >= 60 ? "bg-primary" : "bg-destructive"}`} style={{ width: `${rate}%` }} />
                      </div>
                      <span className="text-xs font-medium">{rate}%</span>
                    </div>
                  ) : <span className="text-xs text-muted-foreground">—</span>;
                }},
                { header: "Safety", accessor: (d: any) => (
                  <div className="flex items-center gap-1.5">
                    <Shield className={`w-3.5 h-3.5 ${d.safety_score >= 90 ? "text-status-available" : d.safety_score >= 80 ? "text-primary" : "text-destructive"}`} />
                    <span className="text-sm font-bold">{d.safety_score}</span>
                    <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${d.safety_score >= 95 ? "bg-status-available/15 text-status-available" : d.safety_score >= 85 ? "bg-primary/15 text-primary" : d.safety_score >= 70 ? "bg-status-in-shop/15 text-status-in-shop" : "bg-destructive/15 text-destructive"}`}>
                      {getSafetyTier(d.safety_score)}
                    </span>
                  </div>
                )},
                { header: "Complaints", accessor: (d: any) => (
                  <span className={`text-sm font-medium ${d.complaints > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {d.complaints}
                  </span>
                )},
                { header: "Status", accessor: (d: any) => <StatusBadge status={d.status} /> },
                { header: "", accessor: (d: any) => (
                  <button onClick={() => setDetailDriver(d)} className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                )},
              ]}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {groupDrivers.map((driver: any, i: number) => {
                const rate = getCompletionRate(driver.id);
                return (
                  <motion.div key={driver.id} initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.04, duration: 0.4 }} whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    className="glass-card p-5 group cursor-pointer" onClick={() => setDetailDriver(driver)}>

                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${driver.safety_score >= 90 ? "bg-status-available/15 text-status-available" : driver.safety_score >= 80 ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                          {driver.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold">{driver.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{driver.license_number}</p>
                        </div>
                      </div>
                      <StatusBadge status={driver.status} />
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="text-center p-2 rounded-lg bg-secondary/50 group-hover:bg-secondary/80 transition-colors">
                        <p className="text-base font-bold">{driver.total_trips}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Trips</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-secondary/50 group-hover:bg-secondary/80 transition-colors">
                        <p className="text-base font-bold">{(driver.total_km / 1000).toFixed(0)}k</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">KM</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-secondary/50 group-hover:bg-secondary/80 transition-colors">
                        <div className="flex items-center justify-center gap-0.5">
                          <Shield className={`w-3 h-3 ${driver.safety_score >= 90 ? "text-status-available" : driver.safety_score >= 80 ? "text-primary" : "text-destructive"}`} />
                          <p className="text-base font-bold">{driver.safety_score}</p>
                        </div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Safety</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-secondary/50 group-hover:bg-secondary/80 transition-colors">
                        <p className={`text-base font-bold ${driver.complaints > 0 ? "text-destructive" : ""}`}>{driver.complaints}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Issues</p>
                      </div>
                    </div>

                    {/* Safety bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">Safety Score</span>
                        <span className={`font-semibold px-1.5 py-0.5 rounded ${driver.safety_score >= 95 ? "bg-status-available/15 text-status-available" : driver.safety_score >= 85 ? "bg-primary/15 text-primary" : driver.safety_score >= 70 ? "bg-status-in-shop/15 text-status-in-shop" : "bg-destructive/15 text-destructive"}`}>
                          {getSafetyTier(driver.safety_score)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${driver.safety_score}%` }}
                          transition={{ delay: i * 0.04 + 0.3, duration: 0.8 }}
                          className={`h-full rounded-full ${driver.safety_score >= 90 ? "bg-status-available" : driver.safety_score >= 80 ? "bg-primary" : "bg-destructive"}`} />
                      </div>
                    </div>

                    {/* Completion Rate */}
                    {rate !== null && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-muted-foreground">Completion Rate</span>
                          <span className="font-semibold flex items-center gap-1">
                            {rate >= 80 ? <TrendingUp className="w-3 h-3 text-status-available" /> : <TrendingDown className="w-3 h-3 text-destructive" />}
                            {rate}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${rate}%` }}
                            transition={{ delay: i * 0.04 + 0.4, duration: 0.6 }}
                            className={`h-full rounded-full ${rate >= 80 ? "bg-status-available" : rate >= 60 ? "bg-primary" : "bg-destructive"}`} />
                        </div>
                      </div>
                    )}

                    {/* License & Phone Row */}
                    <div className="flex items-center justify-between text-xs mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium px-1.5 py-0.5 rounded bg-secondary text-[10px]">{driver.license_category}</span>
                        {isExpired(driver.license_expiry) ? (
                          <span className="text-destructive font-semibold flex items-center gap-1">
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}><AlertTriangle className="w-3 h-3" /></motion.div>
                            EXPIRED
                          </span>
                        ) : (
                          <span className={`${daysUntilExpiry(driver.license_expiry) < 30 ? "text-status-in-shop font-semibold" : "text-muted-foreground"}`}>
                            Exp: {driver.license_expiry}
                            {daysUntilExpiry(driver.license_expiry) < 30 && ` (${daysUntilExpiry(driver.license_expiry)}d)`}
                          </span>
                        )}
                      </div>
                      {driver.phone && (
                        <span className="text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{driver.phone}</span>
                      )}
                    </div>

                    {/* Status toggle */}
                    {canEditDrivers && driver.status !== "On Trip" && (
                      <div className="flex gap-1.5 pt-2 border-t border-border/30">
                        {DRIVER_STATUSES.map(s => (
                          <button key={s} onClick={(e) => { e.stopPropagation(); handleStatusToggle(driver.id, s); }}
                            disabled={driver.status === s}
                            className={`flex-1 h-7 text-[10px] font-semibold rounded-md border transition-all ${driver.status === s ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {processed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No drivers found</p>
          <p className="text-xs text-muted-foreground/60">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Driver Detail Modal */}
      <Dialog open={!!detailDriver} onOpenChange={open => !open && setDetailDriver(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          {detailDriver && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${detailDriver.safety_score >= 90 ? "bg-status-available/15 text-status-available" : detailDriver.safety_score >= 80 ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                    {detailDriver.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-bold">{detailDriver.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge status={detailDriver.status} />
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="py-4 space-y-4">
                {/* Performance Overview */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Total Trips", value: detailDriver.total_trips, icon: Award },
                    { label: "Total KM", value: `${(detailDriver.total_km / 1000).toFixed(1)}k`, icon: TrendingUp },
                    { label: "Safety Score", value: detailDriver.safety_score, icon: Shield },
                    { label: "Complaints", value: detailDriver.complaints, icon: AlertTriangle },
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-lg bg-secondary/50 flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-lg font-bold leading-tight">{item.value}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Completion Rate */}
                {(() => {
                  const rate = getCompletionRate(detailDriver.id);
                  if (rate === null) return null;
                  const cr = completionRates[detailDriver.id];
                  return (
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-muted-foreground">Trip Completion Rate</span>
                        <span className="font-bold">{cr.completed}/{cr.total} ({rate}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${rate >= 80 ? "bg-status-available" : rate >= 60 ? "bg-primary" : "bg-destructive"}`} style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  );
                })()}

                {/* License Info */}
                <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">License Number</span>
                    <span className="font-mono font-medium">{detailDriver.license_number}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium px-1.5 py-0.5 rounded bg-card text-[10px]">{detailDriver.license_category}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Expiry</span>
                    <span className={`font-medium ${isExpired(detailDriver.license_expiry) ? "text-destructive" : daysUntilExpiry(detailDriver.license_expiry) < 30 ? "text-status-in-shop" : ""}`}>
                      {detailDriver.license_expiry}
                      {isExpired(detailDriver.license_expiry) && " (EXPIRED)"}
                      {!isExpired(detailDriver.license_expiry) && daysUntilExpiry(detailDriver.license_expiry) < 30 && ` (${daysUntilExpiry(detailDriver.license_expiry)} days left)`}
                    </span>
                  </div>
                  {detailDriver.phone && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium">{detailDriver.phone}</span>
                    </div>
                  )}
                </div>

                {/* Safety Tier */}
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <Shield className={`w-5 h-5 ${detailDriver.safety_score >= 90 ? "text-status-available" : detailDriver.safety_score >= 80 ? "text-primary" : "text-destructive"}`} />
                  <div>
                    <p className="text-sm font-semibold">{getSafetyTier(detailDriver.safety_score)} Driver</p>
                    <p className="text-[10px] text-muted-foreground">
                      {detailDriver.safety_score >= 95 && "Exceptional safety record. Eligible for premium routes."}
                      {detailDriver.safety_score >= 85 && detailDriver.safety_score < 95 && "Good standing. Consistent safe driving record."}
                      {detailDriver.safety_score >= 70 && detailDriver.safety_score < 85 && "Fair performance. Monitor for improvement."}
                      {detailDriver.safety_score < 70 && "Below threshold. Requires immediate review and retraining."}
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailDriver(null)}>Close</Button>
              </DialogFooter>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Driver Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div key="s" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center py-12">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
                  className="w-16 h-16 rounded-full bg-status-available/20 flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-status-available" />
                </motion.div>
                <p className="text-lg font-semibold">Driver Added!</p>
              </motion.div>
            ) : (
              <motion.div key="f" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="p-2 rounded-lg bg-primary/10"><Users className="w-4 h-4 text-primary" /></div>Add New Driver</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div><label className={labelCls}>Full Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Smith" className={inputCls} />{errors.name && <p className="text-[10px] text-destructive mt-1">{errors.name}</p>}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelCls}>License Number</label><input value={form.license_number} onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))} placeholder="CDL-XXXXX" className={inputCls} />{errors.license_number && <p className="text-[10px] text-destructive mt-1">{errors.license_number}</p>}</div>
                    <div><label className={labelCls}>License Category</label><select value={form.license_category} onChange={e => setForm(f => ({ ...f, license_category: e.target.value }))} className={inputCls + " appearance-none"}>{["A", "B", "C", "CE", "D"].map(c => <option key={c}>{c}</option>)}</select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelCls}>License Expiry</label><input type="date" value={form.license_expiry} onChange={e => setForm(f => ({ ...f, license_expiry: e.target.value }))} className={inputCls} />{errors.license_expiry && <p className="text-[10px] text-destructive mt-1">{errors.license_expiry}</p>}</div>
                    <div><label className={labelCls}>Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 555-0100" className={inputCls} /></div>
                  </div>
                </div>
                <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleAdd} disabled={addDriver.isPending}>{addDriver.isPending ? "Adding..." : "Add Driver"}</Button></DialogFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Drivers;
