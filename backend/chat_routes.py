# ─── OpenAI Chat Endpoints ─────────────────────────────────────────────────

import os

@app.route('/api/chat/conversations', methods=['POST'])
def create_chat_conversation():
    """Create a new chat conversation"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        title = data.get('title', 'New Chat')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        conversation = MongoChatConversation.create_conversation(user_id, title)
        return jsonify({
            'id': str(conversation['_id']),
            'user_id': conversation['user_id'],
            'title': conversation['title'],
            'messages': conversation['messages'],
            'created_at': conversation['created_at'].isoformat(),
            'updated_at': conversation['updated_at'].isoformat()
        })
    except Exception as e:
        print(f"Create chat conversation error: {e}")
        return jsonify({'error': 'Failed to create conversation'}), 500

@app.route('/api/chat/conversations/<string:conversation_id>', methods=['GET'])
def get_chat_conversation(conversation_id):
    """Get a specific chat conversation"""
    try:
        conversation = MongoChatConversation.get_conversation(conversation_id)
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        return jsonify({
            'id': str(conversation['_id']),
            'user_id': conversation['user_id'],
            'title': conversation['title'],
            'messages': conversation['messages'],
            'created_at': conversation['created_at'].isoformat(),
            'updated_at': conversation['updated_at'].isoformat()
        })
    except Exception as e:
        print(f"Get chat conversation error: {e}")
        return jsonify({'error': 'Failed to get conversation'}), 500

@app.route('/api/chat/conversations', methods=['GET'])
def get_user_conversations():
    """Get all conversations for a user"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        conversations = MongoChatConversation.get_user_conversations(user_id)
        return jsonify([{
            'id': str(conv['_id']),
            'user_id': conv['user_id'],
            'title': conv['title'],
            'messages': conv['messages'],
            'created_at': conv['created_at'].isoformat(),
            'updated_at': conv['updated_at'].isoformat()
        } for conv in conversations])
    except Exception as e:
        print(f"Get user conversations error: {e}")
        return jsonify({'error': 'Failed to get conversations'}), 500

@app.route('/api/chat/conversations/<string:conversation_id>/messages', methods=['POST'])
def send_chat_message(conversation_id):
    """Send a message and get OpenAI response"""
    try:
        from openai import OpenAI
        
        # Initialize OpenAI client with API key from environment
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise Exception("OPENAI_API_KEY environment variable not set")
        client = OpenAI(api_key=api_key)
        
        data = request.get_json()
        user_message = data.get('message')
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Get the conversation
        conversation = MongoChatConversation.get_conversation(conversation_id)
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        # Add user message to conversation
        MongoChatConversation.add_message(conversation_id, 'user', user_message)
        
        # Prepare messages for OpenAI API
        messages = [{"role": "system", "content": "You are a helpful assistant."}]
        
        # Add conversation history
        for msg in conversation['messages']:
            messages.append({
                "role": msg['role'],
                "content": msg['content']
            })
        
        # Add the new user message
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=1000,
            temperature=0.7
        )
        
        assistant_message = response.choices[0].message.content
        
        # Add assistant response to conversation
        updated_conversation = MongoChatConversation.add_message(conversation_id, 'assistant', assistant_message)
        
        return jsonify({
            'user_message': user_message,
            'assistant_message': assistant_message,
            'conversation': {
                'id': str(updated_conversation['_id']),
                'user_id': updated_conversation['user_id'],
                'title': updated_conversation['title'],
                'messages': updated_conversation['messages'],
                'created_at': updated_conversation['created_at'].isoformat(),
                'updated_at': updated_conversation['updated_at'].isoformat()
            }
        })
        
    except Exception as e:
        print(f"Send chat message error: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to send message'}), 500

@app.route('/api/chat/conversations/<string:conversation_id>', methods=['DELETE'])
def delete_chat_conversation(conversation_id):
    """Delete a chat conversation"""
    try:
        result = MongoChatConversation.delete_conversation(conversation_id)
        if result.deleted_count == 0:
            return jsonify({'error': 'Conversation not found'}), 404
        
        return jsonify({'message': 'Conversation deleted successfully'})
    except Exception as e:
        print(f"Delete chat conversation error: {e}")
        return jsonify({'error': 'Failed to delete conversation'}), 500

@app.route('/api/chat/conversations/<string:conversation_id>/title', methods=['PUT'])
def update_conversation_title(conversation_id):
    """Update conversation title"""
    try:
        data = request.get_json()
        title = data.get('title')
        
        if not title:
            return jsonify({'error': 'Title is required'}), 400
        
        conversation = MongoChatConversation.update_title(conversation_id, title)
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        return jsonify({
            'id': str(conversation['_id']),
            'user_id': conversation['user_id'],
            'title': conversation['title'],
            'messages': conversation['messages'],
            'created_at': conversation['created_at'].isoformat(),
            'updated_at': conversation['updated_at'].isoformat()
        })
    except Exception as e:
        print(f"Update conversation title error: {e}")
        return jsonify({'error': 'Failed to update title'}), 500
