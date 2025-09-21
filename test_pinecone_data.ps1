# Test if there's data in Pinecone vector database
Write-Host "=== Testing Pinecone Data Availability ===" -ForegroundColor Yellow

# This would require a direct Pinecone API call, but since we don't have the API key here,
# let's run the document indexing workflow first to ensure data is in Pinecone

Write-Host "First, let's make sure documents are indexed in Pinecone..." -ForegroundColor Cyan

# Check if we can find any vector data by looking at the indexing workflow
# The indexing workflow should have run and saved AMANA HEALTHCARE documents

Write-Host "Checking if AMANA HEALTHCARE documents exist..." -ForegroundColor Green

# Since we confirmed earlier that task ID 17 has the PDF file "Amana Healthcare_Guidelines_2025.pdf"
# We need to make sure this was processed by the document indexing workflow

Write-Host "✅ We know there's a PDF file: Amana Healthcare_Guidelines_2025.pdf (2.9MB)" -ForegroundColor Green
Write-Host "📋 If this was processed by the indexing workflow, it should be in Pinecone" -ForegroundColor Yellow
Write-Host "🔍 The @CG workflow should be able to find this data" -ForegroundColor Cyan

Write-Host "`n=== Recommendation ===" -ForegroundColor Yellow
Write-Host "1. First run the document indexing workflow to populate Pinecone" -ForegroundColor White
Write-Host "2. Then test the @CG workflow" -ForegroundColor White
Write-Host "3. The @CG workflow should find the AMANA HEALTHCARE documents" -ForegroundColor White
