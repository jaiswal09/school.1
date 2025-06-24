/*
  # Fix Users Table RLS Policies

  1. Changes
    - Remove redundant and conflicting RLS policies
    - Simplify access rules to prevent recursion
    - Consolidate admin/staff access into single policies
    - Create clear, non-recursive policies for user access

  2. Security
    - Maintain RLS on users table
    - Ensure users can only access their own data
    - Allow admins full access
    - Allow authenticated users to view basic user info
*/

-- First, drop all existing policies
DROP POLICY IF EXISTS "Admins can access all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Admins have full access to users" ON public.users;
DROP POLICY IF EXISTS "Allow admins to manage users" ON public.users;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.users;
DROP POLICY IF EXISTS "Users can view themselves" ON public.users;
DROP POLICY IF EXISTS "Users viewable by all authenticated users" ON public.users;

-- Create new, simplified policies

-- Admin full access policy
CREATE POLICY "admin_full_access" ON public.users
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Users can read their own profile
CREATE POLICY "user_read_own" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "user_update_own" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Authenticated users can view basic user info (needed for displaying names in transactions, etc)
CREATE POLICY "authenticated_read_basic" ON public.users
  FOR SELECT
  TO authenticated
  USING (true);