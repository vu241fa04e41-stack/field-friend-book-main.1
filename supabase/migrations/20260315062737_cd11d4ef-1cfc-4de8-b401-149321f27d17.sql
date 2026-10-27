-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tractor_name TEXT NOT NULL,
  services TEXT[] NOT NULL DEFAULT '{}',
  acres NUMERIC NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_cost NUMERIC NOT NULL,
  farmer_name TEXT NOT NULL,
  farmer_phone TEXT NOT NULL,
  farmer_email TEXT,
  village TEXT NOT NULL,
  field_lat DOUBLE PRECISION NOT NULL DEFAULT 15.5,
  field_lng DOUBLE PRECISION NOT NULL DEFAULT 78.5,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view bookings"
  ON public.bookings FOR SELECT
  USING (true);

-- Create driver_locations table for GPS tracking
CREATE TABLE public.driver_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  driver_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view driver locations"
  ON public.driver_locations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert driver locations"
  ON public.driver_locations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update driver locations"
  ON public.driver_locations FOR UPDATE
  USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_locations_updated_at
  BEFORE UPDATE ON public.driver_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();