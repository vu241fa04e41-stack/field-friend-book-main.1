import { useState } from "react";
import { Tractor, Phone, User, Menu, X, Globe, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { t, LANGUAGES, Language } from "@/lib/i18n";
import { useNavigate, useLocation } from "react-router-dom";

interface NavbarProps {
  onLoginClick?: () => void;
}

const Navbar = ({ onLoginClick }: NavbarProps) => {
  const { language, setLanguage } = useLanguage();
  const { user, role, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDashboard = () => navigate("/dashboard");
  const handleHome = () => navigate("/");
  const handleSignOut = async () => { await signOut(); navigate("/"); };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-foreground/80 backdrop-blur-md border-b border-primary-foreground/10">
      <div className="container flex items-center justify-between h-16">
        <button onClick={handleHome} className="flex items-center gap-2 text-primary-foreground">
          <Tractor className="h-6 w-6 text-secondary" />
          <span className="text-lg font-bold font-display">AgriBook</span>
        </button>
        <div className="hidden md:flex items-center gap-4 text-sm text-primary-foreground/70">
          {location.pathname === "/" && (
            <>
              <a href="#fleet" className="hover:text-primary-foreground transition-colors">{t(language, "fleet")}</a>
              <a href="#services" className="hover:text-primary-foreground transition-colors">{t(language, "services")}</a>
              <a href="#how" className="hover:text-primary-foreground transition-colors">{t(language, "howToBook")}</a>
            </>
          )}
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" />
            <span>+91 98765 43210</span>
          </div>

          <div className="flex items-center gap-1">
            <Globe className="h-4 w-4 text-secondary" />
            <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
              <SelectTrigger className="h-8 w-28 bg-transparent border-primary-foreground/20 text-primary-foreground text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>{lang.nativeLabel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleDashboard} className="rounded-full border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                <LayoutDashboard className="h-4 w-4 mr-1" /> Dashboard
              </Button>
              <Button size="sm" variant="ghost" onClick={handleSignOut} className="rounded-full text-primary-foreground/60 hover:text-primary-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={onLoginClick} className="rounded-full border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
              <User className="h-4 w-4 mr-1" /> {t(language, "login")}
            </Button>
          )}
        </div>
        <button className="md:hidden text-primary-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-foreground/95 backdrop-blur-md border-t border-primary-foreground/10 p-4 space-y-3 text-primary-foreground/70">
          {location.pathname === "/" && (
            <>
              <a href="#fleet" className="block py-2" onClick={() => setMobileOpen(false)}>{t(language, "fleet")}</a>
              <a href="#services" className="block py-2" onClick={() => setMobileOpen(false)}>{t(language, "services")}</a>
              <a href="#how" className="block py-2" onClick={() => setMobileOpen(false)}>{t(language, "howToBook")}</a>
            </>
          )}
          <div className="flex items-center gap-2 py-2">
            <Globe className="h-4 w-4 text-secondary" />
            <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
              <SelectTrigger className="flex-1 h-9 bg-transparent border-primary-foreground/20 text-primary-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>{lang.nativeLabel} · {lang.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {user ? (
            <div className="space-y-2">
              <Button size="sm" variant="outline" onClick={() => { setMobileOpen(false); handleDashboard(); }} className="w-full rounded-full border-secondary text-secondary">
                <LayoutDashboard className="h-4 w-4 mr-1" /> Dashboard
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setMobileOpen(false); handleSignOut(); }} className="w-full rounded-full text-primary-foreground/60">
                <LogOut className="h-4 w-4 mr-1" /> Sign Out
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => { setMobileOpen(false); onLoginClick?.(); }} className="w-full rounded-full border-secondary text-secondary">
              <User className="h-4 w-4 mr-1" /> {t(language, "login")}
            </Button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
