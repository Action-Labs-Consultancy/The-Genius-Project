// Brain.js - MCA Brain Class for Managing Maker-Checker-Approver workflow
export class Brain {
  constructor(options = {}) {
    this.id = options.id || this.generateId();
    this.name = options.name || '';
    this.description = options.description || '';
    this.purpose = options.purpose || '';
    this.tone = options.tone || 'professional';
    this.style = options.style || 'clear and concise';
    this.initial_prompt = options.initial_prompt || '';
    this.mcaProtocol = options.mcaProtocol || this.getDefaultMCAProtocol();
    this.agents = options.agents || [];
    this.created_at = options.created_at || new Date().toISOString();
    this.updated_at = options.updated_at || new Date().toISOString();
    this.status = options.status || 'active';
    this.workflowHistory = options.workflowHistory || [];
  }

  generateId() {
    return 'brain_' + Math.random().toString(36).substr(2, 9);
  }

  getDefaultMCAProtocol() {
    return {
      version: '1.0',
      creativityLevel: 'moderate',
      thoroughness: 'detailed',
      factChecking: true,
      followTemplates: true,
      maintainBrandVoice: true,
      rules: [
        'Follow the Maker-Checker-Approver workflow strictly',
        'Maintain professional tone throughout the process',
        'Verify all facts and claims before approval',
        'Ensure brand voice consistency across all content'
      ],
      behaviors: {
        errorChecking: true,
        qualityAssurance: true,
        creativityLevel: 'moderate',
        collaborationStyle: 'respectful'
      },
      forbidden: [
        'No data simulation or fabrication',
        'Must follow official documentation only',
        'No speculative content without clear disclaimers',
        'No bypassing of approval workflow'
      ]
    };
  }

  // Add an agent to this brain
  addAgent(agent) {
    if (!this.agents) {
      this.agents = [];
    }
    this.agents.push(agent);
    this.updated_at = new Date().toISOString();
  }

  // Remove an agent from this brain
  removeAgent(agentId) {
    if (this.agents) {
      this.agents = this.agents.filter(agent => agent.id !== agentId);
      this.updated_at = new Date().toISOString();
    }
  }

  // Get agents by role
  getAgentsByRole(role) {
    if (!this.agents) return [];
    return this.agents.filter(agent => agent.role === role);
  }

  // Check if brain has all required MCA roles
  hasCompleteVCAWorkflow() {
    const roles = ['maker', 'checker', 'approver'];
    return roles.every(role => this.getAgentsByRole(role).length > 0);
  }

  // Convert to JSON for API calls
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      purpose: this.purpose,
      tone: this.tone,
      style: this.style,
      initial_prompt: this.initial_prompt,
      mcaProtocol: this.mcaProtocol,
      agents: this.agents,
      created_at: this.created_at,
      updated_at: this.updated_at,
      status: this.status,
      workflowHistory: this.workflowHistory
    };
  }

  // Create from API response
  static fromJSON(data) {
    return new Brain(data);
  }
}

export default Brain;
