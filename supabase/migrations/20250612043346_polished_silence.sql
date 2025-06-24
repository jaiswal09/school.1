/*
  # Create RLS Policies for Resources Table

  1. Changes
    - Enable RLS on resources table
    - Add policies for authenticated users to view resources
    - Add policies for admins/staff to manage resources

  2. Security
    - All authenticated users can view resources
    - Only admins and staff can create/update/delete resources
*/

-- Enable RLS on resources table
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view resources" ON resources;
DROP POLICY IF EXISTS "Admins and staff can manage resources" ON resources;

-- Create policies for resources table
CREATE POLICY "Anyone can view resources"
ON resources FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and staff can manage resources"
ON resources FOR ALL
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