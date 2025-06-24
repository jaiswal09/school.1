/*
  # Add Image and Phone Fields

  1. Changes
    - Add `image_url` column to items table for storing item images
    - Add `phone` column to users table for storing contact numbers

  2. Security
    - Maintain existing RLS policies
    - No additional security changes needed
*/

-- Add image_url column to items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE items ADD COLUMN image_url text;
  END IF;
END $$;

-- Add phone column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone text;
  END IF;
END $$;