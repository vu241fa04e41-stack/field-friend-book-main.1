import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation, MapPin, Locate } from "lucide-react";

interface DriverLocation {
  id: string;
  booking_id: string;
  driver_name: string;
  lat: number;
  lng: number;
  updated_at: string;
}

const GPSTracker = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });

    const map = L.map(mapRef.current).setView([15.5, 78.5], 8);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    mapInstance.current = map;
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Fetch and subscribe to driver locations
  useEffect(() => {
    fetchDriverLocations();

    const channel = supabase
      .channel("driver-locations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_locations" }, () => {
        fetchDriverLocations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update markers when drivers change
  useEffect(() => {
    if (!mapInstance.current) return;

    const driverIcon = L.divIcon({
      html: `<div style="background:#16a34a;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
      iconSize: [16, 16],
      className: "",
    });

    drivers.forEach((d) => {
      if (markersRef.current[d.id]) {
        markersRef.current[d.id].setLatLng([d.lat, d.lng]);
      } else {
        const marker = L.marker([d.lat, d.lng], { icon: driverIcon }).addTo(mapInstance.current!);
        marker.bindPopup(`🚜 ${d.driver_name}`);
        markersRef.current[d.id] = marker;
      }
    });
  }, [drivers]);

  const fetchDriverLocations = async () => {
    const { data } = await supabase.from("driver_locations").select("*");
    if (data) setDrivers(data as DriverLocation[]);
  };

  const startSharingLocation = () => {
    if (!navigator.geolocation) return;

    setIsSharing(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await supabase.from("driver_locations").upsert({
          id: "demo-driver",
          driver_name: "డెమో డ్రైవర్ · Demo Driver",
          lat: latitude,
          lng: longitude,
          booking_id: null,
        }, { onConflict: "id" });
      },
      (err) => console.error("GPS error:", err),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  };

  const stopSharingLocation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);
  };

  return (
    <section id="gps" className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            GPS ట్రాకింగ్ · Live Tracking
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            డ్రైవర్ లొకేషన్ & పొలం లొకేషన్ లైవ్ మ్యాప్‌లో చూడండి · Track drivers & fields in real-time
          </p>
        </div>

        <div className="rounded-2xl border border-border overflow-hidden bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="p-4 flex flex-wrap items-center gap-3 border-b border-border">
            <Badge className="bg-primary text-primary-foreground">
              <Navigation className="h-3 w-3 mr-1" /> లైవ్ ట్రాకింగ్
            </Badge>
            <span className="text-sm text-muted-foreground">
              {drivers.length} డ్రైవర్లు ఆన్‌లైన్‌లో · {drivers.length} drivers online
            </span>
            <div className="ml-auto flex gap-2">
              {!isSharing ? (
                <Button size="sm" onClick={startSharingLocation} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Locate className="h-4 w-4 mr-1" /> లొకేషన్ షేర్ చేయండి
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={stopSharingLocation} className="rounded-full">
                  <MapPin className="h-4 w-4 mr-1" /> ఆపండి · Stop
                </Button>
              )}
            </div>
          </div>
          <div ref={mapRef} className="w-full h-[400px] z-0" />
        </div>

        {drivers.length > 0 && (
          <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map((d) => (
              <div key={d.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <p className="font-medium text-sm">{d.driver_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.lat.toFixed(4)}, {d.lng.toFixed(4)}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${d.lat},${d.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-primary text-xs underline"
                >
                  మ్యాప్ →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default GPSTracker;
