import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, UserCog, Crown, Truck as TruckIcon, HardHat, DollarSign, Plus, CheckCircle2, Copy, Mail } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
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
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppRole>("dispatcher");
  const [addingUser, setAddingUser] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string; role: AppRole } | null>(null);
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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) {
      toast({ title: "Validation Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    
    setAddingUser(true);
    try {
      const tempAuth = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          }
        }
      );

      // Auto-generate strong temporary password
      const autoGenPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) + "A1!";

      const { error: signUpError } = await tempAuth.auth.signUp({
        email: newUserEmail,
        password: autoGenPassword,
        options: {
          data: {
            full_name: newUserName,
            app_role: newUserRole,
          }
        }
      });

      if (signUpError) throw signUpError;
      
      setCreatedCredentials({
        email: newUserEmail,
        password: autoGenPassword,
        role: newUserRole,
      });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Creation Failed", description: err.message, variant: "destructive" });
    } finally {
      setAddingUser(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="User Management" description="Manage user roles and permissions">
        <Button onClick={() => setIsAddingUser(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add User
        </Button>
      </PageHeader>

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

      {/* Add User Modal */}
      <Dialog open={isAddingUser} onOpenChange={(open) => {
        setIsAddingUser(open);
        if (!open) {
          setTimeout(() => {
            setCreatedCredentials(null);
            setNewUserName("");
            setNewUserEmail("");
            setNewUserRole("dispatcher");
          }, 300);
        }
      }}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          {!createdCredentials ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10"><Plus className="w-4 h-4 text-primary" /></div>
                  Create New User
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="py-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Full Name</label>
                  <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Jane Doe" required className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Email</label>
                  <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="jane@fleetflow.io" required className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Initial Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(ROLE_META) as [AppRole, typeof ROLE_META[AppRole]][]).map(([key, meta]) => {
                      const Icon = meta.icon;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setNewUserRole(key)}
                          className={`p-2 rounded-md border text-left transition-all ${newUserRole === key ? `${meta.color} ring-1` : "border-border bg-secondary hover:bg-secondary/80"}`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5" />
                            <p className="text-xs font-semibold">{meta.label}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsAddingUser(false)}>Cancel</Button>
                  <Button type="submit" disabled={addingUser}>
                    {addingUser ? "Creating..." : "Create Account"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          ) : (
            <div className="py-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-lg font-bold mb-1">User Created Successfully!</h3>
              <p className="text-sm text-muted-foreground mb-6">Send these securely generated credentials to the new employee.</p>
              
              <div className="w-full bg-secondary rounded-lg p-4 border border-border mb-6 text-left relative group">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`);
                    toast({ title: "Copied", description: "Credentials copied to clipboard." });
                  }}
                  className="absolute top-2 right-2 p-2 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                  <span className="text-muted-foreground font-medium">Email:</span>
                  <span className="font-mono break-all">{createdCredentials.email}</span>
                  <span className="text-muted-foreground font-medium">Password:</span>
                  <span className="font-mono text-primary font-bold">{createdCredentials.password}</span>
                  <span className="text-muted-foreground font-medium">Role:</span>
                  <span className="font-medium">{ROLE_META[createdCredentials.role].label}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 w-full">
                <Button 
                  className="w-full gap-2" 
                  onClick={() => {
                    const subject = encodeURIComponent("Welcome to FleetFlow - Your Login Credentials");
                    const body = encodeURIComponent(`Hello,\n\nYour new FleetFlow account has been created!\n\nPlease use the following credentials to log in for the first time.\nMake sure to change your password from the dashboard once logged in.\n\nLogin URL: ${window.location.origin}\nEmail: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.password}\n\nWelcome aboard!`);
                    window.open(`mailto:${createdCredentials.email}?subject=${subject}&body=${body}`);
                  }}
                >
                  <Mail className="w-4 h-4" /> Send via Email
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setIsAddingUser(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
