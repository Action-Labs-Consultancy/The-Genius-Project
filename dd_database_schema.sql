-- Comprehensive Due Diligence Database Schema
-- This creates the table structure for the com         CASE WHEN introduction_engagement_context IS NOT NULL AND introduction_engagement_context != '' THEN 1 ELSE 0 END +
         CASE WHEN legal_disclaimers_reliance_limitations IS NOT NULL AND legal_disclaimers_reliance_limitations != '' THEN 1 ELSE 0 END +
         CASE WHEN methodology_reliability_levels IS NOT NULL AND methodology_reliability_levels != '' THEN 1 ELSE 0 END +ete DD system with your 20 specific sections

CREATE TABLE IF NOT EXISTS due_diligence_reports (
    id SERIAL PRIMARY KEY,
    kanboard_task_id INTEGER UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    website VARCHAR(500),
    description TEXT,
    attachment_info TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
    
    -- 20 Due Diligence Sections (Your Specific Requirements)
    introduction_engagement_context TEXT,
    legal_disclaimers_reliance_limitations TEXT,
    methodology_reliability_levels TEXT,
    company_overview TEXT,
    business_model_unit_economics TEXT,
    products_technology TEXT,
    target_market_competitive_set TEXT,
    financials_multi_year TEXT,
    cash_burn_runway TEXT,
    revenue_quality_client_cohorts TEXT,
    partnerships_ecosystem TEXT,
    intellectual_property TEXT,
    legal_regulatory TEXT,
    governance_board_effectiveness TEXT,
    capital_structure_dilution TEXT,
    risk_matrix_mitigations TEXT,
    gaps_uncertainties_disclaimers TEXT,
    scenario_analysis TEXT,
    strategic_options TEXT,
    recommendations_next_steps TEXT,
    source_map_integrity_log TEXT,
    
    -- Metadata
    pdf_filename VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dd_kanboard_task_id ON due_diligence_reports(kanboard_task_id);
CREATE INDEX IF NOT EXISTS idx_dd_status ON due_diligence_reports(status);
CREATE INDEX IF NOT EXISTS idx_dd_company_name ON due_diligence_reports(company_name);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dd_reports_updated_at 
    BEFORE UPDATE ON due_diligence_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
-- INSERT INTO due_diligence_reports (kanboard_task_id, company_name, website, description, status)
-- VALUES (123, 'Test Company', 'https://example.com', 'Test description', 'pending');

-- View to check section completion status
CREATE OR REPLACE VIEW dd_section_status AS
SELECT 
    id,
    kanboard_task_id,
    company_name,
    status,
    CASE WHEN introduction_engagement_context IS NOT NULL AND introduction_engagement_context != '' THEN 1 ELSE 0 END +
    CASE WHEN legal_disclaimers_reliance_limitations IS NOT NULL AND legal_disclaimers_reliance_limitations != '' THEN 1 ELSE 0 END +
    CASE WHEN methodology_reliability_levels IS NOT NULL AND methodology_reliability_levels != '' THEN 1 ELSE 0 END +
    CASE WHEN company_overview IS NOT NULL AND company_overview != '' THEN 1 ELSE 0 END +
    CASE WHEN business_model_unit_economics IS NOT NULL AND business_model_unit_economics != '' THEN 1 ELSE 0 END +
    CASE WHEN products_technology IS NOT NULL AND products_technology != '' THEN 1 ELSE 0 END +
    CASE WHEN target_market_competitive_set IS NOT NULL AND target_market_competitive_set != '' THEN 1 ELSE 0 END +
    CASE WHEN financials_multi_year IS NOT NULL AND financials_multi_year != '' THEN 1 ELSE 0 END +
    CASE WHEN cash_burn_runway IS NOT NULL AND cash_burn_runway != '' THEN 1 ELSE 0 END +
    CASE WHEN revenue_quality_client_cohorts IS NOT NULL AND revenue_quality_client_cohorts != '' THEN 1 ELSE 0 END +
    CASE WHEN partnerships_ecosystem IS NOT NULL AND partnerships_ecosystem != '' THEN 1 ELSE 0 END +
    CASE WHEN intellectual_property IS NOT NULL AND intellectual_property != '' THEN 1 ELSE 0 END +
    CASE WHEN legal_regulatory IS NOT NULL AND legal_regulatory != '' THEN 1 ELSE 0 END +
    CASE WHEN governance_board_effectiveness IS NOT NULL AND governance_board_effectiveness != '' THEN 1 ELSE 0 END +
    CASE WHEN capital_structure_dilution IS NOT NULL AND capital_structure_dilution != '' THEN 1 ELSE 0 END +
    CASE WHEN risk_matrix_mitigations IS NOT NULL AND risk_matrix_mitigations != '' THEN 1 ELSE 0 END +
    CASE WHEN gaps_uncertainties_disclaimers IS NOT NULL AND gaps_uncertainties_disclaimers != '' THEN 1 ELSE 0 END +
    CASE WHEN scenario_analysis IS NOT NULL AND scenario_analysis != '' THEN 1 ELSE 0 END +
    CASE WHEN strategic_options IS NOT NULL AND strategic_options != '' THEN 1 ELSE 0 END +
    CASE WHEN recommendations_next_steps IS NOT NULL AND recommendations_next_steps != '' THEN 1 ELSE 0 END +
    CASE WHEN source_map_integrity_log IS NOT NULL AND source_map_integrity_log != '' THEN 1 ELSE 0 END AS completed_sections,
    20 AS total_sections,
    ROUND(
        (CASE WHEN introduction_engagement_context IS NOT NULL AND introduction_engagement_context != '' THEN 1 ELSE 0 END +
         CASE WHEN methodology_reliability_levels IS NOT NULL AND methodology_reliability_levels != '' THEN 1 ELSE 0 END +
         CASE WHEN company_overview IS NOT NULL AND company_overview != '' THEN 1 ELSE 0 END +
         CASE WHEN business_model_unit_economics IS NOT NULL AND business_model_unit_economics != '' THEN 1 ELSE 0 END +
         CASE WHEN products_technology IS NOT NULL AND products_technology != '' THEN 1 ELSE 0 END +
         CASE WHEN target_market_competitive_set IS NOT NULL AND target_market_competitive_set != '' THEN 1 ELSE 0 END +
         CASE WHEN financials_multi_year IS NOT NULL AND financials_multi_year != '' THEN 1 ELSE 0 END +
         CASE WHEN cash_burn_runway IS NOT NULL AND cash_burn_runway != '' THEN 1 ELSE 0 END +
         CASE WHEN revenue_quality_client_cohorts IS NOT NULL AND revenue_quality_client_cohorts != '' THEN 1 ELSE 0 END +
         CASE WHEN partnerships_ecosystem IS NOT NULL AND partnerships_ecosystem != '' THEN 1 ELSE 0 END +
         CASE WHEN intellectual_property IS NOT NULL AND intellectual_property != '' THEN 1 ELSE 0 END +
         CASE WHEN legal_regulatory IS NOT NULL AND legal_regulatory != '' THEN 1 ELSE 0 END +
         CASE WHEN governance_board_effectiveness IS NOT NULL AND governance_board_effectiveness != '' THEN 1 ELSE 0 END +
         CASE WHEN capital_structure_dilution IS NOT NULL AND capital_structure_dilution != '' THEN 1 ELSE 0 END +
         CASE WHEN risk_matrix_mitigations IS NOT NULL AND risk_matrix_mitigations != '' THEN 1 ELSE 0 END +
         CASE WHEN gaps_uncertainties_disclaimers IS NOT NULL AND gaps_uncertainties_disclaimers != '' THEN 1 ELSE 0 END +
         CASE WHEN scenario_analysis IS NOT NULL AND scenario_analysis != '' THEN 1 ELSE 0 END +
         CASE WHEN strategic_options IS NOT NULL AND strategic_options != '' THEN 1 ELSE 0 END +
         CASE WHEN recommendations_next_steps IS NOT NULL AND recommendations_next_steps != '' THEN 1 ELSE 0 END +
         CASE WHEN source_map_integrity_log IS NOT NULL AND source_map_integrity_log != '' THEN 1 ELSE 0 END) * 100.0 / 20, 2
    ) AS completion_percentage
FROM due_diligence_reports;

-- Query to show reports progress
-- SELECT * FROM dd_section_status ORDER BY completion_percentage DESC;
