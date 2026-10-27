import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, MapPin, Clock, CheckCircle2 } from "lucide-react";

const DriverDashboard = () => {
  const { profile } = useAuth();
  const [status, setStatus] = useState<"active" | "inactive">("active");

  return (
    <div className="container space-y-8">
      <div className="flex items-center gap-3">
        <Truck className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-display">Driver Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {profile?.full_name || "Driver"}</p>
        </div>
        <Badge className="ml-auto bg-amber-100 text-amber-800 border-amber-300">Driver</Badge>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Clock className="w-4 h-4" /> Current Status</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge className={status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {status === "active" ? "Active" : "Inactive"}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => setStatus(s => s === "active" ? "inactive" : "active")}>
                Toggle
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4" /> Base Location</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-medium">{profile?.place || "Not set"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Completed Jobs</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">0</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No pending bookings assigned to you yet.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverDashboard;
