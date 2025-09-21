# Due Diligence Automation - Docker Setup

This guide will help you set up a complete Due Diligence automation system using Docker containers with n8n, Kanboard, Ollama (local AI), and supporting services.

## 🏗️ Architecture Overview

The setup includes:
- **n8n**: Workflow automation platform
- **Kanboard**: Task management system
- **Ollama**: Local AI models (Mistral, FinBERT)
- **PostgreSQL**: Database for knowledge base storage
- **Redis**: Caching and session management
- **MinIO**: Object storage for file handling

## 📋 Prerequisites

- Docker Desktop installed and running
- At least 8GB RAM available
- 10GB free disk space
- NVIDIA GPU (optional, for faster AI processing)

## 🚀 Quick Start

### Windows (PowerShell)
```powershell
.\setup-dd-docker.ps1
```

### Linux/Mac (Bash)
```bash
chmod +x setup-dd-docker.sh
./setup-dd-docker.sh
```

### Manual Setup
```bash
# Build and start all services
docker-compose -f docker-compose.dd.yml build
docker-compose -f docker-compose.dd.yml up -d

# Setup AI models
docker exec ollama-dd ollama pull mistral:latest
docker exec ollama-dd ollama pull deepseek-coder:1.3b-instruct
```

## 🔧 Service Access

| Service | URL | Username | Password |
|---------|-----|----------|----------|
| n8n | http://localhost:5678 | admin | changeme123 |
| Kanboard | http://localhost:8000 | admin | admin |
| Ollama API | http://localhost:11434 | - | - |
| MinIO Console | http://localhost:9001 | minioadmin | changeme123 |
| PostgreSQL | localhost:5432 | dduser | changeme123 |
| Redis | localhost:6379 | - | - |

## 📝 Configuration Steps

### 1. Import the n8n Workflow
1. Open n8n at http://localhost:5678
2. Login with admin/changeme123
3. Go to **Workflows** → **Import from File**
4. Select `Enhanced_DD_MCA_Workflow_Fixed.json`
5. Click **Import Workflow**

### 2. Configure Kanboard API in n8n
1. In n8n, go to **Settings** → **Credentials**
2. Create new **Kanboard API** credential:
   - **URL**: http://kanboard:80
   - **Username**: admin
   - **Password**: admin

### 3. Configure Ollama API in n8n
1. Create new **Ollama API** credential:
   - **Base URL**: http://ollama:11434

### 4. Set up Kanboard Project
1. Open Kanboard at http://localhost:8000
2. Login with admin/admin
3. Create a new project called "Due Diligence"
4. Enable API access in project settings

## 📊 Using the System

### Creating a Due Diligence Task

1. **In Kanboard**, create a new task with:
   - **Title**: `Due Diligence: [Company Name]`
   - **Description**: Include the company website URL
   - **Attachments**: Upload PDF documents (financial reports, etc.)

2. **The n8n workflow will automatically**:
   - Detect the new task every 5 minutes
   - Extract PDF content and website data
   - Categorize content (financial vs non-financial)
   - Use FinBERT for financial analysis
   - Use Mistral for general analysis
   - Generate all 20 DD sections using Maker-Checker-Approver process
   - Store results in the knowledge base
   - Post the final report to Kanboard

### Monitoring Progress

- **n8n Executions**: View workflow progress in n8n
- **Kanboard Comments**: See section-by-section progress
- **PostgreSQL Database**: Query the knowledge base directly
- **Logs**: `docker-compose -f docker-compose.dd.yml logs -f n8n`

## 🗃️ Data Storage

### Knowledge Base Structure
```sql
-- Main content storage
knowledge_base(task_id, company_name, content_type, source_type, content_text)

-- DD sections tracking
dd_sections(task_id, section_name, content, status)

-- Financial analysis results
financial_analysis(task_id, sentiment_score, financial_metrics)
```

### Accessing the Database
```bash
# Connect to PostgreSQL
docker exec -it postgres-dd psql -U dduser -d due_diligence

# View knowledge base
SELECT task_id, company_name, content_type, source_type FROM knowledge_base;

# Check section completion
SELECT task_id, section_name, status FROM dd_sections WHERE status = 'approved';
```

## 🔧 Customization

### Adding Custom AI Models
```bash
# Add more models to Ollama
docker exec ollama-dd ollama pull llama2:latest
docker exec ollama-dd ollama pull codellama:latest
```

### Modifying DD Sections
Edit the sections list in the n8n workflow or update the database:
```sql
UPDATE dd_sections SET section_name = 'New Section Name' WHERE section_order = 1;
```

### Environment Variables
Modify `docker-compose.dd.yml` to change:
- Database passwords
- n8n authentication
- AI model settings
- Resource limits

## 🐛 Troubleshooting

### Common Issues

**n8n can't connect to Kanboard**
```bash
# Check network connectivity
docker exec n8n-dd-automation ping kanboard
```

**Ollama models not loading**
```bash
# Check available models
docker exec ollama-dd ollama list

# Re-pull models
docker exec ollama-dd ollama pull mistral:latest
```

**Workflow not triggering**
- Ensure task title starts with "Due Diligence:"
- Check n8n execution logs
- Verify Kanboard API credentials

### Logs and Debugging
```bash
# View all service logs
docker-compose -f docker-compose.dd.yml logs

# View specific service logs
docker-compose -f docker-compose.dd.yml logs -f n8n
docker-compose -f docker-compose.dd.yml logs -f ollama
docker-compose -f docker-compose.dd.yml logs -f kanboard

# Check service status
docker-compose -f docker-compose.dd.yml ps
```

### Performance Tuning

**For better AI performance:**
- Increase Docker memory allocation to 16GB+
- Use NVIDIA GPU if available
- Adjust Ollama concurrent request limits

**For large document processing:**
- Increase n8n timeout settings
- Add more MinIO storage
- Scale PostgreSQL resources

## 🔒 Security Considerations

### Production Deployment
1. **Change default passwords** in docker-compose.dd.yml
2. **Enable HTTPS** with reverse proxy (nginx/traefik)
3. **Restrict network access** to internal services
4. **Set up backups** for volumes
5. **Use secrets management** for credentials

### Backup Strategy
```bash
# Backup volumes
docker run --rm -v dd_n8n_data:/data -v $(pwd):/backup ubuntu tar czf /backup/n8n_backup.tar.gz /data
docker run --rm -v dd_postgres_data:/data -v $(pwd):/backup ubuntu tar czf /backup/postgres_backup.tar.gz /data
```

## 📚 Additional Resources

- [n8n Documentation](https://docs.n8n.io/)
- [Kanboard Documentation](https://docs.kanboard.org/)
- [Ollama Model Library](https://ollama.ai/library)
- [FinBERT Information](https://huggingface.co/ProsusAI/finbert)

## 🆘 Support

If you encounter issues:
1. Check the logs first
2. Verify all services are running
3. Test individual components
4. Review the n8n workflow execution history
5. Check database connectivity

---

**Note**: This setup is designed for development and testing. For production use, implement proper security measures, monitoring, and backup strategies.
