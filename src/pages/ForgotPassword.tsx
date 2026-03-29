import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, ArrowLeft, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast({ title: "Check your email", description: "We've sent a password reset link." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Truck className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">Fleet<span className="text-primary">Flow</span></span>
        </div>

        {sent ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
            <p className="text-sm text-muted-foreground mb-6">We sent a password reset link to <strong className="text-foreground">{email}</strong></p>
            <button onClick={() => navigate("/login")} className="text-primary text-sm font-medium hover:underline flex items-center gap-1 mx-auto">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </button>
          </motion.div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-1">Forgot Password?</h1>
            <p className="text-sm text-muted-foreground mb-8">Enter your email and we'll send you a reset link.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@fleetflow.io" required
                  className="w-full h-11 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading}
                className="w-full h-11 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                {isLoading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
                ) : "Send Reset Link"}
              </motion.button>
              <button type="button" onClick={() => navigate("/login")} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to Login
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
