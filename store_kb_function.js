// Store all processed content in local knowledge base
const taskData = $('Categorize Content').first().json;
const kb = $('Initialize Knowledge Base').first().json.knowledge_base;

let analysisResult = '';
let processedInsights = '';

if (taskData.is_financial) {
  // Get Financial analysis result
  const financialData = $('Financial Analysis (FinBERT)').first().json;
  analysisResult = financialData.response || '';
  processedInsights = analysisResult;
  console.log(`📈 Financial analysis completed for: ${taskData.pdf_name}`);
  
  // Add to financial analysis array
  kb.financial_analysis.push({
    document_name: taskData.pdf_name,
    content: taskData.extracted_text,
    analysis: analysisResult,
    processed_at: new Date().toISOString()
  });
} else {
  // Get Mistral analysis result
  const mistralData = $('Mistral Analysis').first().json;
  analysisResult = mistralData.response || '';
  
  // Try to parse JSON response for structured insights
  try {
    const jsonMatch = analysisResult.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      processedInsights = JSON.stringify(parsed);
    } else {
      processedInsights = analysisResult;
    }
  } catch (error) {
    processedInsights = analysisResult;
  }
  
  console.log(`🧠 Non-financial analysis completed for: ${taskData.pdf_name}`);
  
  // Add to non-financial analysis array
  kb.non_financial_analysis.push({
    document_name: taskData.pdf_name,
    content: taskData.extracted_text,
    analysis: analysisResult,
    insights: processedInsights,
    processed_at: new Date().toISOString()
  });
}

// Add to PDF contents array
kb.pdf_contents.push({
  name: taskData.pdf_name,
  content: taskData.extracted_text,
  category: taskData.content_category,
  analysis: analysisResult,
  processed_at: new Date().toISOString()
});

kb.processing_status = 'pdf_processed';

console.log(`💾 Stored content for ${taskData.pdf_name} in knowledge base`);

return {
  json: {
    ...taskData,
    knowledge_base: kb,
    analysis_result: analysisResult,
    processed_insights: processedInsights,
    storage_completed: true
  }
};
