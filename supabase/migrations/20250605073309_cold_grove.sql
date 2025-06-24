/*
  # Fix Items RLS Policies

  1. Changes
    - Add INSERT policy for admin and staff users
    - Fix existing policies to use proper role checks

  2. Security
    - Maintain existing RLS policies
    - Add new policy for item creation
*/

-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Admins and staff can manage items" ON items;
DROP POLICY IF EXISTS "Anyone can view items" ON items;

-- Create new policies with proper role checks
CREATE POLICY "Admins and staff can manage items"
ON items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'staff')
  )
);

CREATE POLICY "Authenticated users can view items"
ON items
FOR SELECT
TO authenticated
USING (true);