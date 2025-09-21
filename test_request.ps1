$body = @{
    name = "TechCorp Solutions"
    company = "TechCorp Solutions"
    email = "contact@techcorp.com"
    phone = "(512) 555-0123"
    scopeOfWork = "Implementation of digital marketing automation platform"
    pricing = "Total project value: $125,000"
    terms = "Project includes 3 months post-launch support"
    requestedBy = "Head of Marketing"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:10000/api/client-requests" -Method POST -ContentType "application/json" -Body $body

Write-Host "Client Request Created:"
$response | ConvertTo-Json -Depth 3
