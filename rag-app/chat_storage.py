#!/usr/bin/env python3
"""
Chat Storage System for RAG Chatbot
Handles saving, loading, and managing chat conversations
"""

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import uuid
from dataclasses import dataclass, asdict
from rich.console import Console

console = Console()

@dataclass
class ChatMessage:
    """Individual chat message"""
    id: str
    user_message: str
    assistant_response: str
    timestamp: str
    context_sources: List[str]
    mode: str = "auto"

@dataclass
class ChatConversation:
    """Complete chat conversation"""
    id: str
    title: str
    created_at: str
    updated_at: str
    messages: List[ChatMessage]
    total_messages: int = 0

class ChatStorage:
    """Handles persistent storage of chat conversations"""
    
    def __init__(self, db_path: str = "chat_history.db"):
        self.db_path = Path(db_path)
        self._init_database()
    
    def _init_database(self):
        """Initialize the SQLite database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Create conversations table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS conversations (
                        id TEXT PRIMARY KEY,
                        title TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL,
                        total_messages INTEGER DEFAULT 0
                    )
                """)
                
                # Create messages table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS messages (
                        id TEXT PRIMARY KEY,
                        conversation_id TEXT NOT NULL,
                        user_message TEXT NOT NULL,
                        assistant_response TEXT NOT NULL,
                        timestamp TEXT NOT NULL,
                        context_sources TEXT,
                        mode TEXT DEFAULT 'auto',
                        message_order INTEGER,
                        FOREIGN KEY (conversation_id) REFERENCES conversations (id)
                    )
                """)
                
                conn.commit()
                console.print("[green]✓ Chat database initialized[/green]")
                
        except Exception as e:
            console.print(f"[red]❌ Database initialization error: {e}[/red]")
    
    def create_conversation(self, title: str = None) -> str:
        """Create a new conversation and return its ID"""
        conversation_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        if not title:
            title = f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO conversations (id, title, created_at, updated_at, total_messages)
                    VALUES (?, ?, ?, ?, 0)
                """, (conversation_id, title, timestamp, timestamp))
                conn.commit()
                
                console.print(f"[green]✓ Created new conversation: {title}[/green]")
                return conversation_id
                
        except Exception as e:
            console.print(f"[red]❌ Error creating conversation: {e}[/red]")
            return None
    
    def save_message(self, conversation_id: str, user_message: str, 
                    assistant_response: str, context_sources: List[str], 
                    mode: str = "auto") -> bool:
        """Save a message to a conversation"""
        message_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get current message count
                cursor.execute("""
                    SELECT COUNT(*) FROM messages WHERE conversation_id = ?
                """, (conversation_id,))
                message_order = cursor.fetchone()[0]
                
                # Insert message
                cursor.execute("""
                    INSERT INTO messages 
                    (id, conversation_id, user_message, assistant_response, 
                     timestamp, context_sources, mode, message_order)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (message_id, conversation_id, user_message, assistant_response,
                      timestamp, json.dumps(context_sources), mode, message_order))
                
                # Update conversation
                cursor.execute("""
                    UPDATE conversations 
                    SET updated_at = ?, total_messages = total_messages + 1
                    WHERE id = ?
                """, (timestamp, conversation_id))
                
                conn.commit()
                return True
                
        except Exception as e:
            console.print(f"[red]❌ Error saving message: {e}[/red]")
            return False
    
    def get_conversations(self, limit: int = 50) -> List[Dict]:
        """Get list of all conversations"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id, title, created_at, updated_at, total_messages
                    FROM conversations
                    ORDER BY updated_at DESC
                    LIMIT ?
                """, (limit,))
                
                conversations = []
                for row in cursor.fetchall():
                    conversations.append({
                        'id': row[0],
                        'title': row[1],
                        'created_at': row[2],
                        'updated_at': row[3],
                        'total_messages': row[4]
                    })
                
                return conversations
                
        except Exception as e:
            console.print(f"[red]❌ Error fetching conversations: {e}[/red]")
            return []
    
    def get_conversation(self, conversation_id: str) -> Optional[ChatConversation]:
        """Get a complete conversation with all messages"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get conversation details
                cursor.execute("""
                    SELECT id, title, created_at, updated_at, total_messages
                    FROM conversations WHERE id = ?
                """, (conversation_id,))
                
                conv_row = cursor.fetchone()
                if not conv_row:
                    return None
                
                # Get messages
                cursor.execute("""
                    SELECT id, user_message, assistant_response, timestamp, 
                           context_sources, mode
                    FROM messages 
                    WHERE conversation_id = ?
                    ORDER BY message_order ASC
                """, (conversation_id,))
                
                messages = []
                for msg_row in cursor.fetchall():
                    context_sources = json.loads(msg_row[4]) if msg_row[4] else []
                    message = ChatMessage(
                        id=msg_row[0],
                        user_message=msg_row[1],
                        assistant_response=msg_row[2],
                        timestamp=msg_row[3],
                        context_sources=context_sources,
                        mode=msg_row[5]
                    )
                    messages.append(message)
                
                conversation = ChatConversation(
                    id=conv_row[0],
                    title=conv_row[1],
                    created_at=conv_row[2],
                    updated_at=conv_row[3],
                    messages=messages,
                    total_messages=conv_row[4]
                )
                
                return conversation
                
        except Exception as e:
            console.print(f"[red]❌ Error loading conversation: {e}[/red]")
            return None
    
    def delete_conversation(self, conversation_id: str) -> bool:
        """Delete a conversation and all its messages"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Delete messages first (foreign key constraint)
                cursor.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
                
                # Delete conversation
                cursor.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
                
                conn.commit()
                return True
                
        except Exception as e:
            console.print(f"[red]❌ Error deleting conversation: {e}[/red]")
            return False
    
    def update_conversation_title(self, conversation_id: str, new_title: str) -> bool:
        """Update conversation title"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE conversations 
                    SET title = ?, updated_at = ?
                    WHERE id = ?
                """, (new_title, datetime.now().isoformat(), conversation_id))
                
                conn.commit()
                return cursor.rowcount > 0
                
        except Exception as e:
            console.print(f"[red]❌ Error updating conversation title: {e}[/red]")
            return False
    
    def search_conversations(self, query: str, limit: int = 20) -> List[Dict]:
        """Search conversations by title or message content"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT DISTINCT c.id, c.title, c.created_at, c.updated_at, c.total_messages
                    FROM conversations c
                    LEFT JOIN messages m ON c.id = m.conversation_id
                    WHERE c.title LIKE ? OR m.user_message LIKE ? OR m.assistant_response LIKE ?
                    ORDER BY c.updated_at DESC
                    LIMIT ?
                """, (f"%{query}%", f"%{query}%", f"%{query}%", limit))
                
                conversations = []
                for row in cursor.fetchall():
                    conversations.append({
                        'id': row[0],
                        'title': row[1],
                        'created_at': row[2],
                        'updated_at': row[3],
                        'total_messages': row[4]
                    })
                
                return conversations
                
        except Exception as e:
            console.print(f"[red]❌ Error searching conversations: {e}[/red]")
            return []
    
    def export_conversation(self, conversation_id: str, format: str = "json") -> Optional[str]:
        """Export conversation to file"""
        conversation = self.get_conversation(conversation_id)
        if not conversation:
            return None
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"chat_export_{conversation.title.replace(' ', '_')}_{timestamp}"
        
        try:
            if format.lower() == "json":
                filepath = f"{filename}.json"
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(asdict(conversation), f, indent=2, ensure_ascii=False)
            
            elif format.lower() == "txt":
                filepath = f"{filename}.txt"
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(f"Chat Conversation: {conversation.title}\n")
                    f.write(f"Created: {conversation.created_at}\n")
                    f.write(f"Updated: {conversation.updated_at}\n")
                    f.write("=" * 50 + "\n\n")
                    
                    for msg in conversation.messages:
                        f.write(f"[{msg.timestamp}] User:\n{msg.user_message}\n\n")
                        f.write(f"Assistant:\n{msg.assistant_response}\n")
                        if msg.context_sources:
                            f.write(f"Sources: {', '.join(msg.context_sources)}\n")
                        f.write("\n" + "-" * 30 + "\n\n")
            
            return filepath
            
        except Exception as e:
            console.print(f"[red]❌ Error exporting conversation: {e}[/red]")
            return None

# Example usage functions
def create_chat_storage() -> ChatStorage:
    """Create and return a ChatStorage instance"""
    return ChatStorage()

if __name__ == "__main__":
    # Test the chat storage system
    storage = ChatStorage()
    
    # Create a test conversation
    conv_id = storage.create_conversation("Test Chat")
    
    if conv_id:
        # Add some test messages
        storage.save_message(
            conv_id, 
            "Hello, how are you?", 
            "I'm doing great! How can I help you today?", 
            []
        )
        
        storage.save_message(
            conv_id,
            "What's the weather like?",
            "I don't have access to real-time weather data, but I can help you with document-related questions or general conversation.",
            []
        )
        
        # Retrieve and display the conversation
        conversation = storage.get_conversation(conv_id)
        if conversation:
            console.print(f"\n[bold]Conversation: {conversation.title}[/bold]")
            console.print(f"Messages: {conversation.total_messages}")
            
            for msg in conversation.messages:
                console.print(f"\n[green]User:[/green] {msg.user_message}")
                console.print(f"[cyan]Assistant:[/cyan] {msg.assistant_response}")
        
        # List all conversations
        console.print(f"\n[bold]All Conversations:[/bold]")
        conversations = storage.get_conversations()
        for conv in conversations:
            console.print(f"• {conv['title']} ({conv['total_messages']} messages)")
