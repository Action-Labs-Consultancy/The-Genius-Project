/**
 * Agent Class for MCA Workflow
 * Represents individual agents (Maker, Checker, Approver) within a Brain
 */

import { AgentRole, MCAProtocol, MCAWorkflowStep, MCAStatus, PartialMCAProtocol } from '../types/MCATypes';

export class Agent {
  public readonly id: string;
  public readonly name: string;
  public readonly role: AgentRole;
  public readonly brain: any; // Use any to avoid circular dependency
  public readonly mcaProtocol: MCAProtocol;
  public readonly capabilities: string[];
  
  constructor(
    name: string, 
    role: AgentRole, 
    brain: any, // Use any to avoid circular dependency
    capabilities: string[] = [],
    mcaProtocol?: PartialMCAProtocol
  ) {
    this.id = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.name = name;
    this.role = role;
    this.brain = brain;
    this.capabilities = capabilities;
    
    // Merge Brain's protocol with Agent's specific overrides
    this.mcaProtocol = this.mergeProtocols(brain.mcaProtocol, mcaProtocol);
  }

  /**
   * Merges brain protocol with agent-specific protocol overrides
   */
  private mergeProtocols(brainProtocol: MCAProtocol, agentOverrides?: PartialMCAProtocol): MCAProtocol {
    if (!agentOverrides) return { ...brainProtocol };

    return {
      version: agentOverrides.version || brainProtocol.version,
      rules: agentOverrides.rules || brainProtocol.rules,
      behaviors: {
        ...brainProtocol.behaviors,
        ...(agentOverrides.behaviors || {})
      },
      forbidden: agentOverrides.forbidden || brainProtocol.forbidden,
      approvalSteps: agentOverrides.approvalSteps || brainProtocol.approvalSteps,
      escalationRules: {
        ...brainProtocol.escalationRules,
        ...(agentOverrides.escalationRules || {})
      },
      roleConfigurations: {
        ...brainProtocol.roleConfigurations,
        ...(agentOverrides.roleConfigurations || {})
      }
    };
  }

