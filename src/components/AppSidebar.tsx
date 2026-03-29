import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Truck, Route, Users, Wrench, BarChart3, Fuel, LogOut, ChevronLeft, Menu, Shield, UserCog, Trophy } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import ThemeToggle from "@/components/ThemeToggle";

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { role, isManager, canAccessMaintenance, canAccessExpenses, canAccessAnalytics } = useUserRole();

  const navItems = [
    { label: "Command Center", path: "/", icon: LayoutDashboard, visible: true },
    { label: "Vehicle Registry", path: "/vehicles", icon: Truck, visible: true },
    { label: "Trip Dispatcher", path: "/trips", icon: Route, visible: true },
    { label: "Drivers", path: "/drivers", icon: Users, visible: true },
    { label: "Performance", path: "/performance", icon: Shield, visible: true },
    { label: "Maintenance", path: "/maintenance", icon: Wrench, visible: canAccessMaintenance },
    { label: "Fuel & Expenses", path: "/expenses", icon: Fuel, visible: canAccessExpenses },
    { label: "Analytics", path: "/analytics", icon: BarChart3, visible: canAccessAnalytics },
    { label: "Leaderboard", path: "/leaderboard", icon: Trophy, visible: true },
    { label: "User Management", path: "/users", icon: UserCog, visible: isManager },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || "FM";

  const roleBadge = role ? {
    manager: { label: "Manager", color: "bg-primary/20 text-primary" },
    dispatcher: { label: "Dispatcher", color: "bg-status-dispatched/20 text-status-dispatched" },
    safety_officer: { label: "Safety", color: "bg-status-in-shop/20 text-status-in-shop" },
    financial_analyst: { label: "Finance", color: "bg-status-available/20 text-status-available" },
  }[role] : null;

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn("h-screen sticky top-0 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 z-50", collapsed ? "w-[68px]" : "w-[240px]")}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <motion.div whileHover={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 0.4 }} className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Truck className="w-4.5 h-4.5 text-primary-foreground" />
        </motion.div>
        <AnimatePresence>
          {!collapsed && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="text-base font-bold tracking-tight text-foreground overflow-hidden whitespace-nowrap">Fleet<span className="text-primary">Flow</span></motion.span>}
        </AnimatePresence>
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground transition-colors">
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <div className="px-3 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">{initials}</div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden">
                <p className="text-xs font-semibold whitespace-nowrap truncate max-w-[140px]">{user?.user_metadata?.full_name || "Fleet Manager"}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {roleBadge && (
                    <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md", roleBadge.color)}>
                      {roleBadge.label}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {!collapsed && <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">Operations</p>}
        {navItems.filter(item => item.visible).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink key={item.path} to={item.path} className={cn("relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200", isActive ? "text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
              {isActive && <motion.div layoutId="activeNav" className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/20" transition={{ type: "spring", stiffness: 350, damping: 30 }} />}
              <item.icon className={cn("w-[18px] h-[18px] shrink-0 relative z-10", isActive && "text-primary")} />
              <AnimatePresence>{!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 whitespace-nowrap">{item.label}</motion.span>}</AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-2 border-t border-sidebar-border space-y-0.5">
        <ThemeToggle collapsed={collapsed} />
        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors">
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          <AnimatePresence>{!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">Sign Out</motion.span>}</AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
};

export default AppSidebar;
