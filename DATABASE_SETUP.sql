-- DATABASE SETUP FOR MCA DUE DILIGENCE WORKFLOW
-- Two separate databases: Knowledge Base and Output

-- =============================================================================
-- KNOWLEDGE BASE DATABASE SCHEMA
-- =============================================================================

-- Companies table - stores basic company information
CREATE TABLE IF NOT EXISTS kb_companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    website_url TEXT,
    industry TEXT,
    description TEXT,
    kanboard_task_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table - stores PDF content and metadata
CREATE TABLE IF NOT EXISTS kb_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT,
    content_text TEXT, -- Extracted PDF text content
    file_size INTEGER,
    mime_type TEXT,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reliability_score REAL DEFAULT 0.8,
    source_type TEXT DEFAULT 'pdf', -- pdf, website, financial, etc.
    FOREIGN KEY (company_id) REFERENCES kb_companies(id)
);

-- Financial analysis table - stores FinBERT and other financial data
CREATE TABLE IF NOT EXISTS kb_financial_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    analysis_type TEXT NOT NULL, -- 'finbert', 'manual', 'scraped'
    sentiment TEXT, -- positive, negative, neutral
    confidence_score REAL,
    analysis_data JSON, -- Full FinBERT response or other analysis
    source_text TEXT, -- Original text analyzed
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES kb_companies(id)
);

-- Website content table - stores scraped website data
CREATE TABLE IF NOT EXISTS kb_website_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    page_title TEXT,
    content_text TEXT,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reliability_score REAL DEFAULT 0.9,
    FOREIGN KEY (company_id) REFERENCES kb_companies(id)
);

-- Source reliability tracking
CREATE TABLE IF NOT EXISTS kb_source_reliability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_type TEXT NOT NULL, -- 'pdf', 'website', 'financial', 'manual'
    source_id TEXT NOT NULL, -- Reference to specific source
    reliability_rating REAL NOT NULL, -- 0.0 to 1.0
    validation_method TEXT,
    validated_by TEXT,
    validation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- OUTPUT DATABASE SCHEMA  
-- =============================================================================

-- Master due diligence reports
CREATE TABLE IF NOT EXISTS dd_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    company_name TEXT NOT NULL,
    kanboard_task_id INTEGER,
    status TEXT DEFAULT 'in_progress', -- in_progress, sections_complete, pdf_generated, finalized
    total_sections INTEGER DEFAULT 20,
    completed_sections INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    final_pdf_path TEXT,
    final_pdf_size INTEGER
);

-- Individual sections with JSON content
CREATE TABLE IF NOT EXISTS dd_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    section_name TEXT NOT NULL,
    section_index INTEGER NOT NULL, -- 1-20 for ordering
    section_description TEXT,
    section_status TEXT DEFAULT 'pending', -- pending, maker_draft, checker_review, approver_review, approved, rejected
    json_content JSON, -- Final approved JSON content
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES dd_reports(id)
);

-- MCA workflow history - tracks all maker/checker/approver decisions
CREATE TABLE IF NOT EXISTS dd_mca_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id INTEGER NOT NULL,
    workflow_stage TEXT NOT NULL, -- 'maker', 'checker', 'approver'
    decision TEXT NOT NULL, -- 'approve', 'reject', 'draft_created'
    agent_type TEXT NOT NULL, -- 'ai_maker', 'ai_checker', 'ai_approver', 'human'
    content JSON, -- The actual content/draft produced or reviewed
    feedback TEXT, -- Feedback from checker/approver
    citations JSON, -- Array of source citations used
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processing_time_ms INTEGER,
    FOREIGN KEY (section_id) REFERENCES dd_sections(id)
);

-- Final compiled PDF reports
CREATE TABLE IF NOT EXISTS dd_final_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    pdf_filename TEXT NOT NULL,
    pdf_file_path TEXT NOT NULL,
    pdf_size_bytes INTEGER,
    generation_method TEXT DEFAULT 'automated', -- automated, manual
    sections_included INTEGER,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES dd_reports(id)
);

