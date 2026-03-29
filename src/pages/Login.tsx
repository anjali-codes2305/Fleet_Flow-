import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { Truck, Eye, EyeOff, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable/index";
import loginHero from "@/assets/login-hero.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"manager" | "dispatcher">("dispatcher");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName, selectedRole);
        if (error) throw error;
        toast({ title: "Account created!", description: "Check your email to confirm your account." });
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
      navigate("/");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast({ title: "Error", description: result.error.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left - Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <motion.img initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 1.5 }} src={loginHero} alt="Fleet" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <p className="text-primary font-semibold text-sm uppercase tracking-[0.2em] mb-4">Fleet Management System</p>
            <h2 className="text-4xl font-bold leading-tight mb-3">Command your fleet<br />with confidence</h2>
            <p className="text-muted-foreground max-w-md leading-relaxed">End-to-end fleet visibility, dispatch control, driver compliance, and financial transparency.</p>
            <div className="flex gap-6 mt-8">
              {[{ label: "Real-time Tracking", val: "Live" }, { label: "Auto Validation", val: "✓" }, { label: "Uptime", val: "99.9%" }].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.1 }}>
                  <p className="text-2xl font-bold text-primary">{s.val}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-sm">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Fleet<span className="text-primary">Flow</span></span>
          </motion.div>

          <h1 className="text-2xl font-bold mb-1">{isSignUp ? "Create Account" : "Welcome back"}</h1>
          <p className="text-sm text-muted-foreground mb-8">{isSignUp ? "Sign up to get started with FleetFlow" : "Sign in to your account to continue"}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Full Name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" required className="w-full h-11 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: "manager" as const, label: "Manager", desc: "Full system access" },
                      { value: "dispatcher" as const, label: "Dispatcher", desc: "Trip operations" },
                    ]).map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setSelectedRole(r.value)}
                        className={`p-3 rounded-lg border text-left transition-all ${selectedRole === r.value ? "border-primary bg-primary/10 ring-1 ring-primary/30" : "border-border bg-secondary hover:bg-secondary/80"}`}
                      >
                        <p className={`text-sm font-semibold ${selectedRole === r.value ? "text-primary" : "text-foreground"}`}>{r.label}</p>
                        <p className="text-[10px] text-muted-foreground">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@fleetflow.io" required className="w-full h-11 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="w-full h-11 px-3 pr-10 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading} className="w-full h-11 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:brightness-110 transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-70">
              {isLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
              ) : (
                <>{isSignUp ? "Create Account" : "Sign In"} <ArrowRight className="w-4 h-4" /></>
              )}
            </motion.button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground uppercase tracking-wider">or</span></div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full h-11 bg-secondary border border-border text-foreground font-medium text-sm rounded-lg hover:bg-accent transition-all flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {isGoogleLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full" />
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </motion.button>

            {!isSignUp && (
              <p className="text-center">
                <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">Forgot Password?</Link>
              </p>
            )}
            <p className="text-center text-xs text-muted-foreground">
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:underline font-medium">
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
