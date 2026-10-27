import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Fuel, Gauge, Settings2, Sprout, Scissors, Wheat, SprayCan, Trash2, User, Phone, Truck, MapPin, Hash, Clock, CalendarClock } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import BookingDialog from "./BookingDialog";

export interface TractorService {
  name: string;
  icon: React.ElementType;
  pricePerAcre: number;
}

export interface TractorOwner {
  name: string;
  phone: string;
  image?: string;
}

export interface TractorData {
  name: string;
  image: string;
  hp: number;
  fuel: string;
  fuelCapacity: string;
  type: string;
  pricePerDay: number;
  available: boolean;
  services: TractorService[];
  owner: TractorOwner;
  driver: TractorOwner;
  vehicleType?: "tractor" | "trolley" | "harvester" | "other";
  vehicleNumber?: string;
  serviceArea?: string;
  serviceLocation?: [number, number];
  confirmationHours?: number;
  detailsUpdatedAt?: string;
}

const serviceIcons: Record<string, React.ElementType> = {
  Ploughing: Sprout,
  Harvesting: Wheat,
  Seeding: Scissors,
  Spraying: SprayCan,
  Cleaning: Trash2,
};

const vehicleTypeIcons: Record<string, React.ElementType> = {
  tractor: Truck,
  trolley: Truck,
  harvester: Wheat,
  other: Truck,
};

const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

const isUpdateRequired = (updatedAt?: string) => {
  if (!updatedAt) return true;
  const diff = Date.now() - new Date(updatedAt).getTime();
  return diff > 15 * 24 * 60 * 60 * 1000; // 15 days
};

const TractorCard = ({
  name, image, hp, fuel, fuelCapacity, type, pricePerDay, available, services, owner, driver,
  vehicleType = "tractor", vehicleNumber, serviceArea, confirmationHours = 2.5, detailsUpdatedAt
}: TractorData) => {
  const { language } = useLanguage();
  const [bookingOpen, setBookingOpen] = useState(false);

  const VehicleIcon = vehicleTypeIcons[vehicleType] || Truck;
  const needsUpdate = isUpdateRequired(detailsUpdatedAt);

  return (
    <>
      <div className="group rounded-2xl bg-card overflow-hidden border border-border transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img src={image} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <Badge className={`absolute top-4 right-4 ${available ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {available ? "Available" : "Booked"}
          </Badge>
          <Badge className="absolute top-4 left-4 bg-secondary text-secondary-foreground text-xs">
            <VehicleIcon className="h-3 w-3 mr-1" />
            {t(language, vehicleType as any)}
          </Badge>
          {vehicleNumber && (
            <Badge className="absolute bottom-4 left-4 bg-background/90 text-foreground text-xs font-mono backdrop-blur-sm">
              <Hash className="h-3 w-3 mr-1" />
              {vehicleNumber}
            </Badge>
          )}
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold mb-2 font-display">{name}</h3>
          <div className="flex flex-wrap gap-3 mb-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Gauge className="h-4 w-4 text-secondary" />{hp} HP</span>
            <span className="flex items-center gap-1.5"><Fuel className="h-4 w-4 text-secondary" />{fuel} · {fuelCapacity}</span>
            <span className="flex items-center gap-1.5"><Settings2 className="h-4 w-4 text-secondary" />{type}</span>
          </div>

          {/* Service Area */}
          {serviceArea && (
            <div className="flex items-center gap-2 mb-3 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">{t(language, "serviceArea")}:</span>
              <span className="font-medium text-foreground">{serviceArea}</span>
            </div>
          )}

          {/* Confirmation time limit */}
          <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5 text-secondary" />
            <span>{t(language, "confirmationTimeLimit")}: <strong className="text-foreground">{confirmationHours} {t(language, "hoursLimit")}</strong></span>
          </div>

          {/* Owner & Driver with avatars */}
          <div className="mb-4 p-3 rounded-xl bg-muted/50 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                {owner.image ? <AvatarImage src={owner.image} alt={owner.name} /> : null}
                <AvatarFallback className="text-xs bg-primary/20 text-primary">{getInitials(owner.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-muted-foreground">{t(language, "owner")}:</span>
                <p className="font-medium text-foreground text-sm truncate">{owner.name}</p>
              </div>
              <a href={`tel:${owner.phone}`} className="flex items-center gap-1 text-primary hover:underline shrink-0">
                <Phone className="h-3 w-3" />
                <span className="text-xs">{owner.phone}</span>
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                {driver.image ? <AvatarImage src={driver.image} alt={driver.name} /> : null}
                <AvatarFallback className="text-xs bg-secondary/20 text-secondary">{getInitials(driver.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-muted-foreground">{t(language, "driver")}:</span>
                <p className="font-medium text-foreground text-sm truncate">{driver.name}</p>
              </div>
              <a href={`tel:${driver.phone}`} className="flex items-center gap-1 text-secondary hover:underline shrink-0">
                <Phone className="h-3 w-3" />
                <span className="text-xs">{driver.phone}</span>
              </a>
            </div>

            {/* 15-day update indicator */}
            {needsUpdate && (
              <div className="flex items-center gap-1.5 text-xs text-destructive mt-1 pt-1 border-t border-border">
                <Clock className="h-3 w-3" />
                <span>{t(language, "updateRequired")}</span>
              </div>
            )}
          </div>

          <div className="mb-5">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">{t(language, "services")}</p>
            <div className="flex flex-wrap gap-1.5">
              {services.map((s) => {
                const Icon = serviceIcons[s.name] || Sprout;
                return (
                  <span key={s.name} className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2.5 py-1 text-foreground">
                    <Icon className="h-3 w-3 text-secondary" />
                    {s.name}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">{t(language, "driverRate")}: ₹1,000{t(language, "perDay")} | 🚜 ₹1,400{t(language, "perDay")}</span>
                <span className="text-2xl font-bold text-primary">₹{pricePerDay.toLocaleString("en-IN")}</span>
                <span className="text-muted-foreground text-xs">{t(language, "perDay")} ({t(language, "machineRate")})</span>
              </div>
            </div>
            <Button onClick={() => setBookingOpen(true)} disabled={!available} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              {t(language, "bookNow")}
            </Button>
          </div>
        </div>
      </div>
      <BookingDialog open={bookingOpen} onOpenChange={setBookingOpen} tractorName={name} pricePerDay={pricePerDay} services={services} vehicleType={vehicleType} />
    </>
  );
};

export default TractorCard;
