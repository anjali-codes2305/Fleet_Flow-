import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, UserCog, Crown, Truck as TruckIcon, HardHat, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  role: AppRole | null;
  created_at: string;
}

const ROLE_META: Record<AppRole, { label: string; icon: typeof Crown; color: string }> = {
  manager: { label: "Manager", icon: Crown, color: "bg-primary/15 text-primary border-primary/30" },
  dispatcher: { label: "Dispatcher", icon: TruckIcon, color: "bg-status-dispatched/15 text-status-dispatched border-status-dispatched/30" },
  safety_officer: { label: "Safety Officer", icon: HardHat, color: "bg-status-in-shop/15 text-status-in-shop border-status-in-shop/30" },
  financial_analyst: { label: "Finance Analyst", icon: DollarSign, color: "bg-status-available/15 text-status-available border-status-available/30" },
};

const UserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<AppRole>("dispatcher");
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const fetchUsers = async () => {
    setLoading(true);
    // Fetch profiles and roles
    const { data: profiles, error: pErr } = await supabase.from("profiles").select("id, email, full_name, created_at");
    const { data: roles, error: rErr } = await supabase.from("user_roles").select("user_id, role");

    if (pErr || rErr) {
      toast({ title: "Error loading users", description: pErr?.message || rErr?.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const roleMap = new Map((roles || []).map(r => [r.user_id, r.role as AppRole]));
    setUsers((profiles || []).map(p => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      role: roleMap.get(p.id) || null,
      created_at: p.created_at,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSaveRole = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      // Upsert: if role row exists update, else insert
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", editUser.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole } as any)
          .eq("user_id", editUser.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: editUser.id, role: newRole } as any);
        if (error) throw error;
      }

      toast({ title: "Role Updated", description: `${editUser.full_name || editUser.email} is now ${ROLE_META[newRole].label}` });
      setEditUser(null);
      fetchUsers();
      qc.invalidateQueries({ queryKey: ["user_role"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="User Management" description="Manage user roles and permissions" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {(Object.entries(ROLE_META) as [AppRole, typeof ROLE_META[AppRole]][]).map(([key, meta], i) => {
          const count = users.filter(u => u.role === key).length;
          const Icon = meta.icon;
          return (
            <motion.div key={key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-md border ${meta.color}`}><Icon className="w-3.5 h-3.5" /></div>
                <span className="text-xs font-semibold text-muted-foreground">{meta.label}s</span>
              </div>
              <p className="text-2xl font-bold">{count}</p>
            </motion.div>
          );
        })}
      </div>

      <DataTable
        data={users}
        keyField="id"
        columns={[
          { header: "User", accessor: (u: UserWithRole) => (
            <div>
              <p className="font-medium">{u.full_name || "—"}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>
          )},
          { header: "Role", accessor: (u: UserWithRole) => {
            if (!u.role) return <span className="text-xs text-muted-foreground">No role</span>;
            const meta = ROLE_META[u.role];
            const Icon = meta.icon;
            return (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${meta.color}`}>
                <Icon className="w-3 h-3" />{meta.label}
              </span>
            );
          }},
          { header: "Joined", accessor: (u: UserWithRole) => new Date(u.created_at).toLocaleDateString() },
          { header: "Actions", accessor: (u: UserWithRole) => (
            <button
              onClick={() => { setEditUser(u); setNewRole(u.role || "dispatcher"); }}
              className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
              title="Change Role"
            >
              <UserCog className="w-4 h-4" />
            </button>
          )},
        ]}
      />

      {/* Edit Role Modal */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10"><Shield className="w-4 h-4 text-primary" /></div>
              Change Role
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm mb-1 font-medium">{editUser?.full_name || editUser?.email}</p>
            <p className="text-xs text-muted-foreground mb-4">{editUser?.email}</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(ROLE_META) as [AppRole, typeof ROLE_META[AppRole]][]).map(([key, meta]) => {
                const Icon = meta.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setNewRole(key)}
                    className={`p-3 rounded-lg border text-left transition-all ${newRole === key ? `${meta.color} ring-1` : "border-border bg-secondary hover:bg-secondary/80"}`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <p className="text-xs font-semibold">{meta.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleSaveRole} disabled={saving}>
              {saving ? "Saving..." : "Save Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
