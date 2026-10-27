import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, AlertTriangle, Shield, Truck, Clock, Wheat, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { t, ADVANCE_AMOUNT } from "@/lib/i18n";
import FieldMap from "./FieldMap";
import type { TractorService } from "./TractorCard";

type BookingType = "daily" | "area" | "combo";

interface ComboPackage {
  name: string;
  nameKey: string;
  services: string[];
  discountPercent: number;
}

const COMBO_PACKAGES: ComboPackage[] = [
  { name: "Ploughing + Sowing", nameKey: "ploughingAndSowing", services: ["Ploughing", "Seeding"], discountPercent: 10 },
  { name: "Full Season Package", nameKey: "fullSeasonPackage", services: ["Ploughing", "Seeding", "Harvesting"], discountPercent: 15 },
];

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tractorName: string;
  pricePerDay: number;
  services: TractorService[];
  vehicleType?: string;
}

const DRIVER_RATE = 1000;
const MACHINE_RATE = 1400;
const FUEL_RATE_PER_HOUR = 150;

const BookingDialog = ({ open, onOpenChange, tractorName, pricePerDay, services, vehicleType = "tractor" }: BookingDialogProps) => {
  const { language } = useLanguage();
  const [step, setStep] = useState(0); // 0 = choose type, 1-3 = flow steps
  const [bookingType, setBookingType] = useState<BookingType>("daily");

  // Common
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [village, setVillage] = useState("");
  const [fieldLocation, setFieldLocation] = useState<[number, number]>([15.5, 78.5]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // Key 1 - Daily
  const [fuelOption, setFuelOption] = useState<"farmer_provides" | "meter_based">("farmer_provides");

  // Key 2 - Area/Hourly
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [acres, setAcres] = useState("1");
  const [purpose, setPurpose] = useState("");
  const [workMode, setWorkMode] = useState<"area" | "hourly">("area");
  const [estimatedHours, setEstimatedHours] = useState("8");
  const [hourlyRate, setHourlyRate] = useState("300");

  // Key 3 - Combo
  const [selectedCombo, setSelectedCombo] = useState<string>("");

  const { toast } = useToast();

  const days = startDate && endDate
    ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Calculate costs based on booking type
  const calculateCosts = () => {
    if (bookingType === "daily") {
      const driverCost = days * DRIVER_RATE;
      const machineCost = days * MACHINE_RATE;
      const fuelCost = fuelOption === "meter_based" ? days * 8 * FUEL_RATE_PER_HOUR : 0;
      return { driverCost, machineCost, fuelCost, serviceCost: 0, discount: 0, total: driverCost + machineCost + fuelCost };
    }

    if (bookingType === "area") {
      if (workMode === "hourly") {
        const total = Number(estimatedHours) * Number(hourlyRate);
        return { driverCost: 0, machineCost: 0, fuelCost: 0, serviceCost: total, discount: 0, total };
      }
      const serviceCost = selectedServices.reduce((sum, sName) => {
        const svc = services.find((s) => s.name === sName);
        return sum + (svc ? svc.pricePerAcre * Number(acres || 0) : 0);
      }, 0);
      return { driverCost: 0, machineCost: 0, fuelCost: 0, serviceCost, discount: 0, total: serviceCost };
    }

    // Combo
    const combo = COMBO_PACKAGES.find(c => c.name === selectedCombo);
    if (!combo) return { driverCost: 0, machineCost: 0, fuelCost: 0, serviceCost: 0, discount: 0, total: 0 };
    const serviceCost = combo.services.reduce((sum, sName) => {
      const svc = services.find((s) => s.name === sName);
      return sum + (svc ? svc.pricePerAcre * Number(acres || 0) : 0);
    }, 0);
    const discount = serviceCost * (combo.discountPercent / 100);
    return { driverCost: 0, machineCost: 0, fuelCost: 0, serviceCost, discount, total: serviceCost - discount };
  };

  const costs = calculateCosts();
  const balanceAfterAdvance = Math.max(0, costs.total - ADVANCE_AMOUNT);

  const toggleService = (sName: string) => {
    setSelectedServices((prev) => prev.includes(sName) ? prev.filter((n) => n !== sName) : [...prev, sName]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    setSaving(true);
    try {
      const combo = COMBO_PACKAGES.find(c => c.name === selectedCombo);
      const { error } = await supabase.from("bookings").insert({
        tractor_name: tractorName,
        services: bookingType === "combo" ? (combo?.services || []) : selectedServices,
        acres: Number(acres),
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        total_cost: costs.total,
        farmer_name: name,
        farmer_phone: phone,
        farmer_email: email || null,
        village,
        field_lat: fieldLocation[0],
        field_lng: fieldLocation[1],
        advance_amount: ADVANCE_AMOUNT,
        advance_paid: true,
        vehicle_type: vehicleType,
        status: "pending_confirmation",
        booking_type: bookingType,
        driver_rate: DRIVER_RATE,
        machine_rate: MACHINE_RATE,
        fuel_option: fuelOption,
        fuel_rate_per_hour: fuelOption === "meter_based" ? FUEL_RATE_PER_HOUR : 0,
        fuel_total: costs.fuelCost,
        purpose: purpose || (bookingType === "combo" ? selectedCombo : ""),
        hourly_rate: workMode === "hourly" ? Number(hourlyRate) : 0,
        hours_worked: workMode === "hourly" ? Number(estimatedHours) : 0,
        combo_package_name: selectedCombo,
        combo_discount_percent: bookingType === "combo" ? (combo?.discountPercent || 0) : 0,
      });
      if (error) throw error;
      setSubmitted(true);
      toast({ title: `${t(language, "bookingConfirmed")} ✅`, description: `${tractorName} — ${t(language, "ownerMustConfirm")}` });
    } catch (err) {
      console.error("Booking error:", err);
      toast({ title: "Booking Failed", description: "Please try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setSubmitted(false); setStep(0); setBookingType("daily");
      setStartDate(undefined); setEndDate(undefined);
      setSelectedServices([]); setAcres("1"); setName(""); setPhone("");
      setEmail(""); setVillage(""); setFieldLocation([15.5, 78.5]);
      setFuelOption("farmer_provides"); setPurpose(""); setWorkMode("area");
      setEstimatedHours("8"); setHourlyRate("300"); setSelectedCombo("");
    }
    onOpenChange(val);
  };

  // ======================== SUCCESS SCREEN ========================
  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <CheckCircle2 className="h-16 w-16 text-primary" />
            <h3 className="text-2xl font-bold font-display">{t(language, "bookingConfirmed")} ✅</h3>
            <div className="rounded-xl bg-muted p-4 w-full text-left space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t(language, "vehicles")}</span><span className="font-medium">{tractorName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t(language, "chooseBookingType")}</span><span className="font-medium capitalize">{bookingType}</span></div>
              {days > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{t(language, "days")}</span><span className="font-medium">{days}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">{t(language, "village")}</span><span className="font-medium">{village}</span></div>
              {bookingType === "daily" && (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t(language, "driverCharge")}</span><span>₹{costs.driverCost.toLocaleString("en-IN")}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t(language, "machineCharge")}</span><span>₹{costs.machineCost.toLocaleString("en-IN")}</span></div>
                  {costs.fuelCost > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{t(language, "fuelCharge")}</span><span>₹{costs.fuelCost.toLocaleString("en-IN")}</span></div>}
                </>
              )}
              <div className="flex justify-between font-bold text-primary border-t pt-2"><span>{t(language, "totalCost")}</span><span>₹{costs.total.toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t(language, "advanceFee")}</span><span className="font-bold text-secondary">₹{ADVANCE_AMOUNT}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t(language, "balanceRemaining")}</span><span>₹{balanceAfterAdvance.toLocaleString("en-IN")}</span></div>
            </div>
            <div className="rounded-xl bg-secondary/10 border border-secondary/30 p-3 w-full text-left text-sm flex items-start gap-2">
              <Shield className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">{t(language, "ownerConfirmation")}</p>
                <p className="text-muted-foreground">{t(language, "ownerMustConfirm")}</p>
              </div>
            </div>
            <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 w-full text-left text-sm flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <p className="text-muted-foreground">{t(language, "nonRefundable")}</p>
            </div>
            <a href={`https://www.google.com/maps?q=${fieldLocation[0]},${fieldLocation[1]}`} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
              📍 {t(language, "fieldLocation")} →
            </a>
            <Button onClick={() => handleClose(false)} className="mt-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">{t(language, "done")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ======================== STEP LABELS ========================
  const totalSteps = 4;
  const stepLabels = [
    t(language, "chooseBookingType"),
    bookingType === "daily" ? t(language, "dailyRate") : bookingType === "area" ? t(language, "areaWork") : t(language, "comboPackage"),
    t(language, "selectDates"),
    t(language, "yourDetails"),
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{tractorName} — {t(language, "bookNow")}</DialogTitle>
          <DialogDescription>{stepLabels[step]}</DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-4">
          {Array.from({ length: totalSteps }).map((_, s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors", step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{s + 1}</div>
              {s < totalSteps - 1 && <div className={cn("h-0.5 w-6 rounded", step > s ? "bg-primary" : "bg-muted")} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* ========== STEP 0: Choose Booking Type ========== */}
          {step === 0 && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">{t(language, "chooseBookingType")}</Label>
              <div className="space-y-3">
                {/* Daily Rate */}
                <label
                  className={cn("flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors",
                    bookingType === "daily" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}
                  onClick={() => setBookingType("daily")}
                >
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", bookingType === "daily" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{t(language, "dailyRate")}</p>
                    <p className="text-sm text-muted-foreground">{t(language, "dailyRateDesc")}</p>
                    <div className="flex gap-3 mt-2 text-xs">
                      <span className="bg-muted px-2 py-1 rounded-full">{t(language, "driver")}: ₹{DRIVER_RATE.toLocaleString("en-IN")}/{t(language, "perDay").replace("/ ", "")}</span>
                      <span className="bg-muted px-2 py-1 rounded-full">🚜 ₹{MACHINE_RATE.toLocaleString("en-IN")}/{t(language, "perDay").replace("/ ", "")}</span>
                    </div>
                  </div>
                </label>

                {/* Area/Hourly */}
                <label
                  className={cn("flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors",
                    bookingType === "area" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}
                  onClick={() => setBookingType("area")}
                >
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", bookingType === "area" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    <Wheat className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t(language, "areaWork")}</p>
                    <p className="text-sm text-muted-foreground">{t(language, "areaWorkDesc")}</p>
                  </div>
                </label>

                {/* Combo Package */}
                <label
                  className={cn("flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors",
                    bookingType === "combo" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}
                  onClick={() => setBookingType("combo")}
                >
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", bookingType === "combo" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t(language, "comboPackage")}</p>
                    <p className="text-sm text-muted-foreground">{t(language, "comboPackageDesc")}</p>
                  </div>
                </label>
              </div>

              <Button type="button" onClick={() => setStep(1)} className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 py-5">
                {t(language, "next")} →
              </Button>
            </div>
          )}

          {/* ========== STEP 1: Type-Specific Details ========== */}
          {step === 1 && bookingType === "daily" && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/50 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t(language, "driverRate")}</span>
                  <span className="font-bold text-foreground">₹{DRIVER_RATE.toLocaleString("en-IN")} {t(language, "perDay")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t(language, "machineRate")}</span>
                  <span className="font-bold text-foreground">₹{MACHINE_RATE.toLocaleString("en-IN")} {t(language, "perDay")}</span>
                </div>
                <div className="text-xs text-muted-foreground">8 {t(language, "hours")} = 1 {t(language, "perDay").replace("/ ", "")}</div>
              </div>

              <div className="space-y-2">
                <Label className="text-base">{t(language, "fuelOption")}</Label>
                <RadioGroup value={fuelOption} onValueChange={(v) => setFuelOption(v as any)}>
                  <label className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer", fuelOption === "farmer_provides" ? "border-primary bg-primary/5" : "border-border")}>
                    <RadioGroupItem value="farmer_provides" />
                    <div>
                      <p className="font-medium">{t(language, "farmerProvidesFuel")}</p>
                      <p className="text-xs text-muted-foreground">No fuel charge — you fill the tank</p>
                    </div>
                  </label>
                  <label className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer", fuelOption === "meter_based" ? "border-primary bg-primary/5" : "border-border")}>
                    <RadioGroupItem value="meter_based" />
                    <div>
                      <p className="font-medium">{t(language, "meterBasedFuel")}</p>
                      <p className="text-xs text-muted-foreground">₹{FUEL_RATE_PER_HOUR}{t(language, "perHour")} — charged by usage meter</p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(0)} className="flex-1 rounded-full py-5">← {t(language, "back")}</Button>
                <Button type="button" onClick={() => setStep(2)} className="flex-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 py-5">{t(language, "next")} →</Button>
              </div>
            </div>
          )}

          {step === 1 && bookingType === "area" && (
            <div className="space-y-4">
              {/* Toggle: Area vs Hourly */}
              <div className="flex gap-2">
                <Button type="button" variant={workMode === "area" ? "default" : "outline"} onClick={() => setWorkMode("area")} className="flex-1 rounded-full">
                  {t(language, "areaOfWork")}
                </Button>
                <Button type="button" variant={workMode === "hourly" ? "default" : "outline"} onClick={() => setWorkMode("hourly")} className="flex-1 rounded-full">
                  {t(language, "hourlyWork")}
                </Button>
              </div>

              {workMode === "area" && (
                <>
                  <Label className="text-base">{t(language, "selectServices")}</Label>
                  <div className="space-y-2">
                    {services.map((svc) => (
                      <label key={svc.name} className={cn("flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors", selectedServices.includes(svc.name) ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}>
                        <div className="flex items-center gap-3">
                          <Checkbox checked={selectedServices.includes(svc.name)} onCheckedChange={() => toggleService(svc.name)} />
                          <span className="font-medium">{svc.name}</span>
                        </div>
                        <span className="text-sm text-primary font-semibold">₹{svc.pricePerAcre.toLocaleString("en-IN")}{t(language, "perAcre")}</span>
                      </label>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acres">{t(language, "howManyAcres")}</Label>
                    <Input id="acres" type="number" min="1" value={acres} onChange={(e) => setAcres(e.target.value)} />
                  </div>
                </>
              )}

              {workMode === "hourly" && (
                <>
                  <div className="space-y-2">
                    <Label>{t(language, "hourlyRate")} (₹)</Label>
                    <Input type="number" min="100" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t(language, "estimatedHours")}</Label>
                    <Input type="number" min="1" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>{t(language, "workPurpose")}</Label>
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger><SelectValue placeholder={t(language, "purpose")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ploughing">{t(language, "ploughing")}</SelectItem>
                    <SelectItem value="sowing">{t(language, "seeding")}</SelectItem>
                    <SelectItem value="harvesting">{t(language, "harvestingService")}</SelectItem>
                    <SelectItem value="spraying">{t(language, "spraying")}</SelectItem>
                    <SelectItem value="cleaning">{t(language, "cleaning")}</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(0)} className="flex-1 rounded-full py-5">← {t(language, "back")}</Button>
                <Button type="button" onClick={() => setStep(2)} disabled={workMode === "area" && selectedServices.length === 0} className="flex-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 py-5">{t(language, "next")} →</Button>
              </div>
            </div>
          )}

          {step === 1 && bookingType === "combo" && (
            <div className="space-y-4">
              <Label className="text-base">{t(language, "selectPackage")}</Label>
              <div className="space-y-3">
                {COMBO_PACKAGES.map((pkg) => {
                  const pkgCost = pkg.services.reduce((sum, sName) => {
                    const svc = services.find((s) => s.name === sName);
                    return sum + (svc ? svc.pricePerAcre : 0);
                  }, 0);
                  const savings = pkgCost * (pkg.discountPercent / 100);
                  const available = pkg.services.every(s => services.some(svc => svc.name === s));

                  return (
                    <label key={pkg.name} className={cn("block p-4 rounded-xl border cursor-pointer transition-colors", !available && "opacity-50 cursor-not-allowed", selectedCombo === pkg.name ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="combo" checked={selectedCombo === pkg.name} onChange={() => setSelectedCombo(pkg.name)} disabled={!available} className="accent-primary" />
                        <div className="flex-1">
                          <p className="font-semibold">{t(language, pkg.nameKey as any)}</p>
                          <p className="text-xs text-muted-foreground">{pkg.services.join(" + ")}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-primary">-{pkg.discountPercent}%</span>
                          <p className="text-xs text-green-600">{t(language, "packageSavings")}: ₹{savings.toLocaleString("en-IN")}{t(language, "perAcre")}</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="space-y-2">
                <Label htmlFor="combo-acres">{t(language, "howManyAcres")}</Label>
                <Input id="combo-acres" type="number" min="1" value={acres} onChange={(e) => setAcres(e.target.value)} />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(0)} className="flex-1 rounded-full py-5">← {t(language, "back")}</Button>
                <Button type="button" onClick={() => setStep(2)} disabled={!selectedCombo} className="flex-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 py-5">{t(language, "next")} →</Button>
              </div>
            </div>
          )}

          {/* ========== STEP 2: Select Dates ========== */}
          {step === 2 && (
            <div className="space-y-4">
              <Label className="text-base">{t(language, "selectDates")}</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">{t(language, "startDate")}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd MMM yyyy") : t(language, "selectDates")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} disabled={(d) => d < new Date()} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">{t(language, "endDate")}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd MMM yyyy") : t(language, "selectDates")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={(d) => d < (startDate || new Date())} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Cost Summary */}
              {days > 0 && (
                <div className="rounded-xl bg-muted p-4 space-y-2 text-sm">
                  {bookingType === "daily" && (
                    <>
                      <div className="flex justify-between"><span>{t(language, "driverCharge")}</span><span>{days} × ₹{DRIVER_RATE.toLocaleString("en-IN")} = ₹{costs.driverCost.toLocaleString("en-IN")}</span></div>
                      <div className="flex justify-between"><span>{t(language, "machineCharge")}</span><span>{days} × ₹{MACHINE_RATE.toLocaleString("en-IN")} = ₹{costs.machineCost.toLocaleString("en-IN")}</span></div>
                      {costs.fuelCost > 0 && <div className="flex justify-between"><span>{t(language, "fuelCharge")}</span><span>₹{costs.fuelCost.toLocaleString("en-IN")}</span></div>}
                    </>
                  )}
                  {bookingType === "area" && workMode === "hourly" && (
                    <div className="flex justify-between"><span>{t(language, "hourlyWork")}</span><span>{estimatedHours}h × ₹{Number(hourlyRate).toLocaleString("en-IN")} = ₹{costs.total.toLocaleString("en-IN")}</span></div>
                  )}
                  {bookingType === "area" && workMode === "area" && costs.serviceCost > 0 && (
                    <div className="flex justify-between"><span>{t(language, "serviceCharge")}</span><span>₹{costs.serviceCost.toLocaleString("en-IN")}</span></div>
                  )}
                  {bookingType === "combo" && (
                    <>
                      <div className="flex justify-between"><span>{t(language, "serviceCharge")}</span><span>₹{costs.serviceCost.toLocaleString("en-IN")}</span></div>
                      {costs.discount > 0 && <div className="flex justify-between text-green-600"><span>{t(language, "comboDiscount")}</span><span>-₹{costs.discount.toLocaleString("en-IN")}</span></div>}
                    </>
                  )}
                  <div className="flex justify-between font-bold text-base text-primary border-t border-border pt-2"><span>{t(language, "total")}</span><span>₹{costs.total.toLocaleString("en-IN")}</span></div>
                  <div className="flex justify-between text-secondary font-semibold"><span>{t(language, "advanceFee")} ({t(language, "nonRefundable")})</span><span>₹{ADVANCE_AMOUNT}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>{t(language, "balanceRemaining")}</span><span>₹{balanceAfterAdvance.toLocaleString("en-IN")}</span></div>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-full py-5">← {t(language, "back")}</Button>
                <Button type="button" onClick={() => setStep(3)} disabled={!startDate || !endDate} className="flex-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 py-5">{t(language, "next")} →</Button>
              </div>
            </div>
          )}

          {/* ========== STEP 3: Your Details ========== */}
          {step === 3 && (
            <div className="space-y-4">
              <Label className="text-base">{t(language, "yourDetails")}</Label>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="fname">{t(language, "name")}</Label>
                  <Input id="fname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="femail">{t(language, "email")}</Label>
                  <Input id="femail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fphone">{t(language, "phone")}</Label>
                  <Input id="fphone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fvillage">{t(language, "village")}</Label>
                  <Input id="fvillage" value={village} onChange={(e) => setVillage(e.target.value)} placeholder="Your village" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">{t(language, "fieldLocation")}</Label>
                <FieldMap position={fieldLocation} onPositionChange={setFieldLocation} />
              </div>

              {/* Advance Payment Summary */}
              <div className="rounded-xl bg-secondary/10 border border-secondary/30 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t(language, "totalCost")}</span>
                  <span className="text-xl font-bold text-primary">₹{costs.total.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center border-t border-secondary/20 pt-2">
                  <span className="font-semibold text-secondary">{t(language, "advanceFee")} (₹{ADVANCE_AMOUNT})</span>
                  <span className="text-lg font-bold text-secondary">₹{ADVANCE_AMOUNT}</span>
                </div>
                <p className="text-xs text-destructive font-medium">{t(language, "nonRefundable")}</p>
                <p className="text-xs text-muted-foreground">{t(language, "ownerMustConfirm")}</p>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 rounded-full py-5">← {t(language, "back")}</Button>
                <Button type="submit" disabled={!name || !phone || !village || saving} className="flex-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 py-5 text-base">
                  {saving ? "..." : `${t(language, "payAdvance")} ✅`}
                </Button>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
