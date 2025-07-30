// nodeSchemas.js - Comprehensive node parameter definitions and validation
export const NODE_SCHEMAS = {
  start: {
    label: 'Start Node',
    description: 'Entry point for workflow execution',
    requiredParams: [],
    optionalParams: {
      triggerType: {
        type: 'select',
        label: 'Trigger Type',
        options: ['manual', 'webhook', 'schedule', 'event'],
        default: 'manual'
      },
      triggerData: {
        type: 'json',
        label: 'Initial Data',
        default: '{}'
      }
    },
    outputs: ['flow'],
    validate: (params) => {
      const errors = [];
      if (params.triggerData) {
        try {
          JSON.parse(params.triggerData);
        } catch (e) {
          errors.push('Trigger Data must be valid JSON');
        }
      }
      return errors;
    }
  },

  httpRequest: {
    label: 'HTTP Request',
    description: 'Make HTTP requests to external APIs',
    requiredParams: {
      url: {
        type: 'text',
        label: 'URL',
        placeholder: 'https://api.example.com/endpoint'
      },
      method: {
        type: 'select',
        label: 'Method',
        options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      }
    },
    optionalParams: {
      headers: {
        type: 'json',
        label: 'Headers',
        default: '{"Content-Type": "application/json"}'
      },
      body: {
        type: 'json',
        label: 'Request Body',
        default: '{}'
      },
      timeout: {
        type: 'number',
        label: 'Timeout (ms)',
        default: 30000
      }
    },
    outputs: ['response', 'error'],
    validate: (params) => {
      const errors = [];
      if (!params.url) {
        errors.push('URL is required');
      } else if (!params.url.startsWith('http')) {
        errors.push('URL must start with http:// or https://');
      }
      if (!params.method) {
        errors.push('HTTP Method is required');
      }
      if (params.headers) {
        try {
          JSON.parse(params.headers);
        } catch (e) {
          errors.push('Headers must be valid JSON');
        }
      }
      if (params.body && params.method !== 'GET') {
        try {
          JSON.parse(params.body);
        } catch (e) {
          errors.push('Request Body must be valid JSON');
        }
      }
      return errors;
    }
  },

  setVariable: {
    label: 'Set Variable',
    description: 'Set or update workflow variables',
    requiredParams: {
      variableName: {
        type: 'text',
        label: 'Variable Name',
        placeholder: 'myVariable'
      },
      value: {
        type: 'text',
        label: 'Value',
        placeholder: 'Variable value or expression'
      }
    },
    optionalParams: {
      type: {
        type: 'select',
        label: 'Value Type',
        options: ['string', 'number', 'boolean', 'json'],
        default: 'string'
      }
    },
    outputs: ['variable'],
    validate: (params) => {
      const errors = [];
      if (!params.variableName) {
        errors.push('Variable Name is required');
      } else if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(params.variableName)) {
        errors.push('Variable Name must be a valid identifier');
      }
      if (!params.value) {
        errors.push('Value is required');
      }
      return errors;
    }
  },

  condition: {
    label: 'Condition',
    description: 'Conditional branching based on expressions',
    requiredParams: {
      condition: {
        type: 'text',
        label: 'Condition Expression',
        placeholder: 'variable > 10'
      }
    },
    optionalParams: {
      operator: {
        type: 'select',
        label: 'Operator',
        options: ['>', '<', '>=', '<=', '==', '!=', 'contains', 'startsWith', 'endsWith'],
        default: '=='
      }
    },
    outputs: ['true', 'false'],
    validate: (params) => {
      const errors = [];
      if (!params.condition) {
        errors.push('Condition Expression is required');
      }
      return errors;
    }
  },

  delay: {
    label: 'Delay',
    description: 'Add delays to workflow execution',
    requiredParams: {
      duration: {
        type: 'number',
        label: 'Duration (ms)',
        placeholder: '1000'
      }
    },
    optionalParams: {
      unit: {
        type: 'select',
        label: 'Time Unit',
        options: ['milliseconds', 'seconds', 'minutes', 'hours'],
        default: 'milliseconds'
      }
    },
    outputs: ['flow'],
    validate: (params) => {
      const errors = [];
      if (!params.duration) {
        errors.push('Duration is required');
      } else if (isNaN(params.duration) || params.duration < 0) {
        errors.push('Duration must be a positive number');
      }
      return errors;
    }
  },

  loop: {
    label: 'Loop',
    description: 'Iterate over data or repeat actions',
    requiredParams: {
      iterationType: {
        type: 'select',
        label: 'Iteration Type',
        options: ['array', 'count', 'while']
      }
    },
    optionalParams: {
      arrayData: {
        type: 'json',
        label: 'Array Data',
        default: '[]'
      },
      count: {
        type: 'number',
        label: 'Count',
        default: 1
      },
      whileCondition: {
        type: 'text',
        label: 'While Condition',
        placeholder: 'counter < 10'
      },
      maxIterations: {
        type: 'number',
        label: 'Max Iterations',
        default: 100
      }
    },
    outputs: ['item', 'index', 'done'],
    validate: (params) => {
      const errors = [];
      if (!params.iterationType) {
        errors.push('Iteration Type is required');
      }
      if (params.iterationType === 'array' && params.arrayData) {
        try {
          const data = JSON.parse(params.arrayData);
          if (!Array.isArray(data)) {
            errors.push('Array Data must be a valid JSON array');
          }
        } catch (e) {
          errors.push('Array Data must be valid JSON');
        }
      }
      if (params.iterationType === 'count' && (!params.count || params.count < 1)) {
        errors.push('Count must be a positive number');
      }
      if (params.iterationType === 'while' && !params.whileCondition) {
        errors.push('While Condition is required');
      }
      return errors;
    }
  },

  log: {
    label: 'Log',
    description: 'Log messages and data for debugging',
    requiredParams: {
      message: {
        type: 'text',
        label: 'Log Message',
        placeholder: 'Enter log message'
      }
    },
    optionalParams: {
      level: {
        type: 'select',
        label: 'Log Level',
        options: ['debug', 'info', 'warn', 'error'],
        default: 'info'
      },
      data: {
        type: 'json',
        label: 'Additional Data',
        default: '{}'
      }
    },
    outputs: ['log'],
    validate: (params) => {
      const errors = [];
      if (!params.message) {
        errors.push('Log Message is required');
      }
      if (params.data) {
        try {
          JSON.parse(params.data);
        } catch (e) {
          errors.push('Additional Data must be valid JSON');
        }
      }
      return errors;
    }
  },

  webhook: {
    label: 'Webhook',
    description: 'Send webhook notifications',
    requiredParams: {
      url: {
        type: 'text',
        label: 'Webhook URL',
        placeholder: 'https://hooks.example.com/webhook'
      }
    },
    optionalParams: {
      method: {
        type: 'select',
        label: 'HTTP Method',
        options: ['POST', 'PUT', 'PATCH'],
        default: 'POST'
      },
      payload: {
        type: 'json',
        label: 'Payload',
        default: '{}'
      },
      headers: {
        type: 'json',
        label: 'Headers',
        default: '{"Content-Type": "application/json"}'
      }
    },
    outputs: ['response', 'error'],
    validate: (params) => {
      const errors = [];
      if (!params.url) {
        errors.push('Webhook URL is required');
      } else if (!params.url.startsWith('http')) {
        errors.push('Webhook URL must start with http:// or https://');
      }
      if (params.payload) {
        try {
          JSON.parse(params.payload);
        } catch (e) {
          errors.push('Payload must be valid JSON');
        }
      }
      if (params.headers) {
        try {
          JSON.parse(params.headers);
        } catch (e) {
          errors.push('Headers must be valid JSON');
        }
      }
      return errors;
    }
  },

  code: {
    label: 'Code Execution',
    description: 'Execute custom JavaScript code',
    requiredParams: {
      code: {
        type: 'textarea',
        label: 'JavaScript Code',
        placeholder: '// Your code here\nreturn { result: "Hello World" };'
      }
    },
    optionalParams: {
      timeout: {
        type: 'number',
        label: 'Timeout (ms)',
        default: 10000
      },
      allowedModules: {
        type: 'text',
        label: 'Allowed Modules',
        placeholder: 'lodash,moment'
      }
    },
    outputs: ['result', 'error'],
    validate: (params) => {
      const errors = [];
      if (!params.code) {
        errors.push('JavaScript Code is required');
      }
      if (params.timeout && (isNaN(params.timeout) || params.timeout < 100)) {
        errors.push('Timeout must be at least 100ms');
      }
      return errors;
    }
  },

  database: {
    label: 'Database Query',
    description: 'Execute database operations',
    requiredParams: {
      operation: {
        type: 'select',
        label: 'Operation',
        options: ['find', 'findOne', 'insert', 'update', 'delete', 'aggregate']
      },
      collection: {
        type: 'text',
        label: 'Collection/Table',
        placeholder: 'users'
      }
    },
    optionalParams: {
      query: {
        type: 'json',
        label: 'Query/Filter',
        default: '{}'
      },
      data: {
        type: 'json',
        label: 'Data',
        default: '{}'
      },
      options: {
        type: 'json',
        label: 'Options',
        default: '{}'
      }
    },
    outputs: ['result', 'error'],
    validate: (params) => {
      const errors = [];
      if (!params.operation) {
        errors.push('Operation is required');
      }
      if (!params.collection) {
        errors.push('Collection/Table is required');
      }
      if (params.query) {
        try {
          JSON.parse(params.query);
        } catch (e) {
          errors.push('Query must be valid JSON');
        }
      }
      if (params.data) {
        try {
          JSON.parse(params.data);
        } catch (e) {
          errors.push('Data must be valid JSON');
        }
      }
      return errors;
    }
  },

  ai: {
    label: 'AI/Brain Node',
    description: 'AI agent processing with brain integration',
    requiredParams: {
      brainId: {
        type: 'select',
        label: 'Brain ID',
        options: [], // Will be populated from API
        placeholder: 'Select a brain'
      },
      prompt: {
        type: 'textarea',
        label: 'AI Prompt',
        placeholder: 'Enter your prompt for the AI'
      }
    },
    optionalParams: {
      temperature: {
        type: 'number',
        label: 'Temperature',
        default: 0.7,
        min: 0,
        max: 2,
        step: 0.1
      },
      maxTokens: {
        type: 'number',
        label: 'Max Tokens',
        default: 1000
      },
      useMemory: {
        type: 'boolean',
        label: 'Use Memory',
        default: true
      },
      memoryKey: {
        type: 'text',
        label: 'Memory Key',
        placeholder: 'conversation_id'
      }
    },
    outputs: ['response', 'tokens', 'error'],
    validate: (params) => {
      const errors = [];
      if (!params.brainId) {
        errors.push('Brain ID is required');
      }
      if (!params.prompt) {
        errors.push('AI Prompt is required');
      }
      if (params.temperature !== undefined && (params.temperature < 0 || params.temperature > 2)) {
        errors.push('Temperature must be between 0 and 2');
      }
      if (params.maxTokens && (params.maxTokens < 1 || params.maxTokens > 4000)) {
        errors.push('Max Tokens must be between 1 and 4000');
      }
      return errors;
    }
  },

  email: {
    label: 'Send Email',
    description: 'Send email notifications',
    requiredParams: {
      to: {
        type: 'text',
        label: 'To Email',
        placeholder: 'recipient@example.com'
      },
      subject: {
        type: 'text',
        label: 'Subject',
        placeholder: 'Email subject'
      },
      body: {
        type: 'textarea',
        label: 'Email Body',
        placeholder: 'Email content'
      }
    },
    optionalParams: {
      from: {
        type: 'text',
        label: 'From Email',
        placeholder: 'sender@example.com'
      },
      cc: {
        type: 'text',
        label: 'CC',
        placeholder: 'cc@example.com'
      },
      bcc: {
        type: 'text',
        label: 'BCC',
        placeholder: 'bcc@example.com'
      },
      isHtml: {
        type: 'boolean',
        label: 'HTML Email',
        default: false
      }
    },
    outputs: ['sent', 'error'],
    validate: (params) => {
      const errors = [];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const templateVariableRegex = /^\{\{[^}]+\}\}$|^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!params.to) {
        errors.push('To Email is required');
      } else if (!templateVariableRegex.test(params.to)) {
        errors.push('To Email must be a valid email address or template variable (e.g., {{customer_email}})');
      }
      
      if (!params.subject) {
        errors.push('Subject is required');
      }
      
      if (!params.body) {
        errors.push('Email Body is required');
      }
      
      if (params.from && !templateVariableRegex.test(params.from)) {
        errors.push('From Email must be a valid email address or template variable (e.g., {{sender_email}})');
      }
      
      return errors;
    }
  },

  end: {
    label: 'End Node',
    description: 'Workflow termination point',
    requiredParams: {},
    optionalParams: {
      returnData: {
        type: 'json',
        label: 'Return Data',
        default: '{}'
      },
      status: {
        type: 'select',
        label: 'Exit Status',
        options: ['success', 'completed', 'terminated'],
        default: 'success'
      }
    },
    outputs: [],
    validate: (params) => {
      const errors = [];
      if (params.returnData) {
        try {
          JSON.parse(params.returnData);
        } catch (e) {
          errors.push('Return Data must be valid JSON');
        }
      }
      return errors;
    }
  },

  ifCondition: {
    label: 'If/Else Condition',
    description: 'Conditional branching with true/false paths',
    requiredParams: {
      leftOperand: {
        type: 'text',
        label: 'Left Operand',
        placeholder: '{{variable_name}}'
      },
      operator: {
        type: 'select',
        label: 'Operator',
        options: ['==', '!=', '>', '<', '>=', '<=', 'contains', 'not_contains']
      },
      rightOperand: {
        type: 'text',
        label: 'Right Operand',
        placeholder: 'value or {{variable_name}}'
      }
    },
    optionalParams: {},
    outputs: ['true', 'false'],
    validate: (params) => {
      const errors = [];
      if (!params.leftOperand) {
        errors.push('Left Operand is required');
      }
      if (!params.operator) {
        errors.push('Operator is required');
      }
      if (!params.rightOperand) {
        errors.push('Right Operand is required');
      }
      return errors;
    }
  },

  slack: {
    label: 'Slack Message',
    description: 'Send messages to Slack channels',
    requiredParams: {
      channel: {
        type: 'text',
        label: 'Channel',
        placeholder: '#general or @username'
      },
      message: {
        type: 'textarea',
        label: 'Message',
        placeholder: 'Message content'
      }
    },
    optionalParams: {
      botToken: {
        type: 'text',
        label: 'Bot Token',
        placeholder: 'xoxb-your-token'
      },
      username: {
        type: 'text',
        label: 'Username',
        placeholder: 'Bot Name'
      },
      iconEmoji: {
        type: 'text',
        label: 'Icon Emoji',
        placeholder: ':robot_face:'
      }
    },
    outputs: ['flow'],
    validate: (params) => {
      const errors = [];
      if (!params.channel) {
        errors.push('Channel is required');
      }
      if (!params.message) {
        errors.push('Message is required');
      }
      return errors;
    }
  },

  math: {
    label: 'Math Operation',
    description: 'Perform mathematical calculations',
    requiredParams: {
      operation: {
        type: 'select',
        label: 'Operation',
        options: ['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt', 'round', 'ceil', 'floor']
      },
      leftOperand: {
        type: 'text',
        label: 'First Value',
        placeholder: '10 or {{variable_name}}'
      }
    },
    optionalParams: {
      rightOperand: {
        type: 'text',
        label: 'Second Value (if needed)',
        placeholder: '5 or {{variable_name}}'
      },
      resultVariable: {
        type: 'text',
        label: 'Store Result In',
        placeholder: 'result_variable'
      }
    },
    outputs: ['flow'],
    validate: (params) => {
      const errors = [];
      if (!params.operation) {
        errors.push('Operation is required');
      }
      if (!params.leftOperand) {
        errors.push('First Value is required');
      }
      const twoOperandOps = ['add', 'subtract', 'multiply', 'divide', 'power'];
      if (twoOperandOps.includes(params.operation) && !params.rightOperand) {
        errors.push('Second Value is required for this operation');
      }
      return errors;
    }
  },

  notification: {
    label: 'Push Notification',
    description: 'Send push notifications to devices',
    requiredParams: {
      title: {
        type: 'text',
        label: 'Title',
        placeholder: 'Notification title'
      },
      message: {
        type: 'textarea',
        label: 'Message',
        placeholder: 'Notification message'
      }
    },
    optionalParams: {
      deviceTokens: {
        type: 'textarea',
        label: 'Device Tokens (JSON array)',
        placeholder: '["token1", "token2"]'
      },
      topic: {
        type: 'text',
        label: 'Topic',
        placeholder: 'notification_topic'
      },
      badge: {
        type: 'number',
        label: 'Badge Count',
        placeholder: '1'
      },
      sound: {
        type: 'text',
        label: 'Sound',
        placeholder: 'default'
      }
    },
    outputs: ['flow'],
    validate: (params) => {
      const errors = [];
      if (!params.title) {
        errors.push('Title is required');
      }
      if (!params.message) {
        errors.push('Message is required');
      }
      if (params.deviceTokens) {
        try {
          JSON.parse(params.deviceTokens);
        } catch (e) {
          errors.push('Device Tokens must be valid JSON array');
        }
      }
      return errors;
    }
  },

  brain: {
    label: 'AI Brain',
    description: 'Process information using AI brain',
    requiredParams: {
      brainId: {
        type: 'text',
        label: 'Brain ID',
        placeholder: 'brain_id_here'
      },
      userInput: {
        type: 'textarea',
        label: 'User Input',
        placeholder: 'Input text or {{variable_name}}'
      }
    },
    optionalParams: {
      systemPrompt: {
        type: 'textarea',
        label: 'System Prompt',
        placeholder: 'You are a helpful assistant...'
      },
      temperature: {
        type: 'number',
        label: 'Temperature',
        placeholder: '0.7',
        default: 0.7
      },
      maxTokens: {
        type: 'number',
        label: 'Max Tokens',
        placeholder: '1000'
      },
      memoryNamespace: {
        type: 'text',
        label: 'Memory Namespace',
        placeholder: 'default'
      }
    },
    outputs: ['flow'],
    validate: (params) => {
      const errors = [];
      if (!params.brainId) {
        errors.push('Brain ID is required');
      }
      if (!params.userInput) {
        errors.push('User Input is required');
      }
      if (params.temperature && (isNaN(params.temperature) || params.temperature < 0 || params.temperature > 2)) {
        errors.push('Temperature must be between 0 and 2');
      }
      return errors;
    }
  },

  agent: {
    label: 'AI Agent',
    description: 'Execute tasks using AI agent with tools',
    requiredParams: {
      agentId: {
        type: 'text',
        label: 'Agent ID',
        placeholder: 'agent_id_here'
      },
      task: {
        type: 'textarea',
        label: 'Task',
        placeholder: 'Task description or {{variable_name}}'
      }
    },
    optionalParams: {
      tools: {
        type: 'text',
        label: 'Available Tools (comma-separated)',
        placeholder: 'web_search,calculator,file_reader'
      },
      maxIterations: {
        type: 'number',
        label: 'Max Iterations',
        placeholder: '10',
        default: 10
      },
      temperature: {
        type: 'number',
        label: 'Temperature',
        placeholder: '0.3',
        default: 0.3
      },
      memoryNamespace: {
        type: 'text',
        label: 'Memory Namespace',
        placeholder: 'agent'
      }
    },
    outputs: ['flow'],
    validate: (params) => {
      const errors = [];
      if (!params.agentId) {
        errors.push('Agent ID is required');
      }
      if (!params.task) {
        errors.push('Task is required');
      }
      if (params.temperature && (isNaN(params.temperature) || params.temperature < 0 || params.temperature > 2)) {
        errors.push('Temperature must be between 0 and 2');
      }
      if (params.maxIterations && (isNaN(params.maxIterations) || params.maxIterations < 1)) {
        errors.push('Max Iterations must be a positive number');
      }
      return errors;
    }
  },

  section: {
    label: 'Section',
    description: 'Represents a section or area that initiates business processes',
    requiredParams: {
      sectionName: {
        type: 'text',
        label: 'Section Name',
        placeholder: 'Enter section name'
      }
    },
    optionalParams: {
      description: {
        type: 'textarea',
        label: 'Section Description',
        placeholder: 'Describe this section'
      },
      priority: {
        type: 'select',
        label: 'Priority Level',
        options: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
      },
      metadata: {
        type: 'json',
        label: 'Section Metadata',
        default: '{}'
      }
    },
    outputs: ['sectionData', 'nextStep'],
    validate: (params) => {
      const errors = [];
      if (!params.sectionName) {
        errors.push('Section Name is required');
      }
      return errors;
    }
  },

  request: {
    label: 'Request',
    description: 'Handles client requests and requirements processing',
    requiredParams: {
      requestType: {
        type: 'select',
        label: 'Request Type',
        options: ['Service Request', 'Information Request', 'Support Request', 'Custom Request']
      },
      requestTitle: {
        type: 'text',
        label: 'Request Title',
        placeholder: 'Brief description of the request'
      }
    },
    optionalParams: {
      requestDescription: {
        type: 'textarea',
        label: 'Request Description',
        placeholder: 'Detailed description of the request'
      },
      urgency: {
        type: 'select',
        label: 'Urgency',
        options: ['Low', 'Medium', 'High', 'Emergency'],
        default: 'Medium'
      },
      deadline: {
        type: 'date',
        label: 'Deadline',
        placeholder: 'YYYY-MM-DD'
      },
      attachments: {
        type: 'json',
        label: 'Attachments',
        default: '[]'
      },
      tags: {
        type: 'text',
        label: 'Tags',
        placeholder: 'tag1, tag2, tag3'
      }
    },
    outputs: ['requestData', 'assignedDepartment'],
    validate: (params) => {
      const errors = [];
      if (!params.requestType) {
        errors.push('Request Type is required');
      }
      if (!params.requestTitle) {
        errors.push('Request Title is required');
      }
      if (params.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(params.deadline)) {
        errors.push('Deadline must be in YYYY-MM-DD format');
      }
      return errors;
    }
  },

  department: {
    label: 'Department',
    description: 'Routes requests to appropriate departments or teams',
    requiredParams: {
      departmentName: {
        type: 'select',
        label: 'Department',
        options: ['Sales', 'Marketing', 'Support', 'Engineering', 'Finance', 'HR', 'Operations', 'Legal']
      },
      routingRule: {
        type: 'select',
        label: 'Routing Rule',
        options: ['Auto-assign', 'Manual Review', 'Skill-based', 'Round Robin', 'Load Balanced']
      }
    },
    optionalParams: {
      assignedTo: {
        type: 'text',
        label: 'Assigned To',
        placeholder: 'User ID or email'
      },
      escalationLevel: {
        type: 'select',
        label: 'Escalation Level',
        options: ['L1', 'L2', 'L3', 'Manager'],
        default: 'L1'
      },
      slaHours: {
        type: 'number',
        label: 'SLA Hours',
        default: 24
      },
      notifications: {
        type: 'json',
        label: 'Notification Settings',
        default: '{"email": true, "slack": false}'
      }
    },
    outputs: ['assignment', 'taskCreated'],
    validate: (params) => {
      const errors = [];
      if (!params.departmentName) {
        errors.push('Department Name is required');
      }
      if (!params.routingRule) {
        errors.push('Routing Rule is required');
      }
      if (params.slaHours && params.slaHours <= 0) {
        errors.push('SLA Hours must be greater than 0');
      }
      return errors;
    }
  },

  task: {
    label: 'Task',
    description: 'Creates and manages specific tasks within the workflow',
    requiredParams: {
      taskTitle: {
        type: 'text',
        label: 'Task Title',
        placeholder: 'Enter task title'
      },
      taskType: {
        type: 'select',
        label: 'Task Type',
        options: ['Research', 'Analysis', 'Implementation', 'Review', 'Testing', 'Documentation']
      }
    },
    optionalParams: {
      taskDescription: {
        type: 'textarea',
        label: 'Task Description',
        placeholder: 'Detailed task description'
      },
      estimatedHours: {
        type: 'number',
        label: 'Estimated Hours',
        default: 1
      },
      skillsRequired: {
        type: 'text',
        label: 'Skills Required',
        placeholder: 'skill1, skill2, skill3'
      },
      dependencies: {
        type: 'json',
        label: 'Task Dependencies',
        default: '[]'
      },
      subtasks: {
        type: 'json',
        label: 'Subtasks',
        default: '[]'
      },
      status: {
        type: 'select',
        label: 'Initial Status',
        options: ['Not Started', 'In Progress', 'Blocked', 'Under Review', 'Completed'],
        default: 'Not Started'
      }
    },
    outputs: ['taskData', 'nextPhase'],
    validate: (params) => {
      const errors = [];
      if (!params.taskTitle) {
        errors.push('Task Title is required');
      }
      if (!params.taskType) {
        errors.push('Task Type is required');
      }
      if (params.estimatedHours && params.estimatedHours <= 0) {
        errors.push('Estimated Hours must be greater than 0');
      }
      return errors;
    }
  },

  cardDetails: {
    label: 'Card Details',
    description: 'Manages detailed information and specifications for work items',
    requiredParams: {
      cardTitle: {
        type: 'text',
        label: 'Card Title',
        placeholder: 'Enter card title'
      },
      cardType: {
        type: 'select',
        label: 'Card Type',
        options: ['Story', 'Bug', 'Feature', 'Epic', 'Task', 'Spike']
      }
    },
    optionalParams: {
      description: {
        type: 'textarea',
        label: 'Description',
        placeholder: 'Detailed description of the work item'
      },
      acceptanceCriteria: {
        type: 'textarea',
        label: 'Acceptance Criteria',
        placeholder: 'Define what constitutes completion'
      },
      storyPoints: {
        type: 'number',
        label: 'Story Points',
        default: 1
      },
      labels: {
        type: 'text',
        label: 'Labels',
        placeholder: 'frontend, backend, urgent'
      },
      customFields: {
        type: 'json',
        label: 'Custom Fields',
        default: '{}'
      },
      attachments: {
        type: 'json',
        label: 'Attachments',
        default: '[]'
      },
      comments: {
        type: 'json',
        label: 'Comments',
        default: '[]'
      }
    },
    outputs: ['cardData', 'phaseTransition'],
    validate: (params) => {
      const errors = [];
      if (!params.cardTitle) {
        errors.push('Card Title is required');
      }
      if (!params.cardType) {
        errors.push('Card Type is required');
      }
      if (params.storyPoints && params.storyPoints < 0) {
        errors.push('Story Points must be 0 or greater');
      }
      return errors;
    }
  },

  phase: {
    label: 'Phase',
    description: 'Represents different phases or stages in the workflow',
    requiredParams: {
      phaseName: {
        type: 'select',
        label: 'Phase Name',
        options: ['Planning', 'Analysis', 'Design', 'Development', 'Testing', 'Review', 'Deployment', 'Completion']
      },
      phaseType: {
        type: 'select',
        label: 'Phase Type',
        options: ['Sequential', 'Parallel', 'Conditional', 'Loop']
      }
    },
    optionalParams: {
      phaseDescription: {
        type: 'textarea',
        label: 'Phase Description',
        placeholder: 'Describe what happens in this phase'
      },
      duration: {
        type: 'number',
        label: 'Expected Duration (days)',
        default: 1
      },
      milestones: {
        type: 'json',
        label: 'Phase Milestones',
        default: '[]'
      },
      exitCriteria: {
        type: 'textarea',
        label: 'Exit Criteria',
        placeholder: 'Conditions that must be met to exit this phase'
      },
      approvers: {
        type: 'text',
        label: 'Phase Approvers',
        placeholder: 'user1@example.com, user2@example.com'
      },
      notifications: {
        type: 'json',
        label: 'Phase Notifications',
        default: '{"onEntry": true, "onExit": true}'
      }
    },
    outputs: ['phaseStatus', 'nextPhase'],
    validate: (params) => {
      const errors = [];
      if (!params.phaseName) {
        errors.push('Phase Name is required');
      }
      if (!params.phaseType) {
        errors.push('Phase Type is required');
      }
      if (params.duration && params.duration <= 0) {
        errors.push('Duration must be greater than 0');
      }
      return errors;
    }
  },

  result: {
    label: 'Result',
    description: 'Captures and processes final outcomes and deliverables',
    requiredParams: {
      resultType: {
        type: 'select',
        label: 'Result Type',
        options: ['Success', 'Partial Success', 'Failure', 'Cancelled', 'Pending']
      },
      resultTitle: {
        type: 'text',
        label: 'Result Title',
        placeholder: 'Summary of the outcome'
      }
    },
    optionalParams: {
      resultDescription: {
        type: 'textarea',
        label: 'Result Description',
        placeholder: 'Detailed description of the outcome'
      },
      deliverables: {
        type: 'json',
        label: 'Deliverables',
        default: '[]'
      },
      metrics: {
        type: 'json',
        label: 'Success Metrics',
        default: '{}'
      },
      lessons: {
        type: 'textarea',
        label: 'Lessons Learned',
        placeholder: 'Key insights and learnings'
      },
      recommendations: {
        type: 'textarea',
        label: 'Recommendations',
        placeholder: 'Suggestions for future improvements'
      },
      archiveLocation: {
        type: 'text',
        label: 'Archive Location',
        placeholder: 'Where to store final documents'
      },
      followUp: {
        type: 'json',
        label: 'Follow-up Actions',
        default: '[]'
      }
    },
    outputs: ['finalResult', 'archiveData'],
    validate: (params) => {
      const errors = [];
      if (!params.resultType) {
        errors.push('Result Type is required');
      }
      if (!params.resultTitle) {
        errors.push('Result Title is required');
      }
      return errors;
    }
  },

  // ...existing code...
};

export const validateNodeParameters = (nodeType, params) => {
  const schema = NODE_SCHEMAS[nodeType];
  if (!schema) {
    return [`Unknown node type: ${nodeType}`];
  }

  const errors = [];
  
  // Check required parameters
  Object.keys(schema.requiredParams || {}).forEach(paramName => {
    if (!params[paramName] || params[paramName] === '') {
      errors.push(`${schema.requiredParams[paramName].label} is required`);
    }
  });

  // Run custom validation
  if (schema.validate) {
    errors.push(...schema.validate(params));
  }

  return errors;
};

export const getNodeDefaults = (nodeType) => {
  const schema = NODE_SCHEMAS[nodeType];
  if (!schema) return {};

  const defaults = {};
  
  // Set defaults for required params
  Object.entries(schema.requiredParams || {}).forEach(([key, config]) => {
    if (config.default !== undefined) {
      defaults[key] = config.default;
    }
  });

  // Set defaults for optional params
  Object.entries(schema.optionalParams || {}).forEach(([key, config]) => {
    if (config.default !== undefined) {
      defaults[key] = config.default;
    }
  });

  return defaults;
};

export const getAllNodeTypes = () => {
  return Object.keys(NODE_SCHEMAS).map(type => ({
    type,
    label: NODE_SCHEMAS[type].label,
    description: NODE_SCHEMAS[type].description,
    category: getNodeCategory(type)
  }));
};

const getNodeCategory = (type) => {
  const categoryMap = {
    start: 'Flow',
    end: 'Flow',
    delay: 'Flow',
    loop: 'Flow',
    condition: 'Logic',
    ifCondition: 'Logic',
    code: 'Logic',
    math: 'Logic',
    httpRequest: 'Network',
    webhook: 'Network',
    setVariable: 'Data',
    database: 'Data',
    log: 'Debug',
    ai: 'AI',
    brain: 'AI',
    agent: 'AI',
    email: 'Communication',
    slack: 'Communication',
    notification: 'Communication',
    // New business workflow nodes
    section: 'Business',
    request: 'Business',
    department: 'Business',
    task: 'Business',
    cardDetails: 'Business',
    phase: 'Business',
    result: 'Business'
  };
  
  return categoryMap[type] || 'Other';
};
