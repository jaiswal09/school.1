/*
  # Create RLS Policies for Categories Table

  1. Changes
    - Enable RLS on categories table
    - Add policies for authenticated users to view categories
    - Add policies for admins/staff to manage categories

  2. Security
    - All authenticated users can view categories
    - Only admins and staff can create/update/delete categories
*/

-- Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Admins and staff can manage categories" ON categories;

-- Create policies for categories table
CREATE POLICY "Anyone can view categories"
ON categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and staff can manage categories"
ON categories FOR ALL
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