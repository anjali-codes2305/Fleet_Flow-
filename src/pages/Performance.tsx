import { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { useDrivers, useTrips } from "@/hooks/useFleetData";
import {
  Search, Shield, AlertTriangle, Users, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  Layers, ChevronDown, X, TrendingUp, TrendingDown, Eye, Phone, Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import KPICard from "@/components/KPICard";

const STATUS_FILTERS = ["All", "On Duty", "Off Duty", "On Trip", "Suspended"];
const SORT_OPTIONS = [
  { label: "Name A-Z", key: "name", dir: "asc" },
  { label: "Name Z-A", key: "name", dir: "desc" },
  { label: "Safety ↑", key: "safety_score", dir: "desc" },
  { label: "Safety ↓", key: "safety_score", dir: "asc" },
  { label: "Complaints ↑", key: "complaints", dir: "desc" },
  { label: "Expiry Soon", key: "license_expiry", dir: "asc" },
] as const;
const GROUP_OPTIONS = ["None", "Status", "Safety Tier"];

const Performance = () => {
  const { data: drivers = [], isLoading } = useDrivers();
  const { data: trips = [] } = useTrips();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState<typeof SORT_OPTIONS[number]>(SORT_OPTIONS[0]);
  const [groupBy, setGroupBy] = useState("None");
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [detailDriver, setDetailDriver] = useState<any>(null);

  const isExpired = (date: string) => new Date(date) < new Date();
  const daysUntilExpiry = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

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

  const processed = useMemo(() => {
    let list = (drivers as any[]).filter((d: any) => {
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.license_number.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || d.status === statusFilter;
      return matchSearch && matchStatus;
    });
    list = [...list].sort((a, b) => {
      const key = sortBy.key;
      const dir = sortBy.dir === "asc" ? 1 : -1;
      if (key === "name") return a.name.localeCompare(b.name) * dir;
      if (key === "license_expiry") return (new Date(a.license_expiry).getTime() - new Date(b.license_expiry).getTime()) * dir;
      return ((a[key] ?? 0) - (b[key] ?? 0)) * dir;
    });
    return list;
  }, [drivers, search, statusFilter, sortBy]);

  const grouped = useMemo(() => {
    if (groupBy === "None") return { "": processed };
    const groups: Record<string, any[]> = {};
    processed.forEach(d => {
      let key = groupBy === "Status" ? d.status : getSafetyTier(d.safety_score);
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });
    return groups;
  }, [processed, groupBy]);

  const allDrivers = drivers as any[];
  const avgSafety = allDrivers.length > 0 ? Math.round(allDrivers.reduce((s, d) => s + d.safety_score, 0) / allDrivers.length) : 0;
  const totalComplaints = allDrivers.reduce((s, d) => s + (d.complaints ?? 0), 0);
  const expiredLicenses = allDrivers.filter(d => isExpired(d.license_expiry)).length;
  const eliteDrivers = allDrivers.filter(d => d.safety_score >= 95).length;

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="Driver Performance & Safety Profiles" description="Track compliance, safety scores, completion rates, and reported issues" />

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <KPICard title="Avg Safety Score" value={avgSafety} icon={Shield} delay={0} />
        <KPICard title="Elite Drivers" value={eliteDrivers} icon={Award} variant="primary" delay={0.04} />
        <KPICard title="Total Complaints" value={totalComplaints} icon={AlertTriangle} variant="warning" delay={0.08} />
        <KPICard title="Expired Licenses" value={expiredLicenses} icon={AlertTriangle} variant="warning" delay={0.12} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, license..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Group By */}
            <div className="relative">
              <button onClick={() => { setShowGroupMenu(!showGroupMenu); setShowSortMenu(false); }}
                className={`h-9 px-3 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${groupBy !== "None" ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}>
                <Layers className="w-3.5 h-3.5" /> Group by
                <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {showGroupMenu && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full mt-1 right-0 z-30 w-44 bg-card border border-border rounded-lg shadow-xl p-1">
                    {GROUP_OPTIONS.map(g => (
                      <button key={g} onClick={() => { setGroupBy(g); setShowGroupMenu(false); }}
                        className={`w-full text-left text-xs px-3 py-2 rounded-md transition-all ${groupBy === g ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-secondary"}`}>{g}</button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Filter */}
            <button onClick={() => setShowFilters(!showFilters)}
              className={`h-9 px-3 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${showFilters ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}>
              <Filter className="w-3.5 h-3.5" /> Filter
              {statusFilter !== "All" && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </button>

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
              {statusFilter !== "All" && (
                <button onClick={() => setStatusFilter("All")}
                  className="h-7 px-2.5 text-[11px] font-medium rounded-md text-destructive hover:bg-destructive/10 transition-all flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">{processed.length} driver{processed.length !== 1 ? "s" : ""} found</p>
      </div>

      {/* Data Table */}
      {Object.entries(grouped).map(([groupLabel, groupDrivers]) => (
        <div key={groupLabel} className="mb-6">
          {groupLabel && (
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-2">{groupLabel} ({groupDrivers.length})</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}
          <DataTable
            data={groupDrivers}
            keyField="id"
            onRowClick={(d: any) => setDetailDriver(d)}
            columns={[
              { header: "Name", accessor: (d: any) => (
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${d.safety_score >= 90 ? "bg-status-available/15 text-status-available" : d.safety_score >= 80 ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                    {d.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <span className="font-medium text-sm">{d.name}</span>
                </div>
              )},
              { header: "License#", accessor: (d: any) => <span className="font-mono text-xs">{d.license_number}</span> },
              { header: "Expiry", accessor: (d: any) => (
                <span className={`text-xs ${isExpired(d.license_expiry) ? "text-destructive font-semibold" : daysUntilExpiry(d.license_expiry) < 30 ? "text-status-in-shop font-semibold" : "text-muted-foreground"}`}>
                  {isExpired(d.license_expiry) ? "EXPIRED" : d.license_expiry}
                  {!isExpired(d.license_expiry) && daysUntilExpiry(d.license_expiry) < 30 && " ⚠"}
                </span>
              )},
              { header: "Completion Rate", accessor: (d: any) => {
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
              { header: "Safety Score", accessor: (d: any) => (
                <div className="flex items-center gap-1.5">
                  <Shield className={`w-3.5 h-3.5 ${d.safety_score >= 90 ? "text-status-available" : d.safety_score >= 80 ? "text-primary" : "text-destructive"}`} />
                  <span className="text-sm font-bold">{d.safety_score}</span>
                  <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${d.safety_score >= 95 ? "bg-status-available/15 text-status-available" : d.safety_score >= 85 ? "bg-primary/15 text-primary" : d.safety_score >= 70 ? "bg-status-in-shop/15 text-status-in-shop" : "bg-destructive/15 text-destructive"}`}>
                    {getSafetyTier(d.safety_score)}
                  </span>
                </div>
              )},
              { header: "Complaints", accessor: (d: any) => (
                <span className={`text-sm font-medium ${d.complaints > 0 ? "text-destructive" : "text-muted-foreground"}`}>{d.complaints}</span>
              )},
              { header: "Status", accessor: (d: any) => <StatusBadge status={d.status} /> },
            ]}
          />
        </div>
      ))}

      {processed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No drivers found</p>
          <p className="text-xs text-muted-foreground/60">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Detail Modal */}
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
                    <StatusBadge status={detailDriver.status} />
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
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
                        <div className={`h-full rounded-full ${rate >= 80 ? "bg-status-available" : rate >= 60 ? "bg-primary" : "bg-destructive"}`} style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  );
                })()}
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
                    </span>
                  </div>
                  {detailDriver.phone && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium">{detailDriver.phone}</span>
                    </div>
                  )}
                </div>
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
    </div>
  );
};

export default Performance;
