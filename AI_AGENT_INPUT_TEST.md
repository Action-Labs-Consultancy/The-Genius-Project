# AI Agent Input Test for AMANA HEALTHCARE

## What the AI Agent will receive:

**Company Name:** AMANA HEALTHCARE
**Task Title:** AMANA HEALTHCARE @CG  
**Description:** Please provide a summary of all documents and information we have about AMANA HEALTHCARE. @CG What services do they offer and what are their key business details?

## AI Agent Prompt (what gets sent to AI):

**User Message:**
"I need you to search for information about AMANA HEALTHCARE to answer this specific request:

**COMPANY TO SEARCH FOR:** AMANA HEALTHCARE
**SPECIFIC REQUEST:** Please provide a summary of all documents and information we have about AMANA HEALTHCARE. @CG What services do they offer and what are their key business details?
**TASK TITLE:** AMANA HEALTHCARE @CG

IMPORTANT INSTRUCTIONS:
1. You MUST use the Pinecone Vector Store tool to search for "AMANA HEALTHCARE"
2. Search multiple times with different keywords if needed
3. Look for documents, attachments, or information related to this company
4. Do NOT respond with generic statements - provide specific information from the search results
5. If you find documents, summarize the key details about AMANA HEALTHCARE
6. If no documents are found, clearly state you searched for "AMANA HEALTHCARE" but found no results

Search now and provide a detailed response based on what you find!"

**System Message:**
"You are an AI assistant with access to a Pinecone Vector Store tool containing client documents. CRITICAL: You must ALWAYS use the Pinecone Vector Store tool to search for information before responding. Never provide generic responses - only respond based on actual search results from Pinecone. If you cannot find specific information in Pinecone, clearly state what you searched for and that no results were found."

## Expected Behavior:
1. AI Agent receives the above prompt
2. AI automatically uses Pinecone Vector Store tool to search for "AMANA HEALTHCARE"
3. AI finds the PDF document "Amana Healthcare_Guidelines_2025.pdf" 
4. AI summarizes the content from the PDF
5. AI provides detailed response about AMANA HEALTHCARE services and business details
6. Response gets posted as comment to the Kanboard task

## If it doesn't work:
- Check if document indexing workflow ran first
- Verify Pinecone has data for "AMANA HEALTHCARE"
- Check AI Agent tool connections
- Ensure Ollama models are running
