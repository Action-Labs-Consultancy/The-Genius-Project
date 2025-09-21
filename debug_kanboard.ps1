# Debug script to check Kanboard data
$headers = @{ 
    'Authorization' = 'Basic ' + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes('admin:admin'))
    'Content-Type' = 'application/json' 
}

Write-Host "=== Checking Kanboard Projects ===" -ForegroundColor Yellow
$projectsBody = '{"jsonrpc":"2.0","method":"getAllProjects","id":1,"params":{}}'
$projects = Invoke-RestMethod -Uri 'http://localhost:8000/jsonrpc.php' -Method POST -Headers $headers -Body $projectsBody
Write-Host "Projects found:" -ForegroundColor Green
$projects.result | ForEach-Object { Write-Host "- $($_.name) (ID: $($_.id))" }

# Look for clients project
$clientsProject = $projects.result | Where-Object { $_.name -eq "clients" }
if ($clientsProject) {
    Write-Host "`n=== Found 'clients' project ===" -ForegroundColor Green
    Write-Host "Project ID: $($clientsProject.id)"
    
    # Get tasks from clients project
    Write-Host "`n=== Checking tasks in clients project ===" -ForegroundColor Yellow
    $tasksBody = "{`"jsonrpc`":`"2.0`",`"method`":`"getAllTasks`",`"id`":2,`"params`":{`"project_id`":$($clientsProject.id),`"status_id`":1}}"
    $tasks = Invoke-RestMethod -Uri 'http://localhost:8000/jsonrpc.php' -Method POST -Headers $headers -Body $tasksBody
    
    Write-Host "Active tasks found: $($tasks.result.Count)" -ForegroundColor Green
    if ($tasks.result.Count -gt 0) {
        $tasks.result | ForEach-Object { 
            Write-Host "- Task ID: $($_.id), Title: $($_.title)" 
            
            # Check attachments for first task
            if ($_.id) {
                $attachmentsBody = "{`"jsonrpc`":`"2.0`",`"method`":`"getAllTaskFiles`",`"id`":3,`"params`":{`"task_id`":$($_.id)}}"
                $attachments = Invoke-RestMethod -Uri 'http://localhost:8000/jsonrpc.php' -Method POST -Headers $headers -Body $attachmentsBody
                Write-Host "  Attachments: $($attachments.result.Count)" -ForegroundColor Cyan
            }
        }
    } else {
        Write-Host "No active tasks found in clients project!" -ForegroundColor Red
    }
} else {
    Write-Host "`n=== 'clients' project NOT FOUND ===" -ForegroundColor Red
    Write-Host "Available projects:" -ForegroundColor Yellow
    $projects.result | ForEach-Object { Write-Host "- $($_.name)" }
}
