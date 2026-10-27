import { Search, CalendarCheck, Truck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";

const HowItWorks = () => {
  const { language } = useLanguage();

  const steps = [
    { icon: Search, title: t(language, "step1Title"), subtitle: t(language, "step1Sub"), description: t(language, "step1Desc") },
    { icon: CalendarCheck, title: t(language, "step2Title"), subtitle: t(language, "step2Sub"), description: t(language, "step2Desc") },
    { icon: Truck, title: t(language, "step3Title"), subtitle: t(language, "step3Sub"), description: t(language, "step3Desc") },
  ];

  return (
    <section id="how" className="py-24 bg-primary text-primary-foreground">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{t(language, "howItWorksTitle")}</h2>
          <p className="text-primary-foreground/70 text-lg max-w-xl mx-auto">{t(language, "howItWorksSubtitle")}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="text-center p-8 rounded-2xl bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary text-secondary-foreground mb-6">
                <step.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-1 font-display">{step.title}</h3>
              <p className="text-sm text-secondary mb-3">{step.subtitle}</p>
              <p className="text-primary-foreground/70 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
