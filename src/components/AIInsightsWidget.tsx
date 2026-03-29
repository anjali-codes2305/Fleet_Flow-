import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, AlertTriangle, TrendingUp, RefreshCw, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InsightsData {
  health_score: number;
  status: "green" | "yellow" | "red";
  headline: string;
  insights: string[];
  alerts: string[];
  recommendation: string;
}

const statusConfig = {
  green: { bg: "bg-status-available/10", text: "text-status-available", border: "border-status-available/20", label: "Healthy" },
  yellow: { bg: "bg-status-in-shop/10", text: "text-status-in-shop", border: "border-status-in-shop/20", label: "Attention" },
  red: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/20", label: "Critical" },
};

const AIInsightsWidget = () => {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("fleet-insights");
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      setData(result);
      setExpanded(true);
    } catch (e: any) {
      toast.error(e.message || "Failed to fetch AI insights");
    } finally {
      setLoading(false);
    }
  };

  const config = data ? statusConfig[data.status] : statusConfig.green;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.33 }}
      className="glass-card overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <motion.div
              animate={loading ? { rotate: 360 } : { rotate: 0 }}
              transition={loading ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
              className="p-2 rounded-lg bg-primary/10"
            >
              {loading ? <RefreshCw className="w-4 h-4 text-primary" /> : <Brain className="w-4 h-4 text-primary" />}
            </motion.div>
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                AI Fleet Insights
                <Sparkles className="w-3 h-3 text-primary" />
              </h3>
              <p className="text-[10px] text-muted-foreground">Powered by AI analysis</p>
            </div>
          </div>
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="h-8 px-3 text-[11px] font-medium rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? "Analyzing…" : data ? "Refresh" : "Analyze Fleet"}
          </button>
        </div>

        <AnimatePresence>
          {data && expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 space-y-3"
            >
              {/* Health Score */}
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
                    <motion.circle
                      cx="28" cy="28" r="24" fill="none"
                      stroke={data.status === "green" ? "hsl(var(--status-available))" : data.status === "yellow" ? "hsl(var(--status-in-shop))" : "hsl(var(--destructive))"}
                      strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={`${(data.health_score / 100) * 150.8} 150.8`}
                      initial={{ strokeDasharray: "0 150.8" }}
                      animate={{ strokeDasharray: `${(data.health_score / 100) * 150.8} 150.8` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold">{data.health_score}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.bg} ${config.text} ${config.border} border`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{data.headline}</p>
                </div>
              </div>

              {/* Alerts */}
              {data.alerts.length > 0 && (
                <div className="space-y-1.5">
                  {data.alerts.map((alert, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                      <p className="text-xs text-destructive/90">{alert}</p>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Insights */}
              <div className="space-y-1.5">
                {data.insights.map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + 0.08 * i }}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-secondary/50"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">{insight}</p>
                  </motion.div>
                ))}
              </div>

              {/* Recommendation */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-0.5">Top Recommendation</p>
                  <p className="text-xs">{data.recommendation}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default AIInsightsWidget;
