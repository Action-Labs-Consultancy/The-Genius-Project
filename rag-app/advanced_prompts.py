#!/usr/bin/env python3
"""
Advanced prompt templates for the upgraded RAG system
"""

class AdvancedPromptTemplates:
    """Collection of tuned prompts for different scenarios"""
    
    @staticmethod
    def system_prompt() -> str:
        """Base system prompt for Llama3"""
        return """You are an intelligent document assistant powered by Retrieval-Augmented Generation (RAG). 
You have access to a knowledge base of documents and can engage in general conversation. 

Key capabilities:
- Search and analyze documents with high accuracy
- Provide detailed, contextual answers based on retrieved information
- Engage in helpful general conversation when no documents are relevant
- Remember conversation context for better continuity
- Explain your reasoning when appropriate

Guidelines:
- Be accurate and cite sources when using document information
- Be conversational and helpful for general questions
- Ask clarifying questions when needed
- Admit when you don't know something
- Keep responses clear and well-structured"""

    @staticmethod
    def document_analysis_prompt(context: str, query: str, history: str = "") -> str:
        """Prompt for document-based questions with enhanced analysis"""
        return f"""Based on the provided document context and conversation history, please answer the user's question with accuracy and detail.

DOCUMENT CONTEXT:
{context}

{history}

INSTRUCTIONS:
1. Answer based primarily on the provided context
2. If the context doesn't contain enough information, say so clearly
3. Provide specific details and quotes when available
4. Structure your response clearly with bullet points or sections if helpful
5. Consider the conversation history for better context understanding

USER QUESTION: {query}

RESPONSE:"""

    @staticmethod
    def general_conversation_prompt(query: str, history: str = "") -> str:
        """Prompt for general conversation with memory"""
        return f"""You are a helpful AI assistant engaging in conversation. Use the conversation history to provide contextual and relevant responses.

{history}

Be conversational, helpful, and detailed when appropriate. If the user asks about documents or specific information that might be in a knowledge base, suggest they ask a more specific document-related question.

USER MESSAGE: {query}

RESPONSE:"""

    @staticmethod
    def summarization_prompt(content: str, focus: str = "") -> str:
        """Prompt for document summarization"""
        focus_instruction = f" Focus particularly on: {focus}" if focus else ""
        
        return f"""Please provide a comprehensive summary of the following content.{focus_instruction}

CONTENT TO SUMMARIZE:
{content}

INSTRUCTIONS:
1. Create a clear, well-structured summary
2. Highlight the main points and key information
3. Use bullet points or sections to organize information
4. Include relevant details while keeping it concise
5. Mention any important dates, numbers, or specific details

SUMMARY:"""

    @staticmethod
    def question_classification_prompt(query: str) -> str:
        """Prompt to classify question type"""
        return f"""Classify the following user question into one of these categories:

1. DOCUMENT_SEARCH - Questions about specific information, policies, procedures, or content that would be in documents
2. GENERAL_CONVERSATION - General questions, greetings, personal conversations, or topics not requiring document lookup
3. MIXED - Questions that might benefit from both document search and general knowledge

Consider keywords like: "what does the document say", "according to", "policy", "procedure", "hours", "contact", "instructions", etc. for DOCUMENT_SEARCH.

USER QUESTION: {query}

CLASSIFICATION (respond with just the category name):"""

    @staticmethod
    def follow_up_prompt(original_query: str, follow_up: str, context: str, history: str) -> str:
        """Prompt for handling follow-up questions"""
        return f"""The user is asking a follow-up question. Use the conversation history and context to provide a relevant response.

ORIGINAL QUESTION: {original_query}
FOLLOW-UP QUESTION: {follow_up}

CONTEXT:
{context}

CONVERSATION HISTORY:
{history}

INSTRUCTIONS:
1. Consider how the follow-up relates to the original question
2. Use both the document context and conversation history
3. Provide a comprehensive answer that builds on previous exchanges
4. If clarification is needed, ask specific questions

RESPONSE:"""

# Example usage functions for the main RAG system
def create_enhanced_prompt(template_type: str, **kwargs) -> str:
    """Create an enhanced prompt based on type and parameters"""
    templates = AdvancedPromptTemplates()
    
    if template_type == "document":
        return templates.document_analysis_prompt(
            kwargs.get('context', ''),
            kwargs.get('query', ''),
            kwargs.get('history', '')
        )
    elif template_type == "general":
        return templates.general_conversation_prompt(
            kwargs.get('query', ''),
            kwargs.get('history', '')
        )
    elif template_type == "summary":
        return templates.summarization_prompt(
            kwargs.get('content', ''),
            kwargs.get('focus', '')
        )
    elif template_type == "classify":
        return templates.question_classification_prompt(kwargs.get('query', ''))
    elif template_type == "followup":
        return templates.follow_up_prompt(
            kwargs.get('original_query', ''),
            kwargs.get('follow_up', ''),
            kwargs.get('context', ''),
            kwargs.get('history', '')
        )
    else:
        return templates.system_prompt()

if __name__ == "__main__":
    # Test the prompts
    templates = AdvancedPromptTemplates()
    print("System Prompt:")
    print(templates.system_prompt())
    print("\n" + "="*50 + "\n")
    
    print("Sample Document Analysis Prompt:")
    print(templates.document_analysis_prompt(
        "The office hours are 9 AM to 5 PM, Monday through Friday.",
        "What are your business hours?",
        "Human: Hello\nAssistant: Hi! How can I help you today?"
    ))
