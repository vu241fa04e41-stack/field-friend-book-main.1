import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Award, AlertTriangle, User, Tractor, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";

interface DriverInfo {
  name: string;
  phone: string;
  place: string;
  experience: string;
  status: "available" | "on_duty" | "off_duty";
  pairedTractor: string | null;
}

interface TractorInfo {
  name: string;
  vehicleNumber: string;
  status: "idle" | "in_operation" | "maintenance";
  pairedDriver: string | null;
}

const DRIVERS: DriverInfo[] = [
  { name: "Rajesh Kumar", phone: "9440123456", place: "Kurnool", experience: "5 Years – Swaraj 744", status: "available", pairedTractor: "Swaraj 744 FE" },
  { name: "Krishna", phone: "9123456789", place: "Hyderabad", experience: "8 Years – Mahindra 575", status: "on_duty", pairedTractor: "Mahindra 575 DI" },
  { name: "Sreenu", phone: "9234567890", place: "Bellary", experience: "6 Years – John Deere", status: "on_duty", pairedTractor: "John Deere 5310" },
  { name: "Madhav", phone: "9345612345", place: "Madurai", experience: "4 Years – Farmtrac 60", status: "available", pairedTractor: null },
  { name: "Ganesh", phone: "9098765432", place: "Pune", experience: "3 Years – Massey Ferguson", status: "off_duty", pairedTractor: null },
  { name: "Suresh", phone: "9123498765", place: "Guntur", experience: "7 Years – Trolley Ops", status: "available", pairedTractor: "Mahindra Trolley 10T" },
  { name: "Anil", phone: "9087654321", place: "Ahmedabad", experience: "10 Years – Harvester", status: "on_duty", pairedTractor: "John Deere W70" },
];

const TRACTORS: TractorInfo[] = [
  { name: "Swaraj 744 FE", vehicleNumber: "AP-39-T-1234", status: "idle", pairedDriver: "Rajesh Kumar" },
  { name: "Mahindra 575 DI", vehicleNumber: "TS-12-T-5678", status: "in_operation", pairedDriver: "Krishna" },
  { name: "John Deere 5310", vehicleNumber: "KA-05-T-9012", status: "in_operation", pairedDriver: "Sreenu" },
  { name: "Farmtrac 60 EPI", vehicleNumber: "TN-45-T-3456", status: "maintenance", pairedDriver: null },
  { name: "Massey Ferguson 241", vehicleNumber: "MH-14-T-7890", status: "idle", pairedDriver: null },
  { name: "Mahindra Trolley 10T", vehicleNumber: "AP-21-TR-4567", status: "in_operation", pairedDriver: "Suresh" },
  { name: "John Deere W70", vehicleNumber: "GJ-06-H-2345", status: "in_operation", pairedDriver: "Anil" },
];

const CHART_COLORS = {
  available: "hsl(142, 71%, 45%)",
  on_duty: "hsl(37, 92%, 50%)",
  off_duty: "hsl(0, 72%, 50%)",
  idle: "hsl(142, 71%, 45%)",
  in_operation: "hsl(37, 92%, 50%)",
  maintenance: "hsl(0, 72%, 50%)",
  paired: "hsl(142, 71%, 45%)",
  driver_only: "hsl(37, 92%, 50%)",
  tractor_only: "hsl(217, 91%, 60%)",
  no_action: "hsl(0, 0%, 70%)",
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    available: "bg-green-100 text-green-800 border-green-300",
    on_duty: "bg-amber-100 text-amber-800 border-amber-300",
    off_duty: "bg-red-100 text-red-800 border-red-300",
    idle: "bg-green-100 text-green-800 border-green-300",
    in_operation: "bg-amber-100 text-amber-800 border-amber-300",
    maintenance: "bg-red-100 text-red-800 border-red-300",
  };
  const labels: Record<string, string> = {
    available: "Available", on_duty: "On Duty", off_duty: "Off Duty",
    idle: "Idle", in_operation: "In Operation", maintenance: "Maintenance",
  };
  return <Badge variant="outline" className={map[status] || ""}>{labels[status] || status}</Badge>;
};

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

interface ResourceDashboardProps {
  interactive?: boolean;
}

