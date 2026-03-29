import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type StatusType = string;

const statusStyles: Record<string, string> = {
  // Vehicle statuses
  "Available": "bg-status-available/15 text-status-available border-status-available/30",
  "On Trip": "bg-status-on-trip/15 text-status-on-trip border-status-on-trip/30",
  "In Shop": "bg-status-in-shop/15 text-status-in-shop border-status-in-shop/30",
  "Out of Service": "bg-status-out-of-service/15 text-status-out-of-service border-status-out-of-service/30",
  // Driver statuses
  "On Duty": "bg-status-on-duty/15 text-status-on-duty border-status-on-duty/30",
  "Off Duty": "bg-status-off-duty/15 text-status-off-duty border-status-off-duty/30",
  "Suspended": "bg-status-suspended/15 text-status-suspended border-status-suspended/30",
  // Trip statuses
  "Draft": "bg-status-draft/15 text-status-draft border-status-draft/30",
  "Dispatched": "bg-status-dispatched/15 text-status-dispatched border-status-dispatched/30",
  "Completed": "bg-status-completed/15 text-status-completed border-status-completed/30",
  "Cancelled": "bg-status-cancelled/15 text-status-cancelled border-status-cancelled/30",
  // Maintenance
  "In Progress": "bg-status-in-shop/15 text-status-in-shop border-status-in-shop/30",
  "Scheduled": "bg-status-dispatched/15 text-status-dispatched border-status-dispatched/30",
};

const statusDots: Record<string, string> = {
  "Available": "bg-status-available",
  "On Trip": "bg-status-on-trip",
  "In Shop": "bg-status-in-shop",
  "Out of Service": "bg-status-out-of-service",
  "On Duty": "bg-status-on-duty",
  "Off Duty": "bg-status-off-duty",
  "Suspended": "bg-status-suspended",
  "Draft": "bg-status-draft",
  "Dispatched": "bg-status-dispatched",
  "Completed": "bg-status-completed",
  "Cancelled": "bg-status-cancelled",
  "In Progress": "bg-status-in-shop",
  "Scheduled": "bg-status-dispatched",
};

const activeDots = ["Available", "On Trip", "On Duty", "Dispatched", "In Progress"];

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const isActive = activeDots.includes(status);
  
  return (
    <span className={cn(
      "status-pill border text-[11px] font-semibold uppercase tracking-wider",
      statusStyles[status] || "bg-muted text-muted-foreground border-border",
      className
    )}>
      <span className="relative flex items-center justify-center">
        <span className={cn("w-1.5 h-1.5 rounded-full", statusDots[status] || "bg-muted-foreground")} />
        {isActive && (
          <motion.span
            className={cn("absolute w-1.5 h-1.5 rounded-full", statusDots[status] || "bg-muted-foreground")}
            animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </span>
      {status}
    </span>
  );
};

export default StatusBadge;
