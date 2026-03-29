import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

interface RoleGateProps {
  children: React.ReactNode;
  allowed: () => boolean;
  fallback?: string;
}

const RoleGate = ({ children, allowed, fallback = "/" }: RoleGateProps) => {
  const { loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!allowed()) return <Navigate to={fallback} replace />;
  return <>{children}</>;
};

export default RoleGate;
