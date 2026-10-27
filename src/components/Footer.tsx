import { Tractor } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";

const Footer = () => {
  const { language } = useLanguage();

  return (
    <footer className="bg-foreground text-primary-foreground/60 py-12">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-primary-foreground">
          <Tractor className="h-5 w-5 text-secondary" />
          <span className="font-bold font-display">AgriBook</span>
        </div>
        <p className="text-sm text-center">{t(language, "footerText")}</p>
      </div>
    </footer>
  );
};

export default Footer;
