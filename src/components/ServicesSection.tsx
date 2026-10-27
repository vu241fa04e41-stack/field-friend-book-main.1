import { Sprout, Wheat, Scissors, SprayCan, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";

const ServicesSection = () => {
  const { language } = useLanguage();

  const features = [
    { icon: Sprout, title: t(language, "ploughing"), description: t(language, "ploughingDesc"), price: t(language, "ploughingPrice") },
    { icon: Wheat, title: t(language, "harvestingService"), description: t(language, "harvestingDesc"), price: t(language, "harvestingPrice") },
    { icon: Scissors, title: t(language, "seeding"), description: t(language, "seedingDesc"), price: t(language, "seedingPrice") },
    { icon: SprayCan, title: t(language, "spraying"), description: t(language, "sprayingDesc"), price: t(language, "sprayingPrice") },
    { icon: Trash2, title: t(language, "cleaning"), description: t(language, "cleaningDesc"), price: t(language, "cleaningPrice") },
  ];

  return (
    <section id="services" className="py-24 bg-muted/50 rounded-none">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{t(language, "ourServices")}</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t(language, "servicesSubtitle")}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) =>
            <div key={f.title} className="rounded-2xl bg-card border border-border p-6 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 hover:-translate-y-1" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary/15 mb-4">
                <f.icon className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-lg font-bold font-display mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">{f.description}</p>
              <span className="inline-block bg-primary/10 text-primary font-bold text-sm px-3 py-1 rounded-full">{f.price}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
