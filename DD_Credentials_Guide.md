# Due Diligence System - Database Credentials

## PostgreSQL Database Credentials
**For n8n PostgreSQL Connection:**

```
Host: localhost
Port: 5432
Database: due_diligence_db
Username: postgres
Password: duediligence123
SSL: Disable (for local development)
```

## Connection String
```
postgresql://postgres:duediligence123@localhost:5432/due_diligence_db
```

## Your 20 Due Diligence Sections

The database includes these exact sections as columns:

1. **introduction_engagement_context** - Introduction & Engagement Context
2. **methodology_reliability_levels** - Methodology & Reliability Levels  
3. **company_overview** - Company Overview
4. **business_model_unit_economics** - Business Model & Unit Economics
5. **products_technology** - Products & Technology
6. **target_market_competitive_set** - Target Market & Competitive Set
7. **financials_multi_year** - Financials (Multi-Year, reconciled & recomputed)
8. **cash_burn_runway** - Cash, Burn, Runway
9. **revenue_quality_client_cohorts** - Revenue Quality & Client Cohorts
10. **partnerships_ecosystem** - Partnerships & Ecosystem
11. **intellectual_property** - Intellectual Property
12. **legal_regulatory** - Legal & Regulatory
13. **governance_board_effectiveness** - Governance & Board Effectiveness
14. **capital_structure_dilution** - Capital Structure & Dilution
15. **risk_matrix_mitigations** - Risk Matrix & Mitigations
16. **gaps_uncertainties_disclaimers** - Gaps, Uncertainties & Disclaimers
17. **scenario_analysis** - Scenario Analysis
18. **strategic_options** - Strategic Options
19. **recommendations_next_steps** - Recommendations & Next Steps
20. **source_map_integrity_log** - Source Map & Integrity Log

## Database Tables Created

### Main Table: `due_diligence_reports`
- All 20 sections as TEXT columns
- Company info (name, website, description)
- Kanboard integration (task_id)
- Status tracking (pending, in_progress, completed)
- Timestamps (created_at, updated_at, completed_at)

### View: `dd_section_status`
- Progress tracking per report
- Completion percentage calculation
- Section count statistics

## Quick Setup Commands

1. **Install PostgreSQL** (if not installed):
   ```powershell
   .\install_postgresql.ps1
   ```

2. **Setup Database & Schema**:
   ```powershell
   .\setup_dd_database.ps1
   ```

3. **Test Connection**:
   ```powershell
   psql -h localhost -p 5432 -U postgres -d due_diligence_db
   ```

## Monitoring Queries

```sql
-- Check report progress
SELECT company_name, status, completion_percentage 
FROM dd_section_status 
ORDER BY completion_percentage DESC;

-- View specific sections
SELECT company_name, introduction_engagement_context 
FROM due_diligence_reports 
WHERE company_name = 'YourCompany';

-- Count reports by status
SELECT status, COUNT(*) 
FROM due_diligence_reports 
GROUP BY status;
```

## n8n Configuration

In n8n, create a PostgreSQL credential with the above details, then update all PostgreSQL nodes in the workflow to use this credential ID.

The workflow will automatically:
- Create new records for Due Diligence tasks
- Generate each section iteratively using AI
- Track progress in the database
- Create PDF reports when complete
