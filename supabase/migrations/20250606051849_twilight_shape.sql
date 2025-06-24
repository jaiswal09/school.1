/*
  # Fix RLS Policies and User Role Management
  
  1. Changes
    - Drop existing policies
    - Add function for safe role updates
    - Create new RLS policies for users and items tables
    - Enable RLS on both tables
  
  2. Security
    - Allow authenticated users to view all users
    - Allow users to update their own basic info
    - Give admins full access
    - Allow staff to manage items
*/

-- First, drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Admins and staff can manage items" ON items;
DROP POLICY IF EXISTS "Authenticated users can view items" ON items;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Users can update their own basic info" ON users;
DROP POLICY IF EXISTS "Admins have full access" ON users;
DROP POLICY IF EXISTS "Anyone can view items" ON items;

-- Create function to safely update user role
CREATE OR REPLACE FUNCTION update_user_role(user_id UUID, new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the executing user is an admin
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    UPDATE users 
    SET role = new_role 
    WHERE id = user_id;
  ELSE
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;
END;
$$;

-- Create policies for users table
CREATE POLICY "Enable read access for authenticated users"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own basic info"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins have full access"
ON users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Create policies for items table
CREATE POLICY "Anyone can view items"
ON items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and staff can manage items"
ON items FOR ALL
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

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;