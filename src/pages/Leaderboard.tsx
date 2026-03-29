import { useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { useDrivers, useTrips } from "@/hooks/useFleetData";
import { motion } from "framer-motion";
import { Trophy, Medal, Star, TrendingUp, Shield, Route, Fuel, Crown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

const podiumColors = ["hsl(38, 92%, 50%)", "hsl(220, 10%, 70%)", "hsl(25, 70%, 45%)"];
const podiumLabels = ["🥇", "🥈", "🥉"];

const Leaderboard = () => {
  const { data: drivers = [] } = useDrivers();
  const { data: trips = [] } = useTrips();

  const rankedDrivers = useMemo(() => {
    return (drivers as any[]).map((d: any) => {
      const driverTrips = (trips as any[]).filter((t: any) => t.driver_id === d.id);
      const completedTrips = driverTrips.filter((t: any) => t.status === "Completed");
      const totalDistance = completedTrips.reduce((s: number, t: any) => s + Number(t.distance), 0);
      const avgCargoWeight = completedTrips.length > 0
        ? completedTrips.reduce((s: number, t: any) => s + Number(t.cargo_weight), 0) / completedTrips.length
        : 0;

      // Composite score: safety (40%) + trips (30%) + distance (20%) + no complaints (10%)
      const safetyScore = d.safety_score;
      const tripScore = Math.min(100, (d.total_trips / 50) * 100);
      const distScore = Math.min(100, (d.total_km / 50000) * 100);
      const complaintScore = Math.max(0, 100 - d.complaints * 20);

      const compositeScore = Math.round(
        safetyScore * 0.4 + tripScore * 0.3 + distScore * 0.2 + complaintScore * 0.1
      );

      return {
        ...d,
        completedTrips: completedTrips.length,
        totalDistance,
        avgCargoWeight: Math.round(avgCargoWeight),
        compositeScore,
        tripScore: Math.round(tripScore),
        distScore: Math.round(distScore),
        complaintScore: Math.round(complaintScore),
      };
    }).sort((a: any, b: any) => b.compositeScore - a.compositeScore);
  }, [drivers, trips]);

  const top3 = rankedDrivers.slice(0, 3);
  const radarData = top3.map((d: any) => ({
    name: d.name.split(" ")[0],
    Safety: d.safety_score,
    Trips: d.tripScore,
    Distance: d.distScore,
    Reliability: d.complaintScore,
  }));

  const barData = rankedDrivers.slice(0, 8).map((d: any) => ({
    name: d.name.length > 10 ? d.name.split(" ")[0] : d.name,
    score: d.compositeScore,
    safety: d.safety_score,
  }));

  return (
    <div>
      <PageHeader title="Driver Leaderboard" description="Performance rankings based on safety, trips, distance & reliability" />

      {/* Podium */}
      <div className="flex items-end justify-center gap-4 mb-8 pt-4">
        {[1, 0, 2].map((idx) => {
          const driver = top3[idx];
          if (!driver) return null;
          const height = idx === 0 ? 180 : idx === 1 ? 150 : 120;
          const rank = idx + 1;
          return (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.15, type: "spring", stiffness: 200 }}
              className="flex flex-col items-center"
            >
              <motion.div
                className="relative mb-3"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-4"
                  style={{ borderColor: podiumColors[idx], background: `${podiumColors[idx]}20` }}
                >
                  {driver.name.split(" ").map((n: string) => n[0]).join("")}
                </div>
                {rank === 1 && (
                  <motion.div
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute -top-3 -right-1"
                  >
                    <Crown className="w-6 h-6" style={{ color: podiumColors[0] }} />
                  </motion.div>
                )}
              </motion.div>
              <p className="text-sm font-bold text-center">{driver.name}</p>
              <p className="text-xs text-muted-foreground mb-2">{podiumLabels[idx]} Rank #{rank}</p>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height }}
                transition={{ delay: 0.5 + idx * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-t-xl w-24 flex flex-col items-center justify-end pb-3"
                style={{ background: `linear-gradient(180deg, ${podiumColors[idx]}30, ${podiumColors[idx]}10)`, border: `1px solid ${podiumColors[idx]}40` }}
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-2xl font-bold"
                  style={{ color: podiumColors[idx] }}
                >
                  {driver.compositeScore}
                </motion.span>
                <span className="text-[10px] text-muted-foreground">POINTS</span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Top Drivers Comparison
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={[
              { metric: "Safety", ...Object.fromEntries(radarData.map(d => [d.name, d.Safety])) },
              { metric: "Trips", ...Object.fromEntries(radarData.map(d => [d.name, d.Trips])) },
              { metric: "Distance", ...Object.fromEntries(radarData.map(d => [d.name, d.Distance])) },
              { metric: "Reliability", ...Object.fromEntries(radarData.map(d => [d.name, d.Reliability])) },
            ]}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
              {radarData.map((d, i) => (
                <Radar key={d.name} name={d.name} dataKey={d.name} stroke={podiumColors[i]} fill={podiumColors[i]} fillOpacity={0.15} strokeWidth={2} />
              ))}
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {radarData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: podiumColors[i] }} />
                {d.name}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Performance Scores
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={70} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} name="Composite" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Full rankings table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          Complete Rankings
        </h3>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                {["Rank", "Driver", "Safety", "Trips", "Distance", "Complaints", "Score", "Status"].map((h) => (
                  <th key={h} className="text-left text-[11px] uppercase tracking-wider font-semibold text-muted-foreground px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rankedDrivers.map((d: any, i: number) => (
                <motion.tr
                  key={d.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.75 + i * 0.04 }}
                  className="border-b border-border/30 last:border-0 table-row-hover"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold" style={{ color: i < 3 ? podiumColors[i] : "inherit" }}>
                      {i < 3 ? podiumLabels[i] : `#${i + 1}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">{d.name}</p>
                      <p className="text-[11px] text-muted-foreground">{d.license_number} · {d.license_category}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${d.safety_score >= 90 ? "text-status-available" : d.safety_score >= 80 ? "text-primary" : "text-destructive"}`}>
                      {d.safety_score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{d.total_trips}</td>
                  <td className="px-4 py-3 text-sm">{d.total_km.toLocaleString()} km</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${d.complaints === 0 ? "text-status-available" : d.complaints <= 2 ? "text-primary" : "text-destructive"} font-medium`}>
                      {d.complaints}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${d.compositeScore}%` }}
                          transition={{ delay: 0.8 + i * 0.04, duration: 0.6 }}
                          className="h-full rounded-full"
                          style={{ background: i < 3 ? podiumColors[i] : "hsl(var(--primary))" }}
                        />
                      </div>
                      <span className="text-sm font-bold">{d.compositeScore}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                      d.status === "On Duty" ? "bg-status-available/15 text-status-available" :
                      d.status === "On Trip" ? "bg-status-on-trip/15 text-status-on-trip" :
                      d.status === "Suspended" ? "bg-destructive/15 text-destructive" :
                      "bg-secondary text-muted-foreground"
                    }`}>{d.status}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Leaderboard;
