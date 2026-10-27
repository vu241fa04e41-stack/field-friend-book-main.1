import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Tractor, User, Phone, Clock, Shield } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { t, ADVANCE_AMOUNT } from "@/lib/i18n";

interface Booking {
  id: string;
  tractor_name: string;
  services: string[];
  acres: number;
  start_date: string;
  end_date: string;
  total_cost: number;
  farmer_name: string;
  farmer_phone: string;
  village: string;
  field_lat: number;
  field_lng: number;
  status: string;
  created_at: string;
  advance_amount: number;
  advance_paid: boolean;
  owner_confirmed: boolean;
  vehicle_type: string;
}

const BookingsDisplay = () => {
  const { language } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
    const channel = supabase
      .channel("bookings-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        fetchBookings();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (!error && data) {
      setBookings(data as Booking[]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container text-center">
          <p className="text-muted-foreground">Loading bookings...</p>
        </div>
      </section>
    );
  }

  if (bookings.length === 0) return null;

  const getStatusBadge = (booking: Booking) => {
    if (booking.owner_confirmed) {
      return <Badge className="bg-primary text-primary-foreground">{t(language, "confirmed")}</Badge>;
    }
    return (
      <Badge className="bg-secondary/20 text-secondary border border-secondary/30">
        <Clock className="h-3 w-3 mr-1" />
        {t(language, "pendingConfirmation")}
      </Badge>
    );
  };

  return (
    <section id="bookings" className="py-20">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{t(language, "recentBookings")}</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="rounded-2xl bg-card border border-border p-6 transition-all hover:shadow-lg hover:-translate-y-1" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Tractor className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-lg">{booking.tractor_name}</h3>
                </div>
                {getStatusBadge(booking)}
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4 text-secondary" />
                  <span>{booking.farmer_name}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 text-secondary" />
                  <span>{booking.farmer_phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-secondary" />
                  <span>{format(new Date(booking.start_date), "dd MMM")} — {format(new Date(booking.end_date), "dd MMM yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-secondary" />
                  <span>{booking.village}</span>
                  <a href={`https://www.google.com/maps?q=${booking.field_lat},${booking.field_lng}`} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs ml-auto">
                    Map →
                  </a>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {booking.services.map((s) => (
                  <span key={s} className="text-xs bg-muted rounded-full px-2.5 py-1 text-foreground">{s}</span>
                ))}
              </div>

              {/* Advance payment & owner responsibility info */}
              <div className="mt-3 p-2 rounded-lg bg-secondary/5 border border-secondary/20 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t(language, "advanceFee")}</span>
                  <span className="font-semibold text-secondary">₹{booking.advance_amount || ADVANCE_AMOUNT} {booking.advance_paid ? "✅" : "⏳"}</span>
                </div>
                {!booking.owner_confirmed && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    <span>{t(language, "ownerMustConfirm")}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{booking.acres} {t(language, "acres")}</span>
                <span className="text-lg font-bold text-primary">₹{booking.total_cost.toLocaleString("en-IN")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BookingsDisplay;
