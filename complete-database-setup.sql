-- Complete Database Setup for Research Results
DROP TABLE IF EXISTS research_results;

CREATE TABLE research_results (
    id SERIAL PRIMARY KEY,
    company TEXT NOT NULL,
    section TEXT NOT NULL,
    status TEXT NOT NULL,
    findings TEXT,
    missing_data JSONB,
    human_tasks JSONB,
    confidence_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_research_company ON research_results(company);
CREATE INDEX idx_research_status ON research_results(status);
CREATE INDEX idx_research_created ON research_results(created_at);

-- Sample data for testing
INSERT INTO research_results (company, section, status, findings, missing_data, human_tasks, confidence_score) 
VALUES 
('Sample Corp', 'Introduction', 'completed', 'Sample company analysis completed successfully', '[]', '[]', 85),
('Sample Corp', 'Financial Analysis', 'requires_human', 'Initial analysis shows promising revenue', '["Latest financial statements", "Audit reports"]', '["Verify revenue numbers", "Check compliance"]', 45)
ON CONFLICT DO NOTHING;

-- Verify table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'research_results' 
ORDER BY ordinal_position;
