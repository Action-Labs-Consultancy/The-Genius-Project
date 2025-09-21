# Kanboard Content Generator Plugin

An intelligent Kanboard plugin that automatically generates relevant content when users mention `@CG` in task comments. The plugin integrates with your content generation API to provide contextual insights and suggestions.

## 🚀 Features

- ✅ **Automatic Trigger**: Monitors task comments for `@CG` mentions
- ✅ **Context-Aware**: Analyzes complete task context (title, description, comments, subtasks, files)
- ✅ **API Integration**: Connects to your content generator API with secure authentication
- ✅ **Intelligent Prompts**: Builds comprehensive prompts with task context and history
- ✅ **Formatted Output**: Posts generated content as formatted comments with AI identification
- ✅ **Error Handling**: Robust error handling and logging
- ✅ **Manual Generation**: Optional manual content generation endpoint

## 🔧 Installation

The plugin has been deployed to your Kanboard Docker container at `/var/www/app/plugins/ContentGenerator`.

### Enable the Plugin

1. **Access Kanboard**: Go to http://localhost:8000
2. **Login as Admin**
3. **Navigate to**: Settings → Plugins
4. **Find "Content Generator"** in the plugin list
5. **Click "Install" or "Enable"**

## 📝 Usage

### Automatic Content Generation

1. **Open any task** in your Kanboard
2. **Add a comment** containing `@CG` anywhere in the text
3. **Submit the comment**
4. **Wait a few seconds** for the AI to analyze the task
5. **See the generated content** appear as a new comment marked with 🤖

### Example Usage

```
I'm stuck on this implementation. @CG can you help analyze this?
```

```
The tests are failing and I'm not sure why. @CG provide some debugging suggestions.
```

```
@CG What are the next steps for this feature?
```

## 🔗 API Configuration

The plugin is pre-configured with your API settings:

- **Endpoint**: `http://192.168.100.137:2346/api/generate`
- **API Key**: `1fd5d457dc690c6996e4144cf3fee695c21037c9c759373d85adfcaba36b`
- **Username**: `CGgenerator`
- **Password**: `CGgenerator`

## 📊 What Data Gets Analyzed

When `@CG` is mentioned, the plugin collects and sends:

### Task Information
- Task title and description
- Current status and priority
- Due date and creation date
- Project context
- Assigned user information

### Task History
- All comments with timestamps and authors
- Subtasks and their statuses
- Attached files information
- Task links and relationships

### Generated Prompt
The plugin creates intelligent prompts like:
```
You are an AI assistant helping with project management and task analysis.

TASK CONTEXT:
Project: Mobile App Development
Task: Implement user authentication
Description: Create login/signup flow with OAuth integration
Status: Open
Assignee: John Doe

COMMENTS HISTORY:
- John Doe (2025-09-14 10:30): Started working on OAuth integration
- Jane Smith (2025-09-14 11:15): Found some issues with the redirect URLs

Please analyze this task and provide helpful insights, suggestions, or relevant content...
```

## 🎯 Expected API Response

Your content generator API should return JSON in one of these formats:

```json
{
  "content": "Generated content text here..."
}
```

```json
{
  "generated_text": "Generated content text here..."
}
```

```json
{
  "response": "Generated content text here..."
}
```

## 📋 Generated Comment Format

The AI-generated content appears as:

```
🤖 **AI Content Generator**

[Generated content here - could include insights, suggestions, 
code examples, debugging tips, next steps, etc.]

*Generated automatically via @CG mention*
```

## 🛠 Technical Details

### Plugin Structure
```
ContentGenerator/
├── Plugin.php                           # Main plugin class
├── Config/config.php                    # Plugin configuration
├── Controller/ContentGeneratorController.php # Manual generation controller
├── Helper/
│   ├── ContentGeneratorHelper.php       # Core API integration
│   └── CommentProcessor.php             # Comment monitoring
└── Locale/en_US/translations.php        # Translations
```

### Event Hooks
- Listens to `comment.create` events
- Processes comments in real-time
- Asynchronous content generation

### Security Features
- API key authentication
- Basic HTTP authentication
- User permission checks
- Error logging and handling

## 🔍 Troubleshooting

### Plugin Not Working
1. Check if plugin is enabled in Settings → Plugins
2. Verify Docker container has internet access to reach your API
3. Check Kanboard logs for errors

### API Connection Issues
1. Ensure your content generator API is running on `192.168.100.137:2346`
2. Verify the `/api/generate` endpoint is accessible
3. Check API key and credentials are correct

### @CG Not Triggering
1. Ensure you're typing `@CG` (case-insensitive)
2. Check that the comment was successfully saved
3. Look for error messages in the logs

### Manual Generation
You can also trigger content generation manually by visiting:
```
http://localhost:8000/task/[TASK_ID]/generate-content
```

## 📈 Monitoring

The plugin logs all activities:
- ✅ `@CG` mention detections
- 🔄 API calls and responses
- ❌ Error conditions
- 📝 Content generation success/failure

## 🔮 Future Enhancements

Potential improvements could include:
- Configurable trigger phrases (not just `@CG`)
- Custom prompt templates
- Content generation scheduling
- Integration with more AI providers
- User-specific content preferences

---

## 🎊 Ready to Use!

Your ContentGenerator plugin is now active and ready to assist your team with intelligent task analysis and content generation. Simply mention `@CG` in any task comment to see the magic happen!

**Example Workflow:**
1. User comments: "I need help with this bug @CG"
2. Plugin detects `@CG` mention
3. Collects all task context and history
4. Calls your content generator API
5. Posts AI-generated insights as a new comment
6. Team gets valuable assistance and suggestions

The AI will provide contextual help based on your specific task details, project context, and conversation history.
