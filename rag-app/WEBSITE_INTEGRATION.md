# Website Integration Guide

This guide explains how to integrate your Local RAG Chatbot into your existing website.

## Integration Options

### Option 1: Iframe Embed

The simplest way to add the chatbot to your website:

```html
<iframe 
    src="http://localhost:8000" 
    width="800" 
    height="600"
    style="border: none; border-radius: 10px;"
    title="RAG Chatbot">
</iframe>
```

### Option 2: Popup/Modal Integration

Add a chat button that opens the chatbot in a modal:

```html
<!-- Chat Button -->
<button id="openChat" style="
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 50px;
    padding: 15px 20px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    z-index: 1000;
">
    💬 Ask AI
</button>

<!-- Chat Modal -->
<div id="chatModal" style="
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 1001;
">
    <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 800px;
        height: 80%;
        background: white;
        border-radius: 15px;
        overflow: hidden;
    ">
        <iframe 
            src="http://localhost:8000" 
            width="100%" 
            height="100%"
            style="border: none;"
            title="RAG Chatbot">
        </iframe>
        <button onclick="closeChat()" style="
            position: absolute;
            top: 10px;
            right: 10px;
            background: #ff6b6b;
            color: white;
            border: none;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            cursor: pointer;
        ">×</button>
    </div>
</div>

<script>
function openChat() {
    document.getElementById('chatModal').style.display = 'block';
}

function closeChat() {
    document.getElementById('chatModal').style.display = 'none';
}

document.getElementById('openChat').onclick = openChat;

// Close on background click
document.getElementById('chatModal').onclick = function(e) {
    if (e.target === this) closeChat();
}
</script>
```

### Option 3: Custom API Integration

Use the REST API to integrate chat functionality into your existing interface:

```javascript
async function sendMessage(message) {
    try {
        const response = await fetch('http://localhost:8000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                max_tokens: 512,
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        return {
            response: data.response,
            sources: data.sources,
            processingTime: data.processing_time
        };
    } catch (error) {
        console.error('Chat error:', error);
        return { response: 'Sorry, there was an error processing your request.' };
    }
}

// Usage example
sendMessage("What is the main topic of the documents?")
    .then(result => {
        console.log('AI Response:', result.response);
        console.log('Sources:', result.sources);
    });
```

### Option 4: WebSocket Integration

For real-time chat experience in your custom interface:

```javascript
const socket = new WebSocket('ws://localhost:8000/ws');

socket.onopen = function(event) {
    console.log('Connected to RAG chatbot');
};

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    switch(data.type) {
        case 'typing':
            showTypingIndicator(data.message);
            break;
        case 'response':
            hideTypingIndicator();
            displayMessage(data.message, data.sources);
            break;
        case 'error':
            showError(data.message);
            break;
    }
};

function sendChatMessage(message) {
    socket.send(JSON.stringify({
        type: 'chat',
        message: message
    }));
}
```

## Production Deployment

### 1. Change Host Configuration

For production, update `web_app.py`:

```python
if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",  # Allow external connections
        port=8000,
        reload=False
    )
```

### 2. Use a Process Manager

Use PM2 or systemd to keep the service running:

```bash
# Install PM2
npm install -g pm2

# Start the service
pm2 start "python3 web_app.py" --name rag-chatbot

# Save PM2 configuration
pm2 save
pm2 startup
```

### 3. Reverse Proxy Setup (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location /chat/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. Environment Variables

Create a `.env` file for configuration:

```bash
OLLAMA_BASE_URL=http://localhost:11434
CHROMA_PERSIST_DIR=./db
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=["http://your-website.com"]
```

## Security Considerations

1. **Firewall**: Only expose the chat port to trusted networks
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Authentication**: Add user authentication if needed
4. **HTTPS**: Use SSL/TLS in production
5. **Input Validation**: Sanitize user inputs
6. **CORS**: Configure proper CORS origins

## Monitoring

Add health checks and monitoring:

```bash
# Health check endpoint
curl http://localhost:8000/health

# System status
curl http://localhost:8000/status
```

## Troubleshooting

Common issues and solutions:

1. **Port conflicts**: Change the port in `web_app.py`
2. **CORS errors**: Update CORS settings for your domain
3. **Connection refused**: Ensure Ollama is running
4. **No responses**: Check that documents are ingested
5. **Slow responses**: Consider GPU acceleration for embeddings

For more help, check the main README.md or open an issue on GitHub.
