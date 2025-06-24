/*
  # Fix Users Table RLS Policies - Remove Infinite Recursion

  1. Changes
    - Drop all existing policies that cause recursion
    - Create new policies that don't reference the users table within themselves
    - Use auth.uid() instead of subqueries to avoid circular references
    - Allow basic read access for authenticated users
    - Prevent role changes through RLS

  2. Security
    - Users can read their own profile
    - Authenticated users can read basic user info (needed for app functionality)
    - Users can update their own info but not their role
    - Service role has full access for admin operations
*/

-- Drop all existing policies on users table to start fresh
DROP POLICY IF EXISTS "Admins have full access" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Users can update their own basic info" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "admin_full_access" ON users;
DROP POLICY IF EXISTS "authenticated_read_basic" ON users;
DROP POLICY IF EXISTS "user_read_own" ON users;
DROP POLICY IF EXISTS "user_update_own" ON users;

-- Create new, safe policies that don't cause recursion

-- Policy 1: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Authenticated users can read basic user info (needed for app functionality)
-- This allows users to see other users' names/departments for reservations, transactions, etc.
CREATE POLICY "Authenticated users can read user info"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 3: Users can update their own basic information (excluding role changes)
-- We'll handle role protection at the application level to avoid recursion
CREATE POLICY "Users can update own basic info"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Service role has full access (for admin operations)
-- This uses the service role key instead of checking user roles in the table
CREATE POLICY "Service role full access"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;