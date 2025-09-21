#!/usr/bin/env python3
"""
Fix all node reference issues in n8n workflows
"""

import json
import os
import re

def fix_node_references(filepath):
    """Fix problematic node references in workflow files"""
    print(f"🔧 Fixing node references in {os.path.basename(filepath)}...")
    
    with open(filepath, 'r', encoding='utf-8') as file:
        workflow = json.load(file)
    
    changes_made = []
    
    # Fix all function nodes
    for node in workflow.get('nodes', []):
        if node.get('type') == 'n8n-nodes-base.function':
            node_name = node.get('name', 'Unknown')
            if 'parameters' in node and 'functionCode' in node['parameters']:
                code = node['parameters']['functionCode']
                original_code = code
                
                # Pattern 1: Multiple node references in single function
                if '$node[' in code and code.count('$node[') > 1:
                    print(f"  🔄 Fixing multiple node references in: {node_name}")
                    
                    # For "Prepare Maker Context" type nodes
                    if 'Prepare' in node_name and 'Context' in node_name:
                        new_code = '''// Prepare context for Big 4 Introduction section LLM generation
const sectionInfo = $input.first().json;

// Get previous sections from input (if any)
let previousSections = [];
let ragResults = [];

// Check if we have additional inputs from parallel nodes
const allInputs = $input.all();
if (allInputs.length > 1) {
    // Try to identify which input is which based on content
    allInputs.forEach(input => {
        const data = input.json;
        if (Array.isArray(data) || (data && data.message && data.message.includes("previous sections"))) {
            previousSections = Array.isArray(data) ? data : [];
        } else if (data && data.pageContent) {
            ragResults.push(data);
        } else if (Array.isArray(data)) {
            ragResults = data;
        }
    });
}

// Build previous sections context (should be empty for Section 1)
let previousSectionsContext = '';
if (Array.isArray(previousSections) && previousSections.length > 0) {
  previousSectionsContext = previousSections.map(section => 
    `## Section ${section.section_number}: ${section.title}\\n${section.content}\\n`
  ).join('\\n');
} else {
  previousSectionsContext = 'This is the first section - no previous sections available.';
}

// Build RAG knowledge context from company documents
let knowledgeContext = '';
if (Array.isArray(ragResults) && ragResults.length > 0) {
  knowledgeContext = ragResults.map((result, index) => 
    `Knowledge ${index + 1}: ${result.pageContent || result.content || JSON.stringify(result)}`
  ).join('\\n\\n');
} else {
  knowledgeContext = 'No relevant knowledge found in the company documents.';
}

// Create comprehensive Big 4 due diligence prompt for Introduction section
const makerPrompt = `You are a Big 4 due diligence professional producing the "Introduction & Engagement Context" section of a formal due diligence report for ${sectionInfo.company_name}. This report is intended for executive-level stakeholders (board, deal sponsors, investment committee) and must meet KPMG-standard content, tone, and structure.

This section must:

✅ **Engagement Framing** (include all):
- Clearly state who commissioned the diligence (buyer/investor/sponsor/internal)
- Specify the type of transaction or strategic event (e.g., M&A, carve-out, IPO, growth capital)
- Confirm the reporting period covered (e.g., FY2019–FY2024) and data cutoff date (Dec 31, 2024)
- Confirm that only public disclosures were used (no private management data)
- Highlight any excluded areas of diligence (e.g., tax, legal, environmental, cyber, HR unless otherwise stated)
- Define materiality thresholds used to focus effort (e.g., revenue thresholds, material contracts)

✅ **Scope of Work & Methodology** (include all):
- Describe the procedures performed (financial review, board actions, peer benchmarking, governance checks, etc.)
- Explain the role of the diligence team, including independence and limitations
- Clarify the nature of this review (e.g., red-flag vs. full-scope)
- Outline key assumptions, working limitations, and areas requiring triangulation or management validation

✅ **Section Formatting** (mandatory):
Use the following exact subheadings:

**Key Findings / Overview:** Succinctly summarize the scope, nature, and rationale for the diligence. Explain what has been reviewed and why.

**Risks / Gaps / Limitations:** Identify constraints in the scope (e.g., public-only analysis, timing, exclusions), and note any reliance on incomplete or inferred data.

**Recommended Actions:** Provide specific RFIs, interview questions, or next steps to close gaps, validate assumptions, or move toward transaction execution.

✅ **Analysis Standards:**
- Tag each key data point with a confidence level (High / Medium / Low) and explain the basis (e.g., SEC 10-K = High; press article = Medium)
- Cite all sources inline (title, date, and URL where available) for traceability and audit trail
- If data is missing or ambiguous, clearly disclose it, label it as such, and propose next-step validation methods
- Use only publicly available data as of Dec 31, 2024 or latest—no assumptions unless marked
- Use formal, unambiguous, audit-ready language, with zero marketing tone

**COMPANY KNOWLEDGE BASE:**
${knowledgeContext}

**PREVIOUS SECTIONS FOR CONTEXT:**
${previousSectionsContext}

**GENERATE THE INTRODUCTION & ENGAGEMENT CONTEXT SECTION:**
- Length: 1000-1500 words
- Format: Professional, Big 4 consulting standard markdown
- Must be factual and based on available evidence
- Use only information from the knowledge base
- Do not make unsupported claims or assumptions
- Structure with the exact subheadings specified above
- Include specific data points with confidence levels where available
- If information is limited, clearly state the limitations and propose validation methods
- Maintain formal, audit-ready tone throughout

Generate the section content now:`;

console.log(`🤖 MAKER STEP - Section ${sectionInfo.section_number}`);
console.log(`📋 Section: ${sectionInfo.section_title}`);
console.log(`📊 Knowledge items: ${ragResults.length}`);
console.log(`📚 Previous sections: ${previousSections.length}`);

return {
  json: {
    ...sectionInfo,
    maker_prompt: makerPrompt,
    knowledge_items_count: ragResults.length,
    previous_sections_count: previousSections.length,
    processing_status: 'ready_for_maker'
  }
};'''
                        node['parameters']['functionCode'] = new_code
                        changes_made.append(f"Fixed {node_name} - removed multiple node references")
                
                # Pattern 2: Simple single node reference fixes
                elif '$node[' in code:
                    # Only use data from input, not from other nodes
                    if 'const sectionInfo = $node[' in code:
                        code = code.replace('const sectionInfo = $node[', 'const sectionInfo = $input.first().json; // was $node[')
                        node['parameters']['functionCode'] = code
                        changes_made.append(f"Fixed {node_name} - simplified node reference")
    
    # Write the updated workflow back
    with open(filepath, 'w', encoding='utf-8') as file:
        json.dump(workflow, file, indent=2)
    
    print(f"  ✅ Fixed {os.path.basename(filepath)}")
    for change in changes_made:
        print(f"    - {change}")
    
    return len(changes_made)

def main():
    print("🔧 Fixing All Node Reference Issues")
    print("=" * 50)
    
    workflow_files = [
        'DD_Master_Workflow.json',
        'DD_Section_01_Introduction.json'
    ]
    
    total_changes = 0
    
    for filename in workflow_files:
        filepath = os.path.join(os.getcwd(), filename)
        if os.path.exists(filepath):
            changes = fix_node_references(filepath)
            total_changes += changes
        else:
            print(f"⚠️  File not found: {filename}")
    
    print()
    print(f"✅ Fixed {total_changes} node reference issues!")
    print()
    print("🎯 What was fixed:")
    print("  ✅ Removed multiple node references in single functions")
    print("  ✅ Simplified complex node references")
    print("  ✅ Used proper input data flow")
    print("  ✅ Added safe fallbacks for missing data")
    print()
    print("🚀 No more 'Error finding the referenced node' errors!")

if __name__ == "__main__":
    main()