  /**
   * Validates input against agent's rules and forbidden actions
   */
  private validateInput(input: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for forbidden patterns
    this.mcaProtocol.forbidden.forEach(forbidden => {
      if (input.toLowerCase().includes(forbidden.toLowerCase())) {
        issues.push(`Input contains forbidden element: ${forbidden}`);
      }
    });

    // Check if input meets minimum requirements
    if (input.trim().length < 10) {
      issues.push('Input too short - requires more detailed instructions');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Executes the MCA workflow step based on agent role
   */
  public async runMCA(input: string, previousStep?: MCAWorkflowStep): Promise<MCAWorkflowStep> {
    console.log(`\n🤖 [${this.role}] ${this.name} processing input...`);
    
    // Validate input
    const validation = this.validateInput(input);
    if (!validation.isValid) {
      console.log(`❌ Validation failed: ${validation.issues.join(', ')}`);
      return this.createWorkflowStep(input, '', 'rejected', validation.issues);
    }

    // Execute role-specific logic
    let output: string = '';
    let status: MCAStatus = 'draft';
    let issues: string[] = [];
    let recommendations: string[] = [];

    switch (this.role) {
      case 'maker':
        ({ output, status, issues, recommendations } = await this.executeMakerRole(input));
        break;
      case 'checker':
        ({ output, status, issues, recommendations } = await this.executeCheckerRole(input, previousStep));
        break;
      case 'approver':
        ({ output, status, issues, recommendations } = await this.executeApproverRole(input, previousStep));
        break;
      default:
        throw new Error(`Unknown role: ${this.role}`);
    }

    const step = this.createWorkflowStep(input, output, status, issues, recommendations);
    console.log(`✅ [${this.role}] Step completed with status: ${status}`);
    
    return step;
  }

  /**
   * Maker role: Creates initial content draft
   */
  private async executeMakerRole(input: string): Promise<{
    output: string;
    status: MCAStatus;
    issues: string[];
    recommendations: string[];
  }> {
    console.log(`📝 Creating draft content with ${this.mcaProtocol.behaviors.tone} tone...`);
    
    // Simulate content creation logic
    const output = `DRAFT CONTENT:\n\nBased on input: "${input}"\n\nTone: ${this.mcaProtocol.behaviors.tone}\nStyle: ${this.mcaProtocol.behaviors.style}\n\n[Generated marketing content would appear here]\n\nThis content follows the ${this.brain.name} brain guidelines and adheres to all specified rules.`;
    
    const recommendations = [
      'Review content for brand alignment',
      'Verify all claims are substantiated',
      'Check tone consistency throughout'
    ];

    return {
      output,
      status: 'draft' as MCAStatus,
      issues: [],
      recommendations
    };
  }

  /**
   * Checker role: Reviews and validates content
   */
  private async executeCheckerRole(input: string, previousStep?: MCAWorkflowStep): Promise<{
    output: string;
    status: MCAStatus;
    issues: string[];
    recommendations: string[];
  }> {
    console.log(`🔍 Reviewing content for compliance and quality...`);
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Simulate checking logic
    if (previousStep?.output.includes('DRAFT CONTENT')) {
      console.log('✓ Content structure validated');
      console.log('✓ Brand guidelines checked');
      console.log('✓ Compliance rules verified');
      
      recommendations.push('Content meets quality standards');
      recommendations.push('Ready for final approval');
    } else {
      issues.push('Content format does not match expected structure');
    }

    const output = `CHECKER REVIEW:\n\nOriginal content reviewed and validated.\n\nIssues found: ${issues.length}\nCompliance score: ${issues.length === 0 ? '100%' : '75%'}\n\nRecommendation: ${issues.length === 0 ? 'APPROVE' : 'REVISE'}`;

    return {
      output,
      status: issues.length === 0 ? 'review' : 'revision_needed',
      issues,
      recommendations
    };
  }

  /**
   * Approver role: Makes final approval decision
   */
  private async executeApproverRole(input: string, previousStep?: MCAWorkflowStep): Promise<{
    output: string;
    status: MCAStatus;
    issues: string[];
    recommendations: string[];
  }> {
    console.log(`👤 Making final approval decision...`);
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Simulate approval logic
    const shouldApprove = previousStep?.status === 'review' && 
                         previousStep?.issues?.length === 0;

    const status: MCAStatus = shouldApprove ? 'approved' : 'rejected';
    
    const output = `FINAL DECISION: ${status.toUpperCase()}\n\nReasoning: ${shouldApprove ? 'Content meets all requirements and quality standards' : 'Content requires revision before approval'}\n\nNext steps: ${shouldApprove ? 'Content ready for publication' : 'Return to Maker for revisions'}`;

    if (shouldApprove) {
      recommendations.push('Content approved for publication');
      recommendations.push('Archive workflow for audit trail');
    } else {
      issues.push('Content does not meet approval criteria');
      recommendations.push('Provide specific feedback to Maker');
    }

    return {
      output,
      status,
      issues,
      recommendations
    };
  }

  /**
   * Creates a standardized workflow step object
   */
  private createWorkflowStep(
    input: string,
    output: string,
    status: MCAStatus,
    issues: string[] = [],
    recommendations: string[] = []
  ): MCAWorkflowStep {
    return {
      agentRole: this.role,
      agentName: this.name,
      timestamp: new Date(),
      input,
      output,
      status,
      issues,
      recommendations,
      notes: `Processed by ${this.name} (${this.role}) using ${this.brain.name} brain protocol`
    };
  }

  /**
   * Returns agent summary for debugging/logging
   */
  public getAgentSummary(): string {
    return `Agent: ${this.name} | Role: ${this.role} | Brain: ${this.brain.name} | Capabilities: ${this.capabilities.join(', ')}`;
  }
}
