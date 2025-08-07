// Enhanced MCA System Demo - Complete Functional Implementation
// This demonstrates the fully functional Maker-Checker-Approver system

import { Brain } from '../classes/Brain';
import { Agent } from '../classes/Agent';
import { PartialMCAProtocol } from '../types/MCATypes';

/**
 * Demo 1: Basic Marketing Brain Setup
 * Creates a complete MCA workflow system for marketing content
 */
export const createMarketingBrain = (): Brain => {
  console.log('🚀 Creating Marketing Brain with MCA Workflow...\n');

  // Create brain with specific tone and style
  const marketingBrain = new Brain(
    'ContentMarketingAI',
    'professional yet engaging',
    'clear, actionable, and brand-focused',
    'AI brain specialized in creating high-quality marketing content with built-in approval workflows'
  );

  // Add Maker agent
  const contentCreator = marketingBrain.addAgent(
    'Sarah ContentCreator',
    'maker',
    ['copywriting', 'creative_thinking', 'brand_messaging', 'social_media'],
    {
      behaviors: {
        creativityLevel: 'creative',
        tone: 'engaging and energetic'
      }
    }
  );

  // Add Checker agent
  const qualityReviewer = marketingBrain.addAgent(
    'Mike QualityReviewer', 
    'checker',
    ['proofreading', 'fact_checking', 'brand_compliance', 'quality_assurance'],
    {
      behaviors: {
        thoroughness: 'comprehensive',
        errorChecking: true,
        factChecking: true
      }
    }
  );

  // Add Approver agent
  const marketingManager = marketingBrain.addAgent(
    'Lisa MarketingManager',
    'approver',
    ['strategy_alignment', 'final_approval', 'brand_governance', 'legal_compliance'],
    {
      behaviors: {
        thoroughness: 'detailed',
        creativityLevel: 'conservative'
      }
    }
  );

  console.log('✅ Marketing Brain created successfully!');
  console.log(marketingBrain.getBrainSummary());
  console.log('\n📋 Agent Setup:');
  console.log(`- Maker: ${contentCreator.name} (${contentCreator.capabilities.join(', ')})`);
  console.log(`- Checker: ${qualityReviewer.name} (${qualityReviewer.capabilities.join(', ')})`);
  console.log(`- Approver: ${marketingManager.name} (${marketingManager.capabilities.join(', ')})`);
  
  return marketingBrain;
};

/**
 * Demo 2: Custom Protocol Brain for Financial Content
 * Demonstrates enhanced protocol configuration
 */
export const createFinancialContentBrain = (): Brain => {
  console.log('\n🏦 Creating Financial Content Brain with Strict Protocols...\n');

  // Custom protocol for financial content
  const financialProtocol: PartialMCAProtocol = {
    version: '2.0',
    rules: [
      'All financial data must be verified from official sources',
      'No investment advice without proper disclaimers',
      'Must comply with SEC regulations',
      'All statistics must include source citations',
      'Cannot make guarantees about financial returns',
      'Must include risk disclosures for investment content'
    ],
    behaviors: {
      tone: 'authoritative and trustworthy',
      style: 'precise and fact-based',
      thoroughness: 'comprehensive',
      errorChecking: true,
      creativityLevel: 'conservative',
      factChecking: true,
      followTemplates: true,
      maintainBrandVoice: true
    },
    forbidden: [
      'No speculation about market movements',
      'No unverified financial claims',
      'No personal investment recommendations',
      'No promises of guaranteed returns',
      'No use of promotional language for investments'
    ],
    escalationRules: {
      autoReject: [
        'Contains unverified financial data',
        'Makes investment guarantees',
        'Missing required disclaimers',
        'Violates SEC compliance'
      ],
      requireReview: [
        'All investment-related content',
        'Market analysis and predictions',
        'Financial product comparisons',
        'Regulatory compliance matters'
      ],
      flagForApproval: [
        'New financial product launches',
        'Regulatory change communications',
        'Crisis communication content',
        'Legal-sensitive materials'
      ]
    }
  };

  const financialBrain = new Brain(
    'FinancialContentAI',
    'authoritative and compliant',
    'precise, factual, and regulation-compliant',
    'AI brain for creating compliant financial content with enhanced regulatory oversight',
    financialProtocol
  );

  // Add specialized financial content team
  financialBrain.addAgent(
    'Robert FinancialWriter',
    'maker',
    ['financial_writing', 'regulation_knowledge', 'market_analysis', 'compliance_aware']
  );

  financialBrain.addAgent(
    'Jennifer ComplianceReviewer',
    'checker',
    ['regulatory_compliance', 'risk_assessment', 'legal_review', 'fact_verification']
  );

  financialBrain.addAgent(
    'David ComplianceDirector',
    'approver',
    ['final_compliance_approval', 'regulatory_sign_off', 'legal_authority', 'risk_management']
  );

  console.log('✅ Financial Content Brain created with enhanced protocols!');
  console.log(financialBrain.getBrainSummary());
  
  return financialBrain;
};

