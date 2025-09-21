-- Due Diligence Knowledge Base Schema
-- This script initializes the PostgreSQL database for storing DD data

-- Create knowledge base table for storing processed content
CREATE TABLE IF NOT EXISTS knowledge_base (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'financial', 'non-financial', 'website'
    source_type VARCHAR(50) NOT NULL,  -- 'pdf', 'website', 'attachment'
    source_name VARCHAR(255),
    content_text TEXT,
    extracted_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_knowledge_base_task_id ON knowledge_base(task_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_company ON knowledge_base(company_name);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_type ON knowledge_base(content_type);

-- Create due diligence sections table
CREATE TABLE IF NOT EXISTS dd_sections (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    section_name VARCHAR(255) NOT NULL,
    section_order INTEGER NOT NULL,
    content TEXT,
    maker_content TEXT,
    checker_feedback TEXT,
    checker_score INTEGER,
    approver_feedback TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for sections
CREATE INDEX IF NOT EXISTS idx_dd_sections_task_id ON dd_sections(task_id);
CREATE INDEX IF NOT EXISTS idx_dd_sections_status ON dd_sections(status);

-- Create financial analysis table for FinBERT results
CREATE TABLE IF NOT EXISTS financial_analysis (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    document_name VARCHAR(255),
    sentiment_score DECIMAL(5,4),
    confidence_score DECIMAL(5,4),
    financial_metrics JSONB,
    analysis_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for financial analysis
CREATE INDEX IF NOT EXISTS idx_financial_analysis_task_id ON financial_analysis(task_id);

-- Create report generation log
CREATE TABLE IF NOT EXISTS report_generation_log (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    sections_completed INTEGER DEFAULT 0,
    total_sections INTEGER DEFAULT 20,
    status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed'
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_time TIMESTAMP,
    error_message TEXT
);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_knowledge_base_updated_at 
    BEFORE UPDATE ON knowledge_base 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dd_sections_updated_at 
    BEFORE UPDATE ON dd_sections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default DD sections
INSERT INTO dd_sections (task_id, company_name, section_name, section_order, status) 
VALUES 
    ('template', 'Template Company', 'Introduction & Engagement Context', 1, 'template'),
    ('template', 'Template Company', 'Methodology & Reliability Levels', 2, 'template'),
    ('template', 'Template Company', 'Company Overview', 3, 'template'),
    ('template', 'Template Company', 'Business Model & Unit Economics', 4, 'template'),
    ('template', 'Template Company', 'Products & Technology', 5, 'template'),
    ('template', 'Template Company', 'Target Market & Competitive Set', 6, 'template'),
    ('template', 'Template Company', 'Financials (Multi-Year, reconciled & recomputed)', 7, 'template'),
    ('template', 'Template Company', 'Cash, Burn, Runway', 8, 'template'),
    ('template', 'Template Company', 'Revenue Quality & Client Cohorts', 9, 'template'),
    ('template', 'Template Company', 'Partnerships & Ecosystem', 10, 'template'),
    ('template', 'Template Company', 'Intellectual Property', 11, 'template'),
    ('template', 'Template Company', 'Legal & Regulatory', 12, 'template'),
    ('template', 'Template Company', 'Governance & Board Effectiveness', 13, 'template'),
    ('template', 'Template Company', 'Capital Structure & Dilution', 14, 'template'),
    ('template', 'Template Company', 'Risk Matrix & Mitigations', 15, 'template'),
    ('template', 'Template Company', 'Gaps, Uncertainties & Disclaimers', 16, 'template'),
    ('template', 'Template Company', 'Scenario Analysis', 17, 'template'),
    ('template', 'Template Company', 'Strategic Options', 18, 'template'),
    ('template', 'Template Company', 'Recommendations & Next Steps', 19, 'template'),
    ('template', 'Template Company', 'Source Map & Integrity Log', 20, 'template')
ON CONFLICT DO NOTHING;

-- Grant permissions to the dduser
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dduser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dduser;