-- Report quality metrics
CREATE TABLE IF NOT EXISTS dd_quality_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    total_maker_attempts INTEGER DEFAULT 0,
    total_checker_rejections INTEGER DEFAULT 0,
    total_approver_rejections INTEGER DEFAULT 0,
    average_processing_time_per_section REAL,
    knowledge_base_sources_used INTEGER,
    finbert_analysis_used BOOLEAN DEFAULT FALSE,
    quality_score REAL, -- Overall quality rating 0-1
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES dd_reports(id)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Knowledge Base indexes
CREATE INDEX IF NOT EXISTS idx_kb_companies_name ON kb_companies(name);
CREATE INDEX IF NOT EXISTS idx_kb_documents_company ON kb_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_kb_financial_company ON kb_financial_analysis(company_id);
CREATE INDEX IF NOT EXISTS idx_kb_website_company ON kb_website_content(company_id);

-- Output Database indexes  
CREATE INDEX IF NOT EXISTS idx_dd_reports_company ON dd_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_dd_sections_report ON dd_sections(report_id);
CREATE INDEX IF NOT EXISTS idx_dd_sections_status ON dd_sections(section_status);
CREATE INDEX IF NOT EXISTS idx_dd_mca_section ON dd_mca_history(section_id);
CREATE INDEX IF NOT EXISTS idx_dd_mca_stage ON dd_mca_history(workflow_stage);

-- =============================================================================
-- SAMPLE DATA INSERTION
-- =============================================================================

-- Insert sample section definitions
INSERT OR IGNORE INTO dd_sections (report_id, section_name, section_index, section_description, section_status) 
SELECT 0, section_name, section_index, section_description, 'template'
FROM (VALUES 
    ('Introduction & Engagement Context', 1, 'Context, objectives, and scope of the due diligence engagement'),
    ('Methodology & Reliability Levels', 2, 'Analytical approach, data sources, and reliability assessment methodology'),
    ('Company Overview', 3, 'Company history, leadership team, ownership structure, mission, and operational scale'),
    ('Business Model & Unit Economics', 4, 'Revenue streams, cost structure, pricing strategy, and unit economics analysis'),
    ('Products & Technology', 5, 'Product portfolio, technology stack, R&D capabilities, and competitive differentiation'),
    ('Target Market & Competitive Set', 6, 'Market segments, customer base, competitive landscape, and market positioning'),
    ('Financials', 7, 'Multi-year financial statements analysis, reconciliation, and recomputation'),
    ('Cash, Burn, Runway', 8, 'Cash position, burn rate analysis, and runway calculations'),
    ('Revenue Quality & Client Cohorts', 9, 'Revenue composition, client concentration, retention, and cohort analysis'),
    ('Partnerships & Ecosystem', 10, 'Strategic partnerships, ecosystem integration, and channel relationships'),
    ('Intellectual Property', 11, 'Patent portfolio, trademarks, copyrights, and IP strategy'),
    ('Legal & Regulatory', 12, 'Legal structure, compliance status, regulatory risks, and litigation'),
    ('Governance & Board Effectiveness', 13, 'Board composition, governance practices, and decision-making processes'),
    ('Capital Structure & Dilution', 14, 'Equity structure, debt analysis, and potential dilution scenarios'),
    ('Risk Matrix & Mitigations', 15, 'Key risk identification, assessment, and mitigation strategies'),
    ('Gaps, Uncertainties & Disclaimers', 16, 'Data gaps, analytical uncertainties, and disclosure disclaimers'),
    ('Scenario Analysis', 17, 'Multiple scenario modeling and sensitivity analysis'),
    ('Strategic Options', 18, 'Strategic alternatives and growth pathways for the company'),
    ('Recommendations & Next Steps', 19, 'Actionable recommendations and proposed next steps'),
    ('Source Map & Integrity Log', 20, 'Data sources mapping and integrity verification log')
) AS sections(section_name, section_index, section_description);
