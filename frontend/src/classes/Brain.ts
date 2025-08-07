/**
 * Brain Class for MCA Workflow
 * Represents a marketing brain with specific tone, style, and MCA protocol
 */

import { MCAProtocol, MCASession, MCAStatus, AgentRole, PartialMCAProtocol } from '../types/MCATypes';
import { Agent } from './Agent';

export class Brain {
  public readonly id: string;
  public readonly name: string;
  public readonly tone: string;
  public readonly style: string;
  public readonly description: string;
  public readonly mcaProtocol: MCAProtocol;
  private agents: Map<AgentRole, Agent[]> = new Map();
  private sessions: MCASession[] = [];

  constructor(
    name: string,
    tone: string,
    style: string,
    description: string = '',
    mcaProtocol?: PartialMCAProtocol
  ) {
    this.id = `brain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.name = name;
    this.tone = tone;
    this.style = style;
    this.description = description;
    
    // Initialize with default MCA protocol, allow overrides
    this.mcaProtocol = this.createDefaultProtocol(mcaProtocol);
    
    // Initialize agent role maps
    this.agents.set('maker', []);
    this.agents.set('checker', []);
    this.agents.set('approver', []);
    
    console.log(`🧠 Brain "${name}" initialized with MCA protocol v${this.mcaProtocol.version}`);
    console.log(`📝 Protocol rules: ${this.mcaProtocol.rules.length} rules defined`);
    console.log(`🚫 Forbidden actions: ${this.mcaProtocol.forbidden.length} restrictions`);
  }

  /**
   * Creates default MCA protocol with optional overrides
   */
  private createDefaultProtocol(overrides?: PartialMCAProtocol): MCAProtocol {
    const defaultProtocol: MCAProtocol = {
      version: overrides?.version || '1.0',
      rules: [
        'Cannot perform data simulation or fabrication',
        'Must follow official documentation and templates strictly',
        'All content must be factually accurate and verifiable',
        'Must maintain brand voice and messaging consistency',
        'Require approval for all public-facing content',
        'Must cite sources for all claims and statistics',
        'No guessing or making assumptions about data',
        'Cannot ignore approval steps in the workflow',
        'Must validate all external references and links'
      ],
      behaviors: {
        tone: this.tone || 'professional',
        style: this.style || 'clear and concise',
        thoroughness: 'detailed',
        errorChecking: true,
        creativityLevel: 'moderate',
        factChecking: true,
        followTemplates: true,
        maintainBrandVoice: true
      },
      forbidden: [
        'No data simulation or fabrication',
        'No guessing at facts or statistics',
        'No ignoring approval steps',
        'No bypassing quality checks',
        'No unauthorized brand voice changes',
        'No unsupported claims or statements',
        'No copying content without attribution',
        'No skipping fact-checking requirements'
      ],
      approvalSteps: [
        'Maker creates initial draft',
        'Checker reviews for quality and compliance',
        'Approver provides final approval or rejection',
        'If rejected, return to Maker with feedback'
      ],
      escalationRules: {
        autoReject: [
          'Contains fabricated data',
          'Violates brand guidelines',
          'Contains factual errors',
          'Missing required approvals'
        ],
        requireReview: [
          'Content includes statistics',
          'Makes specific claims',
          'References external sources',
          'Deviates from standard templates'
        ],
        flagForApproval: [
          'New content format',
          'Sensitive topic coverage',
          'High visibility publication',
          'Legal or compliance concerns'
        ]
      },
      roleConfigurations: {
        maker: {
          canCreateContent: true,
          canModifyDrafts: true,
          requiresTemplates: true,
          creativityAllowed: true
        },
        checker: {
          canApproveContent: false,
          canRejectContent: true,
          mustValidateFacts: true,
          mustCheckCompliance: true
        },
        approver: {
          canFinalApprove: true,
          canOverrideChecker: true,
          mustProvideReason: true,
          canModifyContent: false
        }
      }
    };

    // Merge with any provided overrides
    if (overrides) {
      return {
        version: overrides.version || defaultProtocol.version,
        rules: overrides.rules || defaultProtocol.rules,
        behaviors: {
          ...defaultProtocol.behaviors,
          ...(overrides.behaviors || {})
        },
        forbidden: overrides.forbidden || defaultProtocol.forbidden,
        approvalSteps: overrides.approvalSteps || defaultProtocol.approvalSteps,
        escalationRules: {
          ...defaultProtocol.escalationRules,
          ...(overrides.escalationRules || {})
        },
        roleConfigurations: {
          ...defaultProtocol.roleConfigurations,
          ...(overrides.roleConfigurations || {})
        }
      };
    }

    return defaultProtocol;
  }

  /**
   * Adds an agent to the brain with specific role and capabilities
   */
  public addAgent(
    name: string, 
    role: AgentRole, 
    capabilities: string[] = [], 
    agentProtocol?: PartialMCAProtocol
  ): Agent {
    // Create agent with reference to this brain
    const agent = new Agent(name, role, this, capabilities, agentProtocol);
    
    // Add to role-specific list
    const roleAgents = this.agents.get(role) || [];
    roleAgents.push(agent);
    this.agents.set(role, roleAgents);
    
    console.log(`👤 Added ${role} agent "${name}" to brain "${this.name}"`);
    return agent;
  }

  /**
   * Gets the first agent of a specific role
   */
  public getAgent(role: AgentRole): Agent | undefined {
    const agents = this.agents.get(role);
    return agents && agents.length > 0 ? agents[0] : undefined;
  }

  /**
   * Gets all agents of a specific role
   */
  public getAgentsByRole(role: AgentRole): Agent[] {
    return this.agents.get(role) || [];
  }

  /**
   * Gets all agents in the brain
   */
  public getAllAgents(): Agent[] {
    const allAgents: Agent[] = [];
    this.agents.forEach(roleAgents => {
      allAgents.push(...roleAgents);
    });
    return allAgents;
  }

  /**
   * Executes full MCA workflow for given input
   */
  public async executeFullMCAWorkflow(input: string): Promise<MCASession> {
    console.log(`\n🚀 Starting MCA workflow for brain "${this.name}"`);
    console.log(`📝 Input: ${input}`);
    
    // Create new session
    const session: MCASession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      brainName: this.name,
      originalInput: input,
      currentStatus: 'draft',
      steps: [],
      createdAt: new Date()
    };

    try {
      // Step 1: Maker creates content
      const makerAgent = this.getAgent('maker');
      if (!makerAgent) {
        throw new Error('No Maker agent found in brain');
      }

      const makerStep = await makerAgent.runMCA(input);
      session.steps.push(makerStep);
      session.currentStatus = makerStep.status;

      // Step 2: Checker reviews content
      if (makerStep.status === 'draft') {
        const checkerAgent = this.getAgent('checker');
        if (!checkerAgent) {
          throw new Error('No Checker agent found in brain');
        }

        const checkerStep = await checkerAgent.runMCA(makerStep.output, makerStep);
        session.steps.push(checkerStep);
        session.currentStatus = checkerStep.status;

        // Step 3: Approver makes final decision
        if (checkerStep.status === 'review') {
          const approverAgent = this.getAgent('approver');
          if (!approverAgent) {
            throw new Error('No Approver agent found in brain');
          }

          const approverStep = await approverAgent.runMCA(checkerStep.output, checkerStep);
          session.steps.push(approverStep);
          session.currentStatus = approverStep.status;
          
          if (approverStep.status === 'approved') {
            session.finalOutput = makerStep.output;
          }
        }
      }

      session.completedAt = new Date();
      this.sessions.push(session);
      
      console.log(`\n✅ MCA workflow completed with status: ${session.currentStatus}`);
      return session;

    } catch (error) {
      console.error(`❌ MCA workflow failed: ${error}`);
      session.currentStatus = 'rejected';
      session.completedAt = new Date();
      this.sessions.push(session);
      throw error;
    }
  }

  /**
   * Gets all sessions for this brain
   */
  public getSessions(): MCASession[] {
    return [...this.sessions];
  }

  /**
   * Gets session by ID
   */
  public getSession(sessionId: string): MCASession | undefined {
    return this.sessions.find(session => session.id === sessionId);
  }

  /**
   * Updates the brain's MCA protocol
   */
  public updateMCAProtocol(updates: Partial<MCAProtocol>): void {
    Object.assign(this.mcaProtocol, updates);
    console.log(`🔄 Updated MCA protocol for brain "${this.name}"`);
  }

  /**
   * Validates that the brain has all required agents
   */
  public validateAgentSetup(): { isValid: boolean; missingRoles: AgentRole[] } {
    const requiredRoles: AgentRole[] = ['maker', 'checker', 'approver'];
    const missingRoles = requiredRoles.filter(role => {
      const agents = this.agents.get(role);
      return !agents || agents.length === 0;
    });
    
    return {
      isValid: missingRoles.length === 0,
      missingRoles
    };
  }

  /**
   * Returns brain summary for debugging/logging
   */
  public getBrainSummary(): string {
    const agentCount = this.getAllAgents().length;
    const sessionCount = this.sessions.length;
    return `Brain: ${this.name} | Agents: ${agentCount} | Sessions: ${sessionCount} | Tone: ${this.tone} | Style: ${this.style}`;
  }

  /**
   * Exports brain configuration for backup/sharing
   */
  public exportConfiguration(): any {
    return {
      name: this.name,
      tone: this.tone,
      style: this.style,
      description: this.description,
      mcaProtocol: this.mcaProtocol,
      agents: Array.from(this.agents.entries()).map(([role, agents]) => ({
        role,
        agents: agents.map(agent => ({
          name: agent.name,
          capabilities: agent.capabilities
        }))
      }))
    };
  }
}
