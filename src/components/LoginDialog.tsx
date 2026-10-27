import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, User, LogIn, Globe, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { t, LANGUAGES, Language } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoginDialog = ({ open, onOpenChange }: LoginDialogProps) => {
  const { language, setLanguage } = useLanguage();
  const { user, profile, role, signIn, signUp, signOut } = useAuth();
  const { toast } = useToast();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regLocation, setRegLocation] = useState("");
  const [showVerifyMsg, setShowVerifyMsg] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(regEmail, regPassword, regName, regPhone, regLocation);
    setLoading(false);
    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } else {
      setShowVerifyMsg(true);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({ title: "Google login failed", description: String(result.error), variant: "destructive" });
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    setLoading(false);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setShowVerifyMsg(false);
      setIsRegister(false);
      setEmail(""); setPassword("");
      setRegName(""); setRegPhone(""); setRegEmail(""); setRegPassword(""); setRegLocation("");
    }
    onOpenChange(val);
  };

  // Logged-in view
  if (user) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <CheckCircle2 className="h-16 w-16 text-primary" />
            <h3 className="text-2xl font-bold font-display">{t(language, "welcome")}</h3>
            <div className="bg-muted rounded-xl p-4 w-full text-left space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t(language, "name")}</span><span className="font-medium">{profile?.full_name || user.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t(language, "email")}</span><span className="font-medium">{user.email}</span></div>
              {profile?.phone && <div className="flex justify-between"><span className="text-muted-foreground">{t(language, "phone")}</span><span className="font-medium">{profile.phone}</span></div>}
              {profile?.place && <div className="flex justify-between"><span className="text-muted-foreground">{t(language, "location")}</span><span className="font-medium">{profile.place}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="font-medium capitalize">{role || "farmer"}</span></div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button onClick={() => handleClose(false)} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">{t(language, "done")}</Button>
              <Button variant="outline" onClick={signOut} className="rounded-full">Sign Out</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Email verification message
  if (showVerifyMsg) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <CheckCircle2 className="h-16 w-16 text-primary" />
            <h3 className="text-2xl font-bold font-display">{t(language, "registrationComplete")} ✅</h3>
            <p className="text-muted-foreground text-sm">Please check your email and verify your account before signing in.</p>
            <Button onClick={() => { setShowVerifyMsg(false); setIsRegister(false); }} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">{t(language, "login")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            {isRegister ? <><User className="h-6 w-6" /> {t(language, "register")}</> : <><LogIn className="h-6 w-6" /> {t(language, "login")}</>}
          </DialogTitle>
          <DialogDescription>
            {isRegister ? t(language, "createAccount") : t(language, "loginToAccount")}
          </DialogDescription>
        </DialogHeader>

        {/* Language Selector */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border">
          <Globe className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">{t(language, "selectLanguage")}:</Label>
          <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
            <SelectTrigger className="flex-1 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>{lang.nativeLabel} · {lang.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Google OAuth */}
        <Button variant="outline" onClick={handleGoogleLogin} disabled={loading} className="w-full rounded-full py-5 gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue with Google"}
        </Button>

        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">or</span></div>
        </div>

        {!isRegister ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lemail">{t(language, "email")}</Label>
              <Input id="lemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lpass">{t(language, "password")}</Label>
              <Input id="lpass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 py-5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} {t(language, "login")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t(language, "noAccount")}{" "}
              <button type="button" onClick={() => setIsRegister(true)} className="text-primary font-semibold underline">{t(language, "register")}</button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="rname">{t(language, "name")}</Label>
              <Input id="rname" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Your name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remail">{t(language, "email")}</Label>
              <Input id="remail" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="you@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rphone">{t(language, "phone")}</Label>
              <Input id="rphone" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="+91 98765 43210" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rloc">{t(language, "location")}</Label>
              <Input id="rloc" value={regLocation} onChange={(e) => setRegLocation(e.target.value)} placeholder="Village, District, State" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rpass">{t(language, "password")}</Label>
              <Input id="rpass" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 py-5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} {t(language, "register")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t(language, "haveAccount")}{" "}
              <button type="button" onClick={() => setIsRegister(false)} className="text-primary font-semibold underline">{t(language, "login")}</button>
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
