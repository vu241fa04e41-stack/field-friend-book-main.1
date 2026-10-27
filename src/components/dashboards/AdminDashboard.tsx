import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Tractor, ClipboardList } from "lucide-react";
import ResourceDashboard from "@/components/ResourceDashboard";

const AdminDashboard = () => {
  const { profile } = useAuth();

  return (
    <div className="container space-y-8">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-display">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {profile?.full_name || "Admin"}</p>
        </div>
        <Badge className="ml-auto bg-primary/10 text-primary border-primary/20">Admin</Badge>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Users className="w-4 h-4" /> Total Drivers</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">7</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Tractor className="w-4 h-4" /> Total Vehicles</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">7</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Active Bookings</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">3</p></CardContent>
        </Card>
      </div>

      <ResourceDashboard interactive />
    </div>
  );
};

export default AdminDashboard;
