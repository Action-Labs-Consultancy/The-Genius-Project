# 🔧 KANBOARD AI WORKFLOW - STEP-BY-STEP TROUBLESHOOTING

## 🚨 IF YOU'RE STILL GETTING ERRORS, FOLLOW THESE EXACT STEPS:

### STEP 1: CREATE CREDENTIALS FIRST
1. Go to n8n Settings → Credentials
2. Click "Add Credential" 
3. Search for "HTTP Basic Auth"
4. Name it EXACTLY: `KanBoard`
5. Username: `admin`
6. Password: `admin`
7. Save it

### STEP 2: CREATE NEW WORKFLOW MANUALLY

#### Node 1: Cron Trigger
- Add "Cron" node
- Name: `Every 3 Minutes`
- Expression: `0 */3 * * * *`

#### Node 2: HTTP Request (Get Tasks)
- Add "HTTP Request" node  
- Name: `Get Tasks`
- Method: `POST`
- URL: `http://localhost:8000/jsonrpc.php`
- Authentication: `Basic Auth` → Select credential: `KanBoard`
- Headers: Add header `Content-Type` = `application/json`
- Body: Select `JSON`
- Body content:
```json
{
  "jsonrpc": "2.0",
  "method": "getAllTasks", 
  "id": 1,
  "params": {
    "project_id": 1,
    "status_id": 1
  }
}
```

#### Node 3: Function (Find Task)
- Add "Function" node
- Name: `Find Task to Enhance`
- Copy this EXACT code:

```javascript
const tasks = $input.first().json.result || [];
console.log(`Checking ${tasks.length} tasks for enhancement`);

for (const task of tasks) {
  const description = task.description ? task.description.toString() : '';
  const title = task.title ? task.title.toString() : '';
  
  console.log(`Task ${task.id}: title="${title}" desc_length=${description.trim().length}`);
  
  if (description.trim().length < 20 && title.trim().length > 0) {
    console.log(`✅ Found task needing enhancement: "${title}" (ID: ${task.id})`);
    
    return {
      json: {
        task_id: task.id,
        title: title.trim(),
        description: description.trim(),
        project_id: task.project_id || 1,
        found: true
      }
    };
  }
}

console.log('ℹ️ No tasks need enhancement at this time');
return {
  json: {
    skip: true,
    message: 'No tasks need enhancement',
    found: false
  }
};
```

#### Node 4: IF (Check Task)
- Add "IF" node
- Name: `Has Task to Process?`
- Condition 1: `{{ $json.found }}` equals `true` (Boolean)

#### Node 5: HTTP Request (AI Enhance)
- Add "HTTP Request" node
- Name: `AI Enhance`
- Method: `POST`  
- URL: `http://localhost:11434/api/generate`
- Headers: Add `Content-Type` = `application/json`
- Body: Select `JSON`
- Body content:
```json
{
  "model": "mistral:latest",
  "prompt": "Enhance this task: {{ $json.title }}\n\nCreate:\n1. Clear description (2-3 sentences)\n2. Complexity rating 1-5\n3. Three relevant tags\n\nRespond ONLY with JSON:\n{\n  \"description\": \"your description\",\n  \"complexity\": 3,\n  \"tags\": [\"tag1\", \"tag2\", \"tag3\"]\n}",
  "stream": false
}
```

#### Node 6: Function (Prepare Update)
- Add "Function" node
- Name: `Prepare Update`
- Copy this EXACT code:

```javascript
const taskData = $('Find Task to Enhance').first().json;
const aiResponse = $input.first().json.response;

console.log(`Processing task: ${taskData.title}`);
console.log(`AI response length: ${aiResponse.length} characters`);

let enhancedData;
try {
  const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/);
  if (jsonMatch) {
    enhancedData = JSON.parse(jsonMatch[0]);
    console.log('AI JSON parsed successfully:', enhancedData.description.substring(0, 50) + '...');
  } else {
    throw new Error('No JSON found in AI response');
  }
} catch (error) {
  console.log(`JSON parsing failed: ${error.message}`);
  console.log('Using fallback enhancement');
  
  enhancedData = {
    description: `Enhanced: ${taskData.title}. This task requires careful analysis, proper planning, and systematic execution to achieve the desired outcome effectively.`,
    complexity: 3,
    tags: ['ai-enhanced', 'auto-generated', 'needs-review']
  };
}

const enhancedDescription = `${enhancedData.description}

🤖 AI Enhancement Applied
📊 Complexity: ${enhancedData.complexity}/5
🏷️ Tags: ${enhancedData.tags.join(', ')}
⏰ Enhanced: ${new Date().toISOString()}`;

const result = {
  task_id: parseInt(taskData.task_id),
  enhanced_description: enhancedDescription
};

console.log(`Ready to update task ${result.task_id}`);
return { json: result };
```

#### Node 7: HTTP Request (Update Task)
- Add "HTTP Request" node
- Name: `Update Task`
- Method: `POST`
- URL: `http://localhost:8000/jsonrpc.php`
- Authentication: `Basic Auth` → Select credential: `KanBoard`
- Headers: Add `Content-Type` = `application/json`
- Body: Select `JSON`
- Body content:
```json
{
  "jsonrpc": "2.0",
  "method": "updateTask",
  "id": 1,
  "params": {
    "id": {{ $json.task_id }},
    "description": "{{ $json.enhanced_description }}"
  }
}
```

### STEP 3: CONNECT THE NODES
1. Cron → Get Tasks
2. Get Tasks → Find Task to Enhance  
3. Find Task to Enhance → Has Task to Process?
4. Has Task to Process? → AI Enhance (connect to TRUE output)
5. AI Enhance → Prepare Update
6. Prepare Update → Update Task

### STEP 4: TEST INDIVIDUAL NODES
1. **Test Node 2**: Click "Execute Node" - should return list of tasks
2. **Test Node 3**: Should find task needing enhancement
3. **Test Node 5**: Should return AI response
4. **Test Node 7**: Should update the task

### STEP 5: ACTIVATE WORKFLOW
- Click "Active" toggle
- Check execution logs for any errors

## 🔍 WHAT TO CHECK IF STILL FAILING:

1. **Credential Issue**: Make sure KanBoard credential is exactly named `KanBoard`
2. **Ollama Running**: Check `http://localhost:11434` in browser
3. **Kanboard Running**: Check `http://localhost:8000` in browser  
4. **Tasks Available**: Make sure there are tasks with descriptions < 20 characters

Available tasks ready for enhancement:
- Task 10: 'taskkk' (0 chars)
- Task 11: 'Debug test task' (0 chars) 
- Task 12: 'Test workflow fix' (0 chars)
- Task 13: 'Final workflow test' (0 chars)
- Task 14: 'testest' (0 chars)
