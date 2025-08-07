/**
 * MCA Workflow Demo and Examples
 * Shows how to use the Brain and Agent classes for marketing content generation
 */

import { Brain } from '../classes/Brain';
import { PartialMCAProtocol } from '../types/MCATypes';

/**
 * Demo function showing how to set up and use the MCA workflow
 */
export async function runMCADemo(): Promise<void> {
  console.log('🎯 Starting MCA Workflow Demo for Marketing Content Generation\n');

  // Example 1: Create a Social Media Marketing Brain
  const socialMediaBrain = new Brain(
    'Social Media Marketing Brain',
    'engaging and conversational',
    'casual yet professional',
    'Specialized in creating social media content with high engagement potential',
    {
      behaviors: {
        tone: 'engaging and conversational',
        style: 'casual yet professional',
        thoroughness: 'detailed',
        errorChecking: true,
        creativityLevel: 'creative',
        factChecking: true
      },
      rules: [
        'Cannot perform data simulation or fabrication',
        'Must follow platform-specific guidelines',
        'All hashtags must be researched and relevant',
        'Content must be optimized for engagement',
        'Must include clear call-to-action when appropriate'
      ]
    }
  );

  // Add agents to the social media brain
  const socialMaker = socialMediaBrain.addAgent(
    'Social Content Creator',
    'Maker',
    ['content creation', 'hashtag research', 'visual concepts', 'trending topics'],
    {
      behaviors: {
        creativityLevel: 'creative',
        tone: 'engaging and conversational'
      }
    }
  );

  const socialChecker = socialMediaBrain.addAgent(
    'Brand Compliance Reviewer',
    'Checker',
    ['brand guidelines', 'legal compliance', 'platform policies', 'fact checking'],
    {
      behaviors: {
        thoroughness: 'comprehensive',
        errorChecking: true
      }
    }
  );

  const socialApprover = socialMediaBrain.addAgent(
    'Marketing Director',
    'Approver',
    ['strategic oversight', 'brand authority', 'final approval', 'risk assessment'],
    {
      escalationRules: {
        autoReject: ['contains unverified claims', 'violates platform terms'],
        requireReview: ['mentions competitors', 'includes pricing'],
        flagForApproval: ['new campaign themes', 'sensitive topics']
      }
    }
  );

  // Validate brain setup
  const validation = socialMediaBrain.validateAgentSetup();
  if (!validation.isValid) {
    console.error(`❌ Brain setup incomplete. Missing roles: ${validation.missingRoles.join(', ')}`);
    return;
  }

  console.log('✅ Social Media Brain setup complete with all agents\n');

  // Example 2: Run MCA workflow for social media post
  const socialMediaInput = 'Create a LinkedIn post about our new AI-powered marketing analytics tool launch. Include key benefits, target audience insights, and a strong call-to-action. Make it professional but engaging.';

  try {
    const socialSession = await socialMediaBrain.executeFullMCAWorkflow(socialMediaInput);
    
    console.log('\n📊 Social Media MCA Session Results:');
    console.log(`Session ID: ${socialSession.id}`);
    console.log(`Final Status: ${socialSession.currentStatus}`);
    console.log(`Steps Completed: ${socialSession.steps.length}`);
    
    socialSession.steps.forEach((step, index) => {
      console.log(`\nStep ${index + 1} - ${step.role}:`);
      console.log(`Status: ${step.status}`);
      console.log(`Issues: ${step.issues?.length || 0}`);
      console.log(`Recommendations: ${step.recommendations?.length || 0}`);
    });

    if (socialSession.finalOutput) {
      console.log('\n📝 Final Approved Content:');
      console.log(socialSession.finalOutput);
    }

  } catch (error) {
    console.error(`❌ Social media workflow failed: ${error}`);
  }

  // Example 3: Create an Email Marketing Brain with stricter protocol
  console.log('\n\n🎯 Creating Email Marketing Brain with Enhanced Protocol...\n');

  const emailMarketingBrain = new Brain(
    'Email Marketing Brain',
    'professional and authoritative',
    'formal business communication',
    'Specialized in email marketing campaigns with strict compliance requirements',
    {
      behaviors: {
        tone: 'professional and authoritative',
        style: 'formal business communication',
        thoroughness: 'comprehensive',
        errorChecking: true,
        creativityLevel: 'conservative',
        factChecking: true
      },
      rules: [
        'Must comply with CAN-SPAM Act',
        'Include clear unsubscribe option',
        'Personalization must be data-driven',
        'Subject lines must not be misleading',
        'All links must be verified and secure',
        'Must include physical address',
        'A/B testing required for major campaigns'
      ],
      forbidden: [
        'misleading subject lines',
        'false urgency claims',
        'unsubstantiated ROI promises',
        'missing unsubscribe links',
        'non-compliant data usage'
      ]
    }
  );

  // Add email marketing agents
  emailMarketingBrain.addAgent(
    'Email Content Specialist',
    'Maker',
    ['email copywriting', 'segmentation', 'personalization', 'A/B testing'],
    {
      behaviors: {
        creativityLevel: 'conservative',
        thoroughness: 'comprehensive'
      }
    }
  );

  emailMarketingBrain.addAgent(
    'Compliance & Deliverability Expert',
    'Checker',
    ['CAN-SPAM compliance', 'deliverability optimization', 'spam filter testing'],
    {
      escalationRules: {
        autoReject: ['missing unsubscribe', 'misleading subject', 'compliance violation'],
        requireReview: ['new audience segment', 'promotional content'],
        flagForApproval: ['regulatory content', 'international campaigns']
      }
    }
  );

  emailMarketingBrain.addAgent(
    'Campaign Manager',
    'Approver',
    ['campaign strategy', 'performance optimization', 'brand protection'],
    {
      behaviors: {
        thoroughness: 'comprehensive'
      }
    }
  );

  // Example 4: Run email marketing workflow
  const emailInput = 'Create a welcome email series for new subscribers to our B2B software platform. Include onboarding steps, key features, success stories, and next steps. Ensure compliance with email marketing regulations.';

  try {
    const emailSession = await emailMarketingBrain.executeFullMCAWorkflow(emailInput);
    
    console.log('\n📧 Email Marketing MCA Session Results:');
    console.log(`Session ID: ${emailSession.id}`);
    console.log(`Final Status: ${emailSession.currentStatus}`);
    console.log(`Workflow Duration: ${emailSession.completedAt && emailSession.createdAt ? 
      (emailSession.completedAt.getTime() - emailSession.createdAt.getTime()) : 'N/A'}ms`);

  } catch (error) {
    console.error(`❌ Email marketing workflow failed: ${error}`);
  }

  // Example 5: Show brain summaries and configurations
  console.log('\n\n📋 Brain Summaries:');
  console.log(socialMediaBrain.getBrainSummary());
  console.log(emailMarketingBrain.getBrainSummary());

  // Example 6: Export configurations for backup
  console.log('\n💾 Exporting Brain Configurations...');
  const socialConfig = socialMediaBrain.exportConfiguration();
  const emailConfig = emailMarketingBrain.exportConfiguration();
  
  console.log(`Social Media Brain Config: ${JSON.stringify(socialConfig, null, 2).substring(0, 200)}...`);
  console.log(`Email Marketing Brain Config: ${JSON.stringify(emailConfig, null, 2).substring(0, 200)}...`);

  console.log('\n🎉 MCA Workflow Demo completed successfully!');
}

