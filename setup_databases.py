import sqlite3
import json
from datetime import datetime
import os

# Database setup script for MCA Due Diligence Workflow
print("🔧 Setting up MCA Due Diligence Databases...")

# Database file paths
KB_DB_PATH = "knowledge_base.db"
OUTPUT_DB_PATH = "due_diligence_output.db"

def setup_knowledge_base_db():
    """Setup Knowledge Base Database"""
    print("📚 Setting up Knowledge Base Database...")
    
    conn = sqlite3.connect(KB_DB_PATH)
    cursor = conn.cursor()
    
    # Companies table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS kb_companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        website_url TEXT,
        industry TEXT,
        description TEXT,
        kanboard_task_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Documents table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS kb_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        file_path TEXT,
        content_text TEXT,
        file_size INTEGER,
        mime_type TEXT,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reliability_score REAL DEFAULT 0.8,
        source_type TEXT DEFAULT 'pdf',
        FOREIGN KEY (company_id) REFERENCES kb_companies(id)
    )
    """)
    
    # Financial analysis table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS kb_financial_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        analysis_type TEXT NOT NULL,
        sentiment TEXT,
        confidence_score REAL,
        analysis_data TEXT,
        source_text TEXT,
        analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES kb_companies(id)
    )
    """)
    
    # Website content table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS kb_website_content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        url TEXT NOT NULL,
        page_title TEXT,
        content_text TEXT,
        scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reliability_score REAL DEFAULT 0.9,
        FOREIGN KEY (company_id) REFERENCES kb_companies(id)
    )
    """)
    
    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_kb_companies_name ON kb_companies(name)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_kb_documents_company ON kb_documents(company_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_kb_financial_company ON kb_financial_analysis(company_id)")
    
    conn.commit()
    conn.close()
    print("✅ Knowledge Base Database setup complete")

def setup_output_db():
    """Setup Output Database"""
    print("📊 Setting up Output Database...")
    
    conn = sqlite3.connect(OUTPUT_DB_PATH)
    cursor = conn.cursor()
    
    # Due diligence reports table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dd_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        company_name TEXT NOT NULL,
        kanboard_task_id INTEGER,
        status TEXT DEFAULT 'in_progress',
        total_sections INTEGER DEFAULT 20,
        completed_sections INTEGER DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        final_pdf_path TEXT,
        final_pdf_size INTEGER
    )
    """)
    
    # Sections table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dd_sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id INTEGER NOT NULL,
        section_name TEXT NOT NULL,
        section_index INTEGER NOT NULL,
        section_description TEXT,
        section_status TEXT DEFAULT 'pending',
        json_content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES dd_reports(id)
    )
    """)
    
    # MCA history table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dd_mca_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section_id INTEGER NOT NULL,
        workflow_stage TEXT NOT NULL,
        decision TEXT NOT NULL,
        agent_type TEXT NOT NULL,
        content TEXT,
        feedback TEXT,
        citations TEXT,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processing_time_ms INTEGER,
        FOREIGN KEY (section_id) REFERENCES dd_sections(id)
    )
    """)
    
    # Final reports table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dd_final_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id INTEGER NOT NULL,
        pdf_filename TEXT NOT NULL,
        pdf_file_path TEXT NOT NULL,
        pdf_size_bytes INTEGER,
        generation_method TEXT DEFAULT 'automated',
        sections_included INTEGER,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES dd_reports(id)
    )
    """)
    
    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_dd_reports_company ON dd_reports(company_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_dd_sections_report ON dd_sections(report_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_dd_sections_status ON dd_sections(section_status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_dd_mca_section ON dd_mca_history(section_id)")
    
    # Insert section templates
    sections = [
        ("Introduction & Engagement Context", 1, "Context, objectives, and scope of the due diligence engagement"),
        ("Methodology & Reliability Levels", 2, "Analytical approach, data sources, and reliability assessment methodology"),
        ("Company Overview", 3, "Company history, leadership team, ownership structure, mission, and operational scale"),
        ("Business Model & Unit Economics", 4, "Revenue streams, cost structure, pricing strategy, and unit economics analysis"),
        ("Products & Technology", 5, "Product portfolio, technology stack, R&D capabilities, and competitive differentiation"),
        ("Target Market & Competitive Set", 6, "Market segments, customer base, competitive landscape, and market positioning"),
        ("Financials", 7, "Multi-year financial statements analysis, reconciliation, and recomputation"),
        ("Cash, Burn, Runway", 8, "Cash position, burn rate analysis, and runway calculations"),
        ("Revenue Quality & Client Cohorts", 9, "Revenue composition, client concentration, retention, and cohort analysis"),
        ("Partnerships & Ecosystem", 10, "Strategic partnerships, ecosystem integration, and channel relationships"),
        ("Intellectual Property", 11, "Patent portfolio, trademarks, copyrights, and IP strategy"),
        ("Legal & Regulatory", 12, "Legal structure, compliance status, regulatory risks, and litigation"),
        ("Governance & Board Effectiveness", 13, "Board composition, governance practices, and decision-making processes"),
        ("Capital Structure & Dilution", 14, "Equity structure, debt analysis, and potential dilution scenarios"),
        ("Risk Matrix & Mitigations", 15, "Key risk identification, assessment, and mitigation strategies"),
        ("Gaps, Uncertainties & Disclaimers", 16, "Data gaps, analytical uncertainties, and disclosure disclaimers"),
        ("Scenario Analysis", 17, "Multiple scenario modeling and sensitivity analysis"),
        ("Strategic Options", 18, "Strategic alternatives and growth pathways for the company"),
        ("Recommendations & Next Steps", 19, "Actionable recommendations and proposed next steps"),
        ("Source Map & Integrity Log", 20, "Data sources mapping and integrity verification log")
    ]
    
    print(f"📋 Installing {len(sections)} section templates...")
    for section_name, section_index, description in sections:
        cursor.execute("""
        INSERT OR IGNORE INTO dd_sections (report_id, section_name, section_index, section_description, section_status)
        VALUES (0, ?, ?, ?, 'template')
        """, (section_name, section_index, description))
    
    conn.commit()
    conn.close()
    print("✅ Output Database setup complete")

def create_database_config():
    """Create database configuration for n8n"""
    config = {
        "databases": {
            "knowledge_base": {
                "type": "sqlite",
                "path": os.path.abspath(KB_DB_PATH),
                "description": "Stores company information, PDFs, financial analysis, and source data"
            },
            "output": {
                "type": "sqlite", 
                "path": os.path.abspath(OUTPUT_DB_PATH),
                "description": "Stores due diligence reports, sections, MCA decisions, and final PDFs"
            }
        },
        "created_at": datetime.now().isoformat(),
        "version": "1.0"
    }
    
    with open("database_config.json", "w") as f:
        json.dump(config, f, indent=2)
    
    print("⚙️ Database configuration saved to database_config.json")

def main():
    print("🚀 Starting MCA Due Diligence Database Setup")
    print("=" * 50)
    
    # Setup databases
    setup_knowledge_base_db()
    setup_output_db()
    create_database_config()
    
    print("\n✅ Database Setup Complete!")
    print(f"📚 Knowledge Base: {os.path.abspath(KB_DB_PATH)}")
    print(f"📊 Output Database: {os.path.abspath(OUTPUT_DB_PATH)}")
    print(f"⚙️ Config File: {os.path.abspath('database_config.json')}")
    
    print("\n🎯 Next Steps:")
    print("1. Import the Database_MCA_Workflow_FIXED.json into n8n")
    print("2. Configure SQLite credentials in n8n to point to these databases")
    print("3. Create a master Due Diligence task in Kanboard with:")
    print("   - Title: 'Due Diligence: [Company Name]'")
    print("   - Description: Must contain company website URL")
    print("   - Attachments: Upload relevant PDF files")
    print("4. Activate the workflow in n8n")
    
    print("\n🔥 The workflow will now:")
    print("   ✅ Store all data in proper databases")
    print("   ✅ Implement true MCA workflow")
    print("   ✅ Generate JSON-formatted sections")
    print("   ✅ Create actual PDF reports")
    print("   ✅ Track all decisions and history")

if __name__ == "__main__":
    main()
