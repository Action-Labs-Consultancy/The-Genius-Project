
-- Add missing columns to complete_dd_reports table if they don't exist
DO 
import json
with open('AI_Due_Diligence_Workflow.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
print(' Section 5 workflow JSON is valid!')
print(' Database setup updated with proper columns:')
print('   - Section 5: company_overview')
print('   - Section 6: business_model') 
print('   - Section 7: products_services')
print('   - Section 8: target_market_competitive_set')
print(' Schema definition updated in Save Section 5 Content node')
 
BEGIN
    -- Add business_model column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'complete_dd_reports' AND column_name = 'business_model') THEN
        ALTER TABLE complete_dd_reports ADD COLUMN business_model TEXT;
    END IF;
    
    -- Add products_services column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'complete_dd_reports' AND column_name = 'products_services') THEN
        ALTER TABLE complete_dd_reports ADD COLUMN products_services TEXT;
    END IF;
    
    -- Add target_market_competitive_set column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'complete_dd_reports' AND column_name = 'target_market_competitive_set') THEN
        ALTER TABLE complete_dd_reports ADD COLUMN target_market_competitive_set TEXT;
    END IF;
    
    -- Add section_4_executive_summary column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'complete_dd_reports' AND column_name = 'section_4_executive_summary') THEN
        ALTER TABLE complete_dd_reports ADD COLUMN section_4_executive_summary TEXT;
    END IF;
    
    -- Add company_overview column if it doesn't exist (should already exist)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'complete_dd_reports' AND column_name = 'company_overview') THEN
        ALTER TABLE complete_dd_reports ADD COLUMN company_overview TEXT;
    END IF;
END 
import json
with open('AI_Due_Diligence_Workflow.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
print(' Section 5 workflow JSON is valid!')
print(' Database setup updated with proper columns:')
print('   - Section 5: company_overview')
print('   - Section 6: business_model') 
print('   - Section 7: products_services')
print('   - Section 8: target_market_competitive_set')
print(' Schema definition updated in Save Section 5 Content node')
;
