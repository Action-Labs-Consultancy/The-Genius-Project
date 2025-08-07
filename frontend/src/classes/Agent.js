// Agent.js - MCA Agent Class for individual agents within a brain
export class Agent {
  constructor(options = {}) {
    this.id = options.id || this.generateId();
    this.name = options.name || '';
    this.description = options.description || '';
    this.role = options.role || 'maker'; // maker, checker, approver
    this.brainId = options.brainId || '';
    this.systemPrompt = options.systemPrompt || this.getDefaultSystemPrompt(options.role);
    this.personality = options.personality || this.getDefaultPersonality(options.role);
    this.capabilities = options.capabilities || this.getDefaultCapabilities(options.role);
    this.created_at = options.created_at || new Date().toISOString();
    this.updated_at = options.updated_at || new Date().toISOString();
    this.status = options.status || 'active';
    this.workHistory = options.workHistory || [];
    this.performance = options.performance || {
      tasksCompleted: 0,
      averageQuality: 0,
      collaborationRating: 0
    };
  }

  generateId() {
    return 'agent_' + Math.random().toString(36).substr(2, 9);
  }

  getDefaultSystemPrompt(role) {
    const prompts = {
      maker: `You are a Maker agent responsible for creating initial content and solutions. Your role is to:
- Generate creative and innovative content based on user requirements
- Follow brand guidelines and project specifications
- Collaborate effectively with Checker and Approver agents
- Maintain high quality standards in all outputs
- Document your decision-making process for transparency`,

      checker: `You are a Checker agent responsible for reviewing and validating content. Your role is to:
- Thoroughly review content created by Maker agents
- Verify facts, accuracy, and consistency
- Check for compliance with brand guidelines and standards
- Provide constructive feedback and suggestions for improvement
- Flag any issues or concerns before approval`,

      approver: `You are an Approver agent responsible for final approval and quality assurance. Your role is to:
- Make final decisions on content approval or rejection
- Ensure all content meets organizational standards
- Provide final feedback and approval decisions
- Maintain quality control across all outputs
- Coordinate with Maker and Checker agents for optimal results`
    };
    return prompts[role] || prompts.maker;
  }

  getDefaultPersonality(role) {
    const personalities = {
      maker: {
        creativity: 'high',
        attention_to_detail: 'moderate',
        collaboration_style: 'proactive',
        communication: 'clear and inspiring'
      },
      checker: {
        creativity: 'moderate',
        attention_to_detail: 'very high',
        collaboration_style: 'analytical',
        communication: 'precise and constructive'
      },
      approver: {
        creativity: 'moderate',
        attention_to_detail: 'high',
        collaboration_style: 'decisive',
        communication: 'authoritative and supportive'
      }
    };
    return personalities[role] || personalities.maker;
  }

  getDefaultCapabilities(role) {
    const capabilities = {
      maker: [
        'content_creation',
        'creative_writing',
        'research',
        'brainstorming',
        'initial_drafting'
      ],
      checker: [
        'fact_checking',
        'quality_review',
        'consistency_validation',
        'error_detection',
        'feedback_generation'
      ],
      approver: [
        'final_approval',
        'quality_assurance',
        'decision_making',
        'standards_compliance',
        'workflow_coordination'
      ]
    };
    return capabilities[role] || capabilities.maker;
  }

  // Add work to history
  addWorkHistory(work) {
    if (!this.workHistory) {
      this.workHistory = [];
    }
    this.workHistory.push({
      ...work,
      timestamp: new Date().toISOString()
    });
    this.updated_at = new Date().toISOString();
  }

  // Update performance metrics
  updatePerformance(metrics) {
    this.performance = {
      ...this.performance,
      ...metrics
    };
    this.updated_at = new Date().toISOString();
  }

  // Check if agent can perform a specific capability
  canPerform(capability) {
    return this.capabilities.includes(capability);
  }

  // Get role-specific color for UI
  getRoleColor() {
    const colors = {
      maker: '#3b82f6', // blue
      checker: '#f59e0b', // amber
      approver: '#10b981' // emerald
    };
    return colors[this.role] || colors.maker;
  }

  // Get role icon
  getRoleIcon() {
    const icons = {
      maker: 'edit',
      checker: 'search',
      approver: 'check-circle'
    };
    return icons[this.role] || icons.maker;
  }

  // Convert to JSON for API calls
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      role: this.role,
      brainId: this.brainId,
      systemPrompt: this.systemPrompt,
      personality: this.personality,
      capabilities: this.capabilities,
      created_at: this.created_at,
      updated_at: this.updated_at,
      status: this.status,
      workHistory: this.workHistory,
      performance: this.performance
    };
  }

  // Create from API response
  static fromJSON(data) {
    return new Agent(data);
  }
}

export default Agent;
