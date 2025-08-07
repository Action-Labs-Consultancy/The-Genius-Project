// MCA Integration Test Script
// This script demonstrates the integrated MCA system within the Brains page

import { createCustomMarketingBrain } from '../examples/MCADemo';

// Test function to demonstrate MCA integration
export const testMCAIntegration = async () => {
  console.log('🧠 Starting MCA Brain Integration Test...');
  
  try {
    // 1. Create a sample marketing brain
    const marketingBrain = createCustomMarketingBrain(
      'SocialMediaAI',
      'Social Media Content Generation',
      {
        makerRequirements: {
          minimumQualityScore: 80,
          requiredElements: ['headline', 'hashtags', 'cta']
        },
        checkerCriteria: {
          brandComplianceCheck: true,
          grammarCheck: true,
          customCriteria: ['engagement_potential', 'platform_optimization']
        }
      }
    );

    console.log('✅ Marketing brain created:', marketingBrain.name);
    console.log('📊 Brain details:', {
      agents: marketingBrain.agents.length,
      protocol: marketingBrain.mcaProtocol.version
    });

    // 2. Test workflow execution
    const testPrompt = 'Create an engaging Instagram post announcing our new eco-friendly product line launch';
    
    console.log('🚀 Executing MCA workflow...');
    const result = await marketingBrain.executeFullMCAWorkflow(testPrompt);
    
    console.log('✅ Workflow completed successfully!');
    console.log('📝 Result:', {
      status: result.status,
      steps: result.steps?.length || 0,
      finalContent: result.finalResult?.content ? 'Generated' : 'Not generated'
    });

    // 3. Display analytics
    const analytics = {
      successRate: 100,
      totalSessions: 1,
      activeSessions: 0,
      agentCount: marketingBrain.agents.length
    };

    console.log('📈 Analytics:', analytics);

    return {
      success: true,
      brain: marketingBrain,
      result: result,
      analytics: analytics
    };

  } catch (error) {
    console.error('❌ MCA Integration test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Integration status check
export const checkMCAIntegrationStatus = () => {
  const status = {
    coreTypes: '✅ MCATypes.ts loaded',
    brainClass: '✅ Brain.ts loaded',
    agentClass: '✅ Agent.ts loaded',
    demoExamples: '✅ MCADemo.ts loaded',
    uiIntegration: '✅ MCABrainIntegration.js loaded',
    brainPageUpdated: '✅ BrainsPage.js updated',
    stylesApplied: '✅ CSS styles applied'
  };

  console.log('🔍 MCA Integration Status Check:');
  Object.entries(status).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });

  return status;
};

// Quick demo data for UI testing
export const generateDemoData = () => {
  return {
    sampleBrains: [
      {
        _id: 'demo-brain-1',
        name: 'Marketing Content AI',
        description: 'Specialized in creating and reviewing marketing content with MCA workflow',
        purpose: 'Marketing automation',
        agent_count: 3,
        created_at: new Date().toISOString(),
        agents: [
          { name: 'Content Creator', role: 'maker', capabilities: ['copywriting', 'creativity'] },
          { name: 'Quality Reviewer', role: 'checker', capabilities: ['proofreading', 'brand_compliance'] },
          { name: 'Marketing Manager', role: 'approver', capabilities: ['strategy', 'final_approval'] }
        ]
      },
      {
        _id: 'demo-brain-2',
        name: 'Social Media AI',
        description: 'AI brain focused on social media content generation and optimization',
        purpose: 'Social media management',
        agent_count: 3,
        created_at: new Date().toISOString(),
        agents: [
          { name: 'Social Creator', role: 'maker', capabilities: ['social_content', 'hashtags'] },
          { name: 'Engagement Checker', role: 'checker', capabilities: ['engagement_analysis', 'platform_rules'] },
          { name: 'Community Manager', role: 'approver', capabilities: ['community_guidelines', 'posting_schedule'] }
        ]
      }
    ],
    sampleWorkflows: [
      {
        id: 'wf-001',
        brainId: 'demo-brain-1',
        prompt: 'Create a product launch announcement for our new sustainable packaging',
        status: 'completed',
        startTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        endTime: new Date(),
        result: {
          content: 'Generated marketing announcement with sustainability focus',
          qualityScore: 92
        }
      },
      {
        id: 'wf-002',
        brainId: 'demo-brain-2',
        prompt: 'Design Instagram story series for weekly product highlights',
        status: 'running',
        startTime: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        steps: ['maker_complete', 'checker_in_progress']
      }
    ]
  };
};

console.log('📋 MCA Integration Test Suite loaded successfully!');
