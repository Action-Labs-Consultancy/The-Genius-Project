-- Fix missing columns in complete_dd_reports table
-- Run this in your PostgreSQL database to add the missing columns

-- Add methodology_source_validation column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'complete_dd_reports' AND column_name = 'methodology_source_validation') THEN
        ALTER TABLE complete_dd_reports ADD COLUMN methodology_source_validation TEXT;
        RAISE NOTICE 'Added methodology_source_validation column';
    ELSE
        RAISE NOTICE 'methodology_source_validation column already exists';
    END IF;
END $$;

-- Add business_overview column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'complete_dd_reports' AND column_name = 'business_overview') THEN
        ALTER TABLE complete_dd_reports ADD COLUMN business_overview TEXT;
        RAISE NOTICE 'Added business_overview column';
    ELSE
        RAISE NOTICE 'business_overview column already exists';
    END IF;
END $$;

-- Add company_overview column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'complete_dd_reports' AND column_name = 'company_overview') THEN
        ALTER TABLE complete_dd_reports ADD COLUMN company_overview TEXT;
        RAISE NOTICE 'Added company_overview column';
    ELSE
        RAISE NOTICE 'company_overview column already exists';
    END IF;
END $$;

-- Add business_model column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'complete_dd_reports' AND column_name = 'business_model') THEN
        ALTER TABLE complete_dd_reports ADD COLUMN business_model TEXT;
        RAISE NOTICE 'Added business_model column';
    ELSE
        RAISE NOTICE 'business_model column already exists';
    END IF;
END $$;

-- Add products_services column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'complete_dd_reports' AND column_name = 'products_services') THEN
        ALTER TABLE complete_dd_reports ADD COLUMN products_services TEXT;
        RAISE NOTICE 'Added products_services column';
    ELSE
        RAISE NOTICE 'products_services column already exists';
    END IF;
END $$;

-- Add target_market_competitive_set column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'complete_dd_reports' AND column_name = 'target_market_competitive_set') THEN
        ALTER TABLE complete_dd_reports ADD COLUMN target_market_competitive_set TEXT;
        RAISE NOTICE 'Added target_market_competitive_set column';
    ELSE
        RAISE NOTICE 'target_market_competitive_set column already exists';
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'complete_dd_reports' AND column_name = 'updated_at') THEN
        ALTER TABLE complete_dd_reports ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at column';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
END $$;

-- Verify all columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'complete_dd_reports' 
ORDER BY column_name;

-- Show sample of what the table structure looks like now
SHOW CREATE TABLE complete_dd_reports;