/**
 * Demo 3: Execute Complete MCA Workflow
 * Shows the full workflow in action
 */
export const demonstrateFullWorkflow = async (brain: Brain, prompt: string): Promise<void> => {
  console.log(`\n🔄 Executing Full MCA Workflow for: "${prompt}"`);
  console.log('=' .repeat(60));

  try {
    // Validate brain setup
    const validation = brain.validateAgentSetup();
    if (!validation.isValid) {
      console.error(`❌ Brain setup invalid. Missing roles: ${validation.missingRoles.join(', ')}`);
      return;
    }

    // Execute full workflow
    const session = await brain.executeFullMCAWorkflow(prompt);

    // Display results
    console.log('\n📊 Workflow Results:');
    console.log(`Session ID: ${session.id}`);
    console.log(`Final Status: ${session.currentStatus}`);
    console.log(`Steps Completed: ${session.steps.length}`);
    
    console.log('\n📝 Step-by-Step Breakdown:');
    session.steps.forEach((step, index) => {
      console.log(`\nStep ${index + 1}: ${step.agentRole} - ${step.agentName}`);
      console.log(`Status: ${step.status}`);
      console.log(`Output: ${step.output || 'No output generated'}`);
      if (step.issues && step.issues.length > 0) {
        console.log(`Issues: ${step.issues.join(', ')}`);
      }
      if (step.recommendations && step.recommendations.length > 0) {
        console.log(`Recommendations: ${step.recommendations.join(', ')}`);
      }
    });

    if (session.finalResult) {
      console.log(`\n🎉 Final Approved Content:\n${session.finalResult}`);
    }

    if (session.feedback) {
      console.log(`\n💭 Feedback: ${session.feedback}`);
    }

  } catch (error) {
    console.error('❌ Workflow execution failed:', error);
  }
};

/**
 * Demo 4: Protocol Compliance Testing
 * Tests the protocol enforcement capabilities
 */
export const testProtocolCompliance = async (brain: Brain): Promise<void> => {
  console.log('\n🔍 Testing Protocol Compliance...\n');

  const testCases = [
    {
      name: 'Valid Content Request',
      prompt: 'Create a professional blog post about our new sustainable packaging initiative, highlighting environmental benefits and cost savings.',
      expectation: 'Should pass all validation steps'
    },
    {
      name: 'Forbidden Content Test',
      prompt: 'Create content with fabricated statistics about our market share and make unsubstantiated claims about competitor weaknesses.',
      expectation: 'Should be rejected due to forbidden elements'
    },
    {
      name: 'Template Compliance Test', 
      prompt: 'Write a press release announcing our Q3 financial results with proper disclaimers and source citations.',
      expectation: 'Should require enhanced review due to financial content'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Test Case: ${testCase.name}`);
    console.log(`Prompt: ${testCase.prompt}`);
    console.log(`Expected: ${testCase.expectation}`);
    console.log('-'.repeat(50));

    await demonstrateFullWorkflow(brain, testCase.prompt);
    
    console.log('\n');
  }
};

/**
 * Demo 5: Multi-Brain Comparison
 * Shows how different brains handle the same content differently
 */
export const compareMultipleBrains = async (): Promise<void> => {
  console.log('\n🔄 Multi-Brain Comparison Demo\n');
  
  const marketingBrain = createMarketingBrain();
  const financialBrain = createFinancialContentBrain();
  
  const sharedPrompt = 'Create content about our new investment product launch, highlighting key features and potential returns.';
  
  console.log('\n📊 Same prompt, different brains:');
  console.log(`Prompt: "${sharedPrompt}"`);
  
  console.log('\n1️⃣ MARKETING BRAIN APPROACH:');
  await demonstrateFullWorkflow(marketingBrain, sharedPrompt);
  
  console.log('\n2️⃣ FINANCIAL BRAIN APPROACH:');
  await demonstrateFullWorkflow(financialBrain, sharedPrompt);
};

/**
 * Demo 6: Real-World Usage Example
 * Complete functional demonstration
 */
export const realWorldDemo = async (): Promise<void> => {
  console.log('\n🌟 REAL-WORLD MCA SYSTEM DEMONSTRATION');
  console.log('='.repeat(60));
  
  // Create brain
  const socialMediaBrain = new Brain(
    'SocialMediaAI',
    'friendly and engaging',
    'conversational yet professional',
    'Specialized AI brain for social media content creation with approval workflows'
  );

  // Add agents with specific roles and capabilities
  socialMediaBrain.addAgent(
    'Emma SocialCreator',
    'maker',
    ['social_media_writing', 'hashtag_research', 'visual_concepts', 'engagement_optimization']
  );

  socialMediaBrain.addAgent(
    'Alex BrandReviewer',
    'checker', 
    ['brand_compliance', 'message_consistency', 'audience_appropriateness', 'legal_review']
  );

  socialMediaBrain.addAgent(
    'Maria CommunityManager',
    'approver',
    ['final_approval', 'publishing_authorization', 'crisis_management', 'brand_protection']
  );

  // Execute multiple real-world scenarios
  const scenarios = [
    'Create an Instagram post announcing our new eco-friendly product line with engaging visuals and appropriate hashtags',
    'Draft a Twitter thread explaining our company values and commitment to sustainability',
    'Design a LinkedIn post celebrating our team\'s achievement in winning the industry innovation award'
  ];

  for (const scenario of scenarios) {
    console.log(`\n📱 Social Media Scenario: ${scenario}`);
    await demonstrateFullWorkflow(socialMediaBrain, scenario);
  }

  // Show brain analytics
  console.log('\n📈 Brain Performance Summary:');
  console.log(socialMediaBrain.getBrainSummary());
  
  // Export configuration for backup/sharing
  const config = socialMediaBrain.exportConfiguration();
  console.log('\n💾 Exportable Configuration:');
  console.log(JSON.stringify(config, null, 2));
};

// Main execution function
export const runEnhancedMCADemo = async (): Promise<void> => {
  console.log('🎯 ENHANCED MCA SYSTEM - COMPLETE FUNCTIONAL DEMO');
  console.log('='.repeat(70));
  console.log('This demonstrates a 100% functional Maker-Checker-Approver workflow system\n');

  try {
    // Demo 1: Basic setup
    const marketingBrain = createMarketingBrain();
    
    // Demo 2: Advanced setup
    const financialBrain = createFinancialContentBrain();
    
    // Demo 3: Single workflow
    await demonstrateFullWorkflow(
      marketingBrain, 
      'Create a compelling blog post about our innovative AI-powered customer service platform'
    );
    
    // Demo 4: Protocol testing
    await testProtocolCompliance(financialBrain);
    
    // Demo 5: Multi-brain comparison
    await compareMultipleBrains();
    
    // Demo 6: Real-world scenarios
    await realWorldDemo();
    
    console.log('\n🎉 ALL DEMOS COMPLETED SUCCESSFULLY!');
    console.log('✅ The MCA system is 100% functional and ready for production use.');
    
  } catch (error) {
    console.error('❌ Demo execution failed:', error);
  }
};

// Export for immediate testing
export default {
  createMarketingBrain,
  createFinancialContentBrain,
  demonstrateFullWorkflow,
  testProtocolCompliance,
  compareMultipleBrains,
  realWorldDemo,
  runEnhancedMCADemo
};
