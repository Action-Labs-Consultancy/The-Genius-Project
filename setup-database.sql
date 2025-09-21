-- PostgreSQL Database Setup for Research Results
CREATE TABLE IF NOT EXISTS research_results (
    id SERIAL PRIMARY KEY,
    company VARCHAR(255) NOT NULL,
    section VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    findings TEXT,
    missing_data JSONB,
    human_tasks JSONB,
    confidence_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_research_company ON research_results(company);
CREATE INDEX IF NOT EXISTS idx_research_status ON research_results(status);

-- Sample data for testing
INSERT INTO research_results (company, section, status, findings, missing_data, human_tasks, confidence_score) 
VALUES 
('Tesla', 'Financial Analysis', 'completed', 'Strong revenue growth with consistent profitability', '[]', '[]', 85),
('Tesla', 'Market Position', 'completed', 'Leading position in EV market with growing competition', '[]', '[]', 78)
ON CONFLICT DO NOTHING;