/**
 * Example of creating a custom brain for specific use cases
 */
export function createCustomMarketingBrain(
  name: string,
  specialization: string,
  customProtocol?: PartialMCAProtocol
): Brain {
  console.log(`🧠 Creating custom ${specialization} brain: ${name}`);
  
  const brain = new Brain(
    name,
    'adaptable based on campaign needs',
    'flexible and data-driven',
    `Custom brain specialized in ${specialization}`,
    customProtocol
  );

  // Add default agents with specialization-specific capabilities
  brain.addAgent(
    `${specialization} Content Creator`,
    'Maker',
    ['specialized content creation', 'industry knowledge', 'trend analysis']
  );

  brain.addAgent(
    `${specialization} Quality Assurance`,
    'Checker',
    ['specialized compliance', 'industry standards', 'quality metrics']
  );

  brain.addAgent(
    `${specialization} Campaign Manager`,
    'Approver',
    ['strategic oversight', 'performance optimization', 'stakeholder management']
  );

  return brain;
}

/**
 * Utility function to analyze MCA session performance
 */
export function analyzeMCASession(brain: Brain, sessionId: string): void {
  const session = brain.getSession(sessionId);
  if (!session) {
    console.error(`❌ Session ${sessionId} not found`);
    return;
  }

  console.log(`\n📈 MCA Session Analysis - ${sessionId}`);
  console.log(`Brain: ${session.brainName}`);
  console.log(`Status: ${session.currentStatus}`);
  console.log(`Total Steps: ${session.steps.length}`);
  
  const totalIssues = session.steps.reduce((sum, step) => sum + (step.issues?.length || 0), 0);
  const totalRecommendations = session.steps.reduce((sum, step) => sum + (step.recommendations?.length || 0), 0);
  
  console.log(`Total Issues Found: ${totalIssues}`);
  console.log(`Total Recommendations: ${totalRecommendations}`);
  
  if (session.completedAt && session.createdAt) {
    const duration = session.completedAt.getTime() - session.createdAt.getTime();
    console.log(`Processing Time: ${duration}ms`);
  }

  console.log(`Success Rate: ${session.currentStatus === 'approved' ? '100%' : '0%'}`);
}
