import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedCounter from "./AnimatedCounter";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  variant?: "default" | "primary" | "warning" | "danger";
  delay?: number;
}

const variantStyles = {
  default: "glow-border",
  primary: "glow-amber border-primary/20",
  warning: "border-status-in-shop/20",
  danger: "border-destructive/20",
};

const iconVariants = {
  default: "bg-secondary text-foreground",
  primary: "bg-primary/10 text-primary",
  warning: "bg-status-in-shop/10 text-status-in-shop",
  danger: "bg-destructive/10 text-destructive",
};

const KPICard = ({ title, value, subtitle, icon: Icon, trend, variant = "default", delay = 0 }: KPICardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
      className={cn("glass-card p-5 group cursor-default ambient-glow", variantStyles[variant])}
    >
      <div className="flex items-start justify-between mb-3">
        <motion.div
          className={cn("p-2.5 rounded-lg relative overflow-hidden", iconVariants[variant])}
          whileHover={{ rotate: [0, -10, 10, -5, 0], scale: 1.1, transition: { duration: 0.6 } }}
        >
          <Icon className="w-5 h-5 relative z-10" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          />
        </motion.div>
        {trend && (
          <motion.span
            initial={{ opacity: 0, scale: 0, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: delay + 0.4, type: "spring", stiffness: 400, damping: 15 }}
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5",
              trend.positive
                ? "bg-status-available/10 text-status-available"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </motion.span>
        )}
      </div>
      <motion.p 
        className="text-sm text-muted-foreground mb-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.15 }}
      >
        {title}
      </motion.p>
      <motion.p 
        className="text-2xl font-bold tracking-tight number-glow"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.2, duration: 0.5 }}
      >
        {typeof value === "number" ? <AnimatedCounter value={value} /> : value}
      </motion.p>
      {subtitle && (
        <motion.p 
          className="text-xs text-muted-foreground mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: delay + 0.3 }}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
};

export default KPICard;
