/*
  # Fix RLS Policies for Users and Items Tables

  1. Changes
    - Update RLS policies for users table to allow proper user data access
    - Update RLS policies for items table to allow proper item management
    - Add function to check user role for item management

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read their own data
    - Add policies for admins/staff to manage items
*/

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY definer
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Update users table policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can read own data" ON users;
  DROP POLICY IF EXISTS "admin_full_access" ON users;
  DROP POLICY IF EXISTS "authenticated_read_basic" ON users;
  DROP POLICY IF EXISTS "user_read_own" ON users;
  DROP POLICY IF EXISTS "user_update_own" ON users;
  
  -- Create new policies
  CREATE POLICY "Users can read own data"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
      auth.uid() = id OR 
      get_user_role() IN ('admin', 'staff')
    );

  CREATE POLICY "Users can update own data"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

  CREATE POLICY "Admins can manage all users"
    ON public.users
    FOR ALL
    TO authenticated
    USING (get_user_role() = 'admin')
    WITH CHECK (get_user_role() = 'admin');
END $$;

-- Update items table policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Admins/Staff can manage items" ON items;
  DROP POLICY IF EXISTS "Authenticated can view items" ON items;
  DROP POLICY IF EXISTS "Staff can manage items" ON items;

  -- Create new policies
  CREATE POLICY "Anyone can view items"
    ON public.items
    FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Admins and staff can manage items"
    ON public.items
    FOR ALL
    TO authenticated
    USING (get_user_role() IN ('admin', 'staff'))
    WITH CHECK (get_user_role() IN ('admin', 'staff'));
END $$;

-- Create function to get low stock items
CREATE OR REPLACE FUNCTION public.get_low_stock_items()
RETURNS SETOF items
LANGUAGE sql
SECURITY definer
AS $$
  SELECT *
  FROM public.items
  WHERE quantity < min_quantity;
$$;