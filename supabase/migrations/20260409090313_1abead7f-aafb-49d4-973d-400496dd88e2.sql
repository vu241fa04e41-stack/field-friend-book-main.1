
-- Add new columns for advance payment, owner confirmation, and vehicle types
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS advance_amount numeric NOT NULL DEFAULT 200,
  ADD COLUMN IF NOT EXISTS advance_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_confirmed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS vehicle_type text NOT NULL DEFAULT 'tractor',
  ADD COLUMN IF NOT EXISTS cancellation_note text;

-- Update default status to pending_confirmation
ALTER TABLE public.bookings ALTER COLUMN status SET DEFAULT 'pending_confirmation';
