import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface FieldMapProps {
  position: [number, number];
  onPositionChange: (pos: [number, number]) => void;
}

const FieldMap = ({ position, onPositionChange }: FieldMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Fix default icon
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });

    const map = L.map(mapRef.current).setView(position, 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    const marker = L.marker(position, { draggable: true }).addTo(map);
    marker.bindPopup("మీ పొలం · Your Field").openPopup();

    marker.on("dragend", () => {
      const latlng = marker.getLatLng();
      onPositionChange([latlng.lat, latlng.lng]);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onPositionChange([e.latlng.lat, e.latlng.lng]);
    });

    mapInstance.current = map;
    markerRef.current = marker;

    // Invalidate size after render
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  return (
    <div ref={mapRef} className="w-full h-48 rounded-xl border border-border overflow-hidden z-0" />
  );
};

export default FieldMap;
