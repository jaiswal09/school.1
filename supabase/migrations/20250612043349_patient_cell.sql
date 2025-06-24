/*
  # Create RLS Policies for Transactions Table

  1. Changes
    - Enable RLS on transactions table
    - Add policies for authenticated users to view transactions
    - Add policies for users to create their own transactions
    - Add policies for admins/staff to manage all transactions

  2. Security
    - All authenticated users can view transactions (needed for reports)
    - Users can create transactions for themselves
    - Admins and staff can manage all transactions
*/

-- Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins and staff can manage all transactions" ON transactions;

-- Create policies for transactions table
CREATE POLICY "Anyone can view transactions"
ON transactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own transactions"
ON transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and staff can manage all transactions"
ON transactions FOR ALL
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