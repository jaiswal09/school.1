/*
  # Create RLS Policies for Reservations Table

  1. Changes
    - Enable RLS on reservations table
    - Add policies for authenticated users to view reservations
    - Add policies for users to create their own reservations
    - Add policies for admins/staff to manage all reservations

  2. Security
    - Users can view all reservations (needed for scheduling)
    - Users can create their own reservations
    - Users can update their own reservations
    - Admins and staff can manage all reservations
*/

-- Enable RLS on reservations table
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update their own reservations" ON reservations;
DROP POLICY IF EXISTS "Admins and staff can manage all reservations" ON reservations;

-- Create policies for reservations table
CREATE POLICY "Anyone can view reservations"
ON reservations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own reservations"
ON reservations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations"
ON reservations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and staff can manage all reservations"
ON reservations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'staff')
  )
);