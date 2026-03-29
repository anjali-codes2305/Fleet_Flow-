import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleGate from "@/components/RoleGate";
import RealtimeNotifications from "@/components/RealtimeNotifications";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Vehicles from "@/pages/Vehicles";
import Trips from "@/pages/Trips";
import Drivers from "@/pages/Drivers";
import Performance from "@/pages/Performance";
import Maintenance from "@/pages/Maintenance";
import Expenses from "@/pages/Expenses";
import Analytics from "@/pages/Analytics";
import NotFound from "@/pages/NotFound";
import UserManagement from "@/pages/UserManagement";
import Leaderboard from "@/pages/Leaderboard";
import { useUserRole } from "@/hooks/useUserRole";

const queryClient = new QueryClient();

// Wrapper components that use the hook inside the provider tree
const MaintenanceGuarded = () => {
  const { canAccessMaintenance } = useUserRole();
  return (
    <RoleGate allowed={() => canAccessMaintenance}>
      <Maintenance />
    </RoleGate>
  );
};

const ExpensesGuarded = () => {
  const { canAccessExpenses } = useUserRole();
  return (
    <RoleGate allowed={() => canAccessExpenses}>
      <Expenses />
    </RoleGate>
  );
};

const AnalyticsGuarded = () => {
  const { canAccessAnalytics } = useUserRole();
  return (
    <RoleGate allowed={() => canAccessAnalytics}>
      <Analytics />
    </RoleGate>
  );
};

const UserManagementGuarded = () => {
  const { isManager } = useUserRole();
  return (
    <RoleGate allowed={() => isManager}>
      <UserManagement />
    </RoleGate>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RealtimeNotifications />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/vehicles" element={<Vehicles />} />
              <Route path="/trips" element={<Trips />} />
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/maintenance" element={<MaintenanceGuarded />} />
              <Route path="/expenses" element={<ExpensesGuarded />} />
              <Route path="/analytics" element={<AnalyticsGuarded />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/users" element={<UserManagementGuarded />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
