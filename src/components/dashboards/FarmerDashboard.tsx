import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, ClipboardList, MapPin } from "lucide-react";
import ResourceDashboard from "@/components/ResourceDashboard";

const FarmerDashboard = () => {
  const { profile } = useAuth();

  return (
    <div className="container space-y-8">
      <div className="flex items-center gap-3">
        <Leaf className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-display">Farmer Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {profile?.full_name || "Farmer"}</p>
        </div>
        <Badge className="ml-auto bg-green-100 text-green-800 border-green-300">Farmer</Badge>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><ClipboardList className="w-4 h-4" /> My Bookings</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">0</p><p className="text-xs text-muted-foreground">Book a tractor from the home page</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4" /> My Location</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-medium">{profile?.place || "Not set"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Leaf className="w-4 h-4" /> Available Drivers</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">3</p><p className="text-xs text-muted-foreground">Ready to book now</p></CardContent>
        </Card>
      </div>

      <ResourceDashboard interactive />
    </div>
  );
};

export default FarmerDashboard;