const ResourceDashboard = ({ interactive = false }: ResourceDashboardProps) => {
  const { language } = useLanguage();
  const [drillDown, setDrillDown] = useState<{ chart: string; segment: string } | null>(null);

  const driverStats = useMemo(() => {
    const counts = { available: 0, on_duty: 0, off_duty: 0 };
    DRIVERS.forEach(d => counts[d.status]++);
    return [
      { name: "Available", value: counts.available, color: CHART_COLORS.available, key: "available" },
      { name: "On Duty", value: counts.on_duty, color: CHART_COLORS.on_duty, key: "on_duty" },
      { name: "Off Duty", value: counts.off_duty, color: CHART_COLORS.off_duty, key: "off_duty" },
    ];
  }, []);

  const tractorStats = useMemo(() => {
    const counts = { idle: 0, in_operation: 0, maintenance: 0 };
    TRACTORS.forEach(t => counts[t.status]++);
    return [
      { name: "Idle", value: counts.idle, color: CHART_COLORS.idle, key: "idle" },
      { name: "In Operation", value: counts.in_operation, color: CHART_COLORS.in_operation, key: "in_operation" },
      { name: "Under Maintenance", value: counts.maintenance, color: CHART_COLORS.maintenance, key: "maintenance" },
    ];
  }, []);

  const pairingStats = useMemo(() => {
    const paired = DRIVERS.filter(d => d.pairedTractor && d.status !== "off_duty").length;
    const driverOnly = DRIVERS.filter(d => !d.pairedTractor && d.status === "available").length;
    const tractorOnly = TRACTORS.filter(t => !t.pairedDriver && t.status === "idle").length;
    const noAction = DRIVERS.filter(d => d.status === "off_duty").length;
    return [
      { name: "Paired", value: paired, color: CHART_COLORS.paired, key: "paired" },
      { name: "Driver Only", value: driverOnly, color: CHART_COLORS.driver_only, key: "driver_only" },
      { name: "Tractor Only", value: tractorOnly, color: CHART_COLORS.tractor_only, key: "tractor_only" },
      { name: "No Action", value: noAction, color: CHART_COLORS.no_action, key: "no_action" },
    ];
  }, []);

  const driverOnlyAlerts = DRIVERS.filter(d => d.status === "available" && !d.pairedTractor);

  // Drill-down data
  const getDrillDownDrivers = () => {
    if (!drillDown) return [];
    const { chart, segment } = drillDown;
    if (chart === "driver") {
      return DRIVERS.filter(d => d.status === segment);
    }
    if (chart === "pairing") {
      if (segment === "paired") return DRIVERS.filter(d => d.pairedTractor && d.status !== "off_duty");
      if (segment === "driver_only") return DRIVERS.filter(d => !d.pairedTractor && d.status === "available");
      if (segment === "no_action") return DRIVERS.filter(d => d.status === "off_duty");
    }
    return [];
  };

  const handlePieClick = (chart: string) => (data: any, index: number) => {
    if (!interactive) return;
    const chartData = chart === "driver" ? driverStats : chart === "tractor" ? tractorStats : pairingStats;
    const segment = chartData[index]?.key;
    if (segment) {
      setDrillDown(prev => prev?.chart === chart && prev?.segment === segment ? null : { chart, segment });
    }
  };

  const drillDrivers = getDrillDownDrivers();

  return (
    <section id="resources" className="py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-playfair">
            {t(language, "resourceDashboard") || "Resource Dashboard"}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Live overview of driver & tractor availability, pairing status, and resource utilization.
            {interactive && <span className="block text-sm mt-1 text-primary">Click any pie segment to drill down.</span>}
          </p>
        </div>

        {/* Alerts */}
        {driverOnlyAlerts.length > 0 && (
          <div className="mb-8 space-y-3">
            {driverOnlyAlerts.map(driver => (
              <div key={driver.name} className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-xl px-5 py-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="text-sm text-amber-900 font-medium">
                  <strong>{driver.name}</strong> is available but has no tractor assigned.
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 3 Pie Charts */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <PieCard title="Driver Status" data={driverStats} interactive={interactive} onClick={handlePieClick("driver")} />
          <PieCard title="Tractor Status" data={tractorStats} interactive={interactive} onClick={handlePieClick("tractor")} />
          <PieCard title="Driver-Tractor Pairing" data={pairingStats} interactive={interactive} onClick={handlePieClick("pairing")} />
        </div>

        {/* Drill-down panel */}
        {interactive && drillDown && drillDrivers.length > 0 && (
          <Card className="mb-8 border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-playfair flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  {drillDown.segment.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())} Drivers ({drillDrivers.length})
                </CardTitle>
                <Button size="sm" variant="ghost" onClick={() => setDrillDown(null)}><X className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {drillDrivers.map(driver => (
                  <div key={driver.name} className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{driver.name}</h4>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3" /> {driver.place}
                        </div>
                      </div>
                      {statusBadge(driver.status)}
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        <a href={`tel:${driver.phone}`} className="hover:text-primary transition-colors">{driver.phone}</a>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Award className="w-3.5 h-3.5" /><span>{driver.experience}</span>
                      </div>
                      {driver.pairedTractor && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Tractor className="w-3.5 h-3.5" /><span className="text-xs">{driver.pairedTractor}</span>
                        </div>
                      )}
                    </div>
                    {driver.status === "available" && (
                      <Button size="sm" className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                        Book Now
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Driver Details */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-playfair">
              <User className="w-5 h-5 text-primary" /> Driver Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {DRIVERS.map(driver => (
                <div key={driver.name} className="rounded-xl border border-border/50 bg-card p-4 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{driver.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="w-3 h-3" /> {driver.place}
                      </div>
                    </div>
                    {statusBadge(driver.status)}
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" />
                      <a href={`tel:${driver.phone}`} className="hover:text-primary transition-colors">{driver.phone}</a>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Award className="w-3.5 h-3.5" /><span>{driver.experience}</span>
                    </div>
                    {driver.pairedTractor && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Tractor className="w-3.5 h-3.5" /><span className="text-xs">{driver.pairedTractor}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

interface PieCardProps {
  title: string;
  data: { name: string; value: number; color: string; key: string }[];
  interactive?: boolean;
  onClick?: (data: any, index: number) => void;
}

const PieCard = ({ title, data, interactive, onClick }: PieCardProps) => (
  <Card className={`border-border/50 ${interactive ? "cursor-pointer hover:shadow-lg transition-shadow" : ""}`}>
    <CardHeader className="pb-2">
      <CardTitle className="text-base font-semibold text-center">{title}</CardTitle>
    </CardHeader>
    <CardContent className="pb-4">
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={CustomLabel}
              onClick={onClick}
              style={interactive ? { cursor: "pointer" } : undefined}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip formatter={(value: number, name: string) => [`${value}`, name]} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {interactive && <p className="text-xs text-center text-muted-foreground mt-2">Click a segment to view details</p>}
    </CardContent>
  </Card>
);

export default ResourceDashboard;
