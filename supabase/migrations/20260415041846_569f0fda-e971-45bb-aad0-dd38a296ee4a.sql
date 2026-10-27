
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_name TEXT NOT NULL,
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'tractor',
  image_url TEXT,
  hp INTEGER NOT NULL DEFAULT 45,
  fuel TEXT NOT NULL DEFAULT 'Diesel',
  fuel_capacity TEXT NOT NULL DEFAULT '55L Tank',
  usage_type TEXT NOT NULL DEFAULT 'Farming',
  price_per_day NUMERIC NOT NULL DEFAULT 1500,
  available BOOLEAN NOT NULL DEFAULT true,
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  owner_image_url TEXT,
  driver_name TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  driver_image_url TEXT,
  service_area TEXT NOT NULL DEFAULT '',
  service_lat DOUBLE PRECISION NOT NULL DEFAULT 15.5,
  service_lng DOUBLE PRECISION NOT NULL DEFAULT 78.5,
  service_radius_km NUMERIC NOT NULL DEFAULT 25,
  confirmation_time_limit_hours NUMERIC NOT NULL DEFAULT 2.5,
  details_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vehicles" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert vehicles" ON public.vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update vehicles" ON public.vehicles FOR UPDATE USING (true);

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add vehicle_number and confirmation_time_limit to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS vehicle_number TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS confirmation_time_limit_hours NUMERIC DEFAULT 2.5;
