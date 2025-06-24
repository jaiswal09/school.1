-- Drop existing policies
DROP POLICY IF EXISTS "Admins and staff can manage items" ON items;
DROP POLICY IF EXISTS "Authenticated users can view items" ON items;
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

-- Create helper function for checking user roles
CREATE OR REPLACE FUNCTION public.check_user_role(allowed_roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = ANY(allowed_roles)
  );
$$;