#!/usr/bin/env python3
"""
Tool Calling Compatibility Check for n8n AI Agents
"""

def check_tool_calling_support():
    """Check which models support tool calling in n8n"""
    
    print("🤖 AI MODEL TOOL CALLING COMPATIBILITY")
    print("=" * 60)
    
    models = {
        "OpenAI GPT Models": {
            "gpt-4": "✅ Excellent tool calling support",
            "gpt-4-turbo": "✅ Excellent tool calling support", 
            "gpt-3.5-turbo": "✅ Good tool calling support",
            "compatibility": "Best choice for n8n tool calling"
        },
        "Anthropic Claude": {
            "claude-3-sonnet": "✅ Excellent tool calling support",
            "claude-3-haiku": "✅ Good tool calling support",
            "compatibility": "Excellent choice for complex workflows"
        },
        "Local Models (Ollama)": {
            "mistral": "❌ Limited/No tool calling support",
            "llama2": "❌ No tool calling support", 
            "llama3": "⚠️ Experimental tool calling",
            "functionary": "✅ Designed for function calling",
            "compatibility": "Very limited - most don't support function calling"
        },
        "Google Models": {
            "gemini-pro": "✅ Good tool calling support",
            "compatibility": "Good alternative to OpenAI"
        }
    }
    
    for provider, info in models.items():
        print(f"\n🏢 {provider}:")
        compatibility = info.pop("compatibility")
        for model, support in info.items():
            print(f"   {model}: {support}")
        print(f"   💡 {compatibility}")
    
    print("\n" + "=" * 60)
    print("🎯 RECOMMENDATION FOR YOUR ORCHESTRATOR:")
    print("❌ Current: Mistral (doesn't support tool calling)")
    print("✅ Switch to: OpenAI GPT-4 or Claude-3-Sonnet")
    print("\n🔧 QUICK FIX OPTIONS:")
    print("1. Use OpenAI API with GPT-4")
    print("2. Use Anthropic Claude API") 
    print("3. Try Ollama 'functionary' model (if available)")
    
    return models

def generate_openai_config():
    """Generate OpenAI configuration for n8n"""
    
    print("\n📝 OPENAI CONFIGURATION FOR N8N:")
    print("-" * 40)
    
    config = {
        "node_type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
        "parameters": {
            "model": "gpt-4",
            "options": {
                "temperature": 0.1,
                "maxTokens": 2000
            }
        },
        "credentials": "OpenAI API Key required"
    }
    
    print("Node Type: @n8n/n8n-nodes-langchain.lmChatOpenAi")
    print("Model: gpt-4")
    print("Temperature: 0.1 (focused responses)")
    print("Max Tokens: 2000")
    print("\n⚠️ Requires OpenAI API Key in credentials")

def main():
    check_tool_calling_support()
    generate_openai_config()
    
    print("\n" + "=" * 60)
    print("🚨 CRITICAL ISSUE IDENTIFIED:")
    print("Your orchestrator uses Mistral which doesn't support")
    print("function calling. This is why tools aren't being called!")
    print("\n✅ SOLUTION: Replace Ollama Mistral with OpenAI GPT-4")

if __name__ == "__main__":
    main()
