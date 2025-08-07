/**
 * MCA (Maker-Checker-Approver) Workflow Types
 * Defines interfaces and types for the marketing content generation workflow
 */

// Agent role types for MCA workflow
export type AgentRole = 'maker' | 'checker' | 'approver';

// MCA workflow status types
export type MCAStatus = 'draft' | 'review' | 'approved' | 'rejected' | 'revision_needed';

// MCA Protocol interface defines rules and behaviors for Brain and Agent
export interface MCAProtocol {
  // Version for protocol tracking
  version: string;
  
  // Core rules that must be followed
  rules: string[];
  
  // Behavioral guidelines for the agent/brain
  behaviors: {
    tone: string;
    style: string;
    thoroughness: 'basic' | 'detailed' | 'comprehensive';
    errorChecking: boolean;
    creativityLevel: 'conservative' | 'moderate' | 'creative';
    factChecking: boolean;
    followTemplates: boolean;
    maintainBrandVoice: boolean;
  };
  
  // Forbidden actions - what the agent should NOT do
  forbidden: string[];
  
  // Required approval steps in the workflow
  approvalSteps: string[];
  
  // Escalation rules when issues are found
  escalationRules: {
    autoReject: string[];
    requireReview: string[];
    flagForApproval: string[];
  };

  // Role-specific configurations
  roleConfigurations: {
    maker: {
      canCreateContent: boolean;
      canModifyDrafts: boolean;
      requiresTemplates: boolean;
      creativityAllowed: boolean;
    };
    checker: {
      canApproveContent: boolean;
      canRejectContent: boolean;
      mustValidateFacts: boolean;
      mustCheckCompliance: boolean;
    };
    approver: {
      canFinalApprove: boolean;
      canOverrideChecker: boolean;
      mustProvideReason: boolean;
      canModifyContent: boolean;
    };
  };
}

// Partial MCA Protocol for overrides
export interface PartialMCAProtocol {
  version?: string;
  rules?: string[];
  behaviors?: Partial<MCAProtocol['behaviors']>;
  forbidden?: string[];
  approvalSteps?: string[];
  escalationRules?: Partial<MCAProtocol['escalationRules']>;
  roleConfigurations?: Partial<MCAProtocol['roleConfigurations']>;
}

// MCA Workflow step interface
export interface MCAWorkflowStep {
  agentRole: AgentRole;
  agentName: string;
  timestamp: Date;
  input: string;
  output: string;
  status: MCAStatus;
  notes?: string;
  issues?: string[];
  recommendations?: string[];
  executionTime?: number;
}

// MCA Session tracks the entire workflow
export interface MCASession {
  id: string;
  brainName: string;
  originalInput: string;
  currentStatus: MCAStatus;
  steps: MCAWorkflowStep[];
  finalResult?: string;
  finalOutput?: string;
  feedback?: string;
  createdAt: Date;
  completedAt?: Date;
  timestamps?: {
    created: Date;
    lastUpdated: Date;
  };
}
