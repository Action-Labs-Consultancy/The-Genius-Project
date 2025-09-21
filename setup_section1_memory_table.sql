-- Create dedicated table for Section 1 workflow memory
-- This isolates the Section 1 workflow from the main company_data table

CREATE TABLE IF NOT EXISTS section1_memory (
    id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    message_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_section1_memory_session_id ON section1_memory(session_id);
CREATE INDEX IF NOT EXISTS idx_section1_memory_created_at ON section1_memory(created_at);

-- Insert a test record to ensure the table is working
INSERT INTO section1_memory (id, session_id, message_id, role, content, metadata) 
VALUES ('test_001', 'section1_generation', 'msg_001', 'system', 'Section 1 memory table initialized', '{}')
ON CONFLICT (id) DO NOTHING;

SELECT 'Section 1 memory table created successfully' as status;
