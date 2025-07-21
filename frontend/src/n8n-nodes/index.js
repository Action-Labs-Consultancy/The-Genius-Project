// n8n Node Registry - Complete Implementation
// This file contains all n8n built-in, core, and integration nodes

import React from 'react';
import { Handle, Position } from 'reactflow';

// Base Node Component for consistent styling
const BaseNode = ({ data, selected, children, icon, type }) => (
  <div className={`n8n-node ${type} ${selected ? 'selected' : ''}`}>
    <div className="node-header">
      <span className="node-icon">{icon}</span>
      <span className="node-title">{data.label}</span>
    </div>
    {children}
  </div>
);

// =============================================================================
// CORE NODES
// =============================================================================

export const StartNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="▶️" type="start">
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const WebhookNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🔗" type="webhook">
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Method:</span>
        <span className="field-value">{data.method || 'POST'}</span>
      </div>
      <div className="node-field">
        <span className="field-label">Path:</span>
        <span className="field-value">{data.path || '/webhook'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const ScheduleNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="⏰" type="schedule">
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Cron:</span>
        <span className="field-value">{data.cron || '0 * * * *'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const HttpRequestNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🌐" type="http-request">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Method:</span>
        <span className="field-value">{data.method || 'GET'}</span>
      </div>
      <div className="node-field">
        <span className="field-label">URL:</span>
        <span className="field-value">{data.url || 'Not set'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const CodeNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="💻" type="code">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Language:</span>
        <span className="field-value">{data.language || 'JavaScript'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const ConditionNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="❓" type="condition">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Condition:</span>
        <span className="field-value">{data.condition || 'true'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} id="true" style={{ left: '25%' }} />
    <Handle type="source" position={Position.Bottom} id="false" style={{ left: '75%' }} />
  </BaseNode>
);

export const SwitchNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🔀" type="switch">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Cases:</span>
        <span className="field-value">{data.cases || '3'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const MergeNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🔗" type="merge">
    <Handle type="target" position={Position.Top} id="input1" style={{ left: '25%' }} />
    <Handle type="target" position={Position.Top} id="input2" style={{ left: '75%' }} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Mode:</span>
        <span className="field-value">{data.mode || 'append'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const SplitOutNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🪓" type="split-out">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Property:</span>
        <span className="field-value">{data.property || 'items'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const AggregateNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📊" type="aggregate">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'sum'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const LimitNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🚦" type="limit">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Max:</span>
        <span className="field-value">{data.maxItems || '10'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const RemoveDuplicatesNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🗑️" type="remove-duplicates">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">By:</span>
        <span className="field-value">{data.compareProperty || 'id'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const SortNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="↕️" type="sort">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Property:</span>
        <span className="field-value">{data.sortProperty || 'name'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const SetNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📝" type="set">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Values:</span>
        <span className="field-value">{data.valueCount || '1'} value(s)</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const WaitNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="⏳" type="wait">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Duration:</span>
        <span className="field-value">{data.duration || '5s'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const LoopOverItemsNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🔁" type="loop-over-items">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Batch Size:</span>
        <span className="field-value">{data.batchSize || '1'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const ManualTriggerNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🖐️" type="manual-trigger">
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Manual execution</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

// =============================================================================
// COMMUNICATION NODES
// =============================================================================

export const SlackNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="💬" type="slack">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Channel:</span>
        <span className="field-value">{data.channel || '#general'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const DiscordNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="💬" type="discord">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Channel:</span>
        <span className="field-value">{data.channelId || 'Not set'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const TelegramNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="💬" type="telegram">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Chat ID:</span>
        <span className="field-value">{data.chatId || 'Not set'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const OutlookNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📧" type="outlook">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Send Email'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const GmailNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📧" type="gmail">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Send Email'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

// =============================================================================
// PRODUCTIVITY NODES
// =============================================================================

export const NotionNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🗒️" type="notion">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Page'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const GoogleDriveNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📁" type="google-drive">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Upload File'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const GoogleCalendarNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📅" type="google-calendar">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Event'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const ExcelNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📊" type="excel">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Read Sheet'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const AsanaNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📋" type="asana">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Task'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const TrelloNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📋" type="trello">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Card'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const ClickUpNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📋" type="clickup">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Task'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const JiraNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📋" type="jira">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Issue'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const CalendlyNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📅" type="calendly">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Get Events'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const GoogleTasksNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📋" type="google-tasks">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Task'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const CodaNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📋" type="coda">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Row'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

// =============================================================================
// DATABASE NODES
// =============================================================================

export const MySQLNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🗄️" type="mysql">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Execute Query'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const PostgreSQLNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🗄️" type="postgresql">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Execute Query'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const AirtableNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🗄️" type="airtable">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'List Records'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const MongoDBNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🗄️" type="mongodb">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Find Documents'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

// =============================================================================
// STORAGE NODES
// =============================================================================

export const S3Node = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🗄️" type="s3">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Upload File'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const NextcloudNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🗄️" type="nextcloud">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Upload File'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

// =============================================================================
// CRM NODES
// =============================================================================

export const PipedriveNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📇" type="pipedrive">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Deal'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const HubSpotNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📇" type="hubspot">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Contact'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const SalesforceNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📇" type="salesforce">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Record'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

// =============================================================================
// OTHER SERVICE NODES
// =============================================================================

export const StravaNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🏃" type="strava">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Get Activities'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const CoinGeckoNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🪙" type="coingecko">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Get Price'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const ServiceNowNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🏢" type="servicenow">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Incident'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const TaigaNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📋" type="taiga">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Issue'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const MailchimpNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📧" type="mailchimp">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Add Member'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const ActiveCampaignNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📧" type="activecampaign">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Contact'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const GitHubNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🐙" type="github">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Issue'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const TwitterNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🐦" type="twitter">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Post Tweet'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const LinkedInNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="💼" type="linkedin">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Share Post'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const ShopifyNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🛒" type="shopify">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Product'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const WooCommerceNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🛒" type="woocommerce">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Product'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const WordPressNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📝" type="wordpress">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Post'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const ZendeskNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🎫" type="zendesk">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Ticket'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

// =============================================================================
// AI NODES
// =============================================================================

export const LangChainAgentNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🤖" type="langchain-agent">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Agent Type:</span>
        <span className="field-value">{data.agentType || 'Chat'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const ChatbotNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="💬" type="chatbot">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Model:</span>
        <span className="field-value">{data.model || 'GPT-3.5'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const DocumentProcessorNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📄" type="document-processor">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Extract Text'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const HttpRequestNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🌐" type="http">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Method:</span>
        <span className="field-value">{data.method || 'GET'}</span>
      </div>
      <div className="node-field">
        <span className="field-label">URL:</span>
        <span className="field-value">{data.url || 'https://api.example.com'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const CodeNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="💻" type="code">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Language:</span>
        <span className="field-value">{data.language || 'JavaScript'}</span>
      </div>
      <div className="node-field">
        <span className="field-label">Mode:</span>
        <span className="field-value">{data.mode || 'Run Once for All Items'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const IfNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="❓" type="if">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Condition:</span>
        <span className="field-value">{data.condition || 'item.value > 0'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} id="true" style={{ left: '25%' }} />
    <Handle type="source" position={Position.Bottom} id="false" style={{ left: '75%' }} />
    <div className="condition-labels">
      <span className="true-label">True</span>
      <span className="false-label">False</span>
    </div>
  </BaseNode>
);

export const SwitchNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🔀" type="switch">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Rules:</span>
        <span className="field-value">{data.rules?.length || 0} rules</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const MergeNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🔗" type="merge">
    <Handle type="target" position={Position.Top} id="input1" style={{ left: '25%' }} />
    <Handle type="target" position={Position.Top} id="input2" style={{ left: '75%' }} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Mode:</span>
        <span className="field-value">{data.mode || 'Append'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const SetNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📝" type="set">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operations:</span>
        <span className="field-value">{data.operations?.length || 0} operations</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const WaitNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="⏳" type="wait">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Duration:</span>
        <span className="field-value">{data.duration || '5s'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

// =============================================================================
// MESSAGING NODES
// =============================================================================

export const SlackNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="💬" type="slack">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Send Message'}</span>
      </div>
      <div className="node-field">
        <span className="field-label">Channel:</span>
        <span className="field-value">{data.channel || '#general'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const DiscordNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🎮" type="discord">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Send Message'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const TelegramNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="✈️" type="telegram">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Send Message'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const GmailNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📧" type="gmail">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Send Email'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

// =============================================================================
// PRODUCTIVITY NODES
// =============================================================================

export const NotionNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🗒️" type="notion">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Page'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const GoogleDriveNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📁" type="googledrive">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Upload File'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const TrelloNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📋" type="trello">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Card'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

// =============================================================================
// DATABASE NODES
// =============================================================================

export const MySQLNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🗄️" type="mysql">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Execute Query'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const PostgreSQLNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🐘" type="postgresql">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Execute Query'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const AirtableNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="📊" type="airtable">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Operation:</span>
        <span className="field-value">{data.operation || 'Create Record'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

// =============================================================================
// AI NODES
// =============================================================================

export const LangChainAgentNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="🤖" type="langchain">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Agent Type:</span>
        <span className="field-value">{data.agentType || 'Zero Shot React'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

export const ChatbotNode = ({ data, selected }) => (
  <BaseNode data={data} selected={selected} icon="💬" type="chatbot">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-field">
        <span className="field-label">Model:</span>
        <span className="field-value">{data.model || 'GPT-4'}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </BaseNode>
);

// =============================================================================
// NODE REGISTRY
// =============================================================================

export const n8nNodeRegistry = {
  // Core Nodes
  start: { label: 'Start', category: 'Trigger', icon: '▶️', component: StartNode, description: 'Trigger to start the workflow' },
  webhook: { label: 'Webhook', category: 'Trigger', icon: '🔗', component: WebhookNode, description: 'Trigger workflow via webhook' },
  schedule: { label: 'Schedule', category: 'Trigger', icon: '⏰', component: ScheduleNode, description: 'Trigger workflow on schedule' },
  httpRequest: { label: 'HTTP Request', category: 'Core', icon: '🌐', component: HttpRequestNode, description: 'Make HTTP requests' },
  code: { label: 'Code', category: 'Core', icon: '💻', component: CodeNode, description: 'Execute custom code' },
  if: { label: 'IF', category: 'Flow', icon: '❓', component: IfNode, description: 'Conditional logic' },
  switch: { label: 'Switch', category: 'Flow', icon: '🔀', component: SwitchNode, description: 'Route data based on conditions' },
  merge: { label: 'Merge', category: 'Flow', icon: '🔗', component: MergeNode, description: 'Combine data from multiple inputs' },
  set: { label: 'Set', category: 'Core', icon: '📝', component: SetNode, description: 'Set or modify data' },
  wait: { label: 'Wait', category: 'Flow', icon: '⏳', component: WaitNode, description: 'Pause workflow execution' },
  
  // Messaging
  slack: { label: 'Slack', category: 'Messaging', icon: '💬', component: SlackNode, description: 'Send Slack messages' },
  discord: { label: 'Discord', category: 'Messaging', icon: '🎮', component: DiscordNode, description: 'Discord integration' },
  telegram: { label: 'Telegram', category: 'Messaging', icon: '✈️', component: TelegramNode, description: 'Telegram bot integration' },
  gmail: { label: 'Gmail', category: 'Messaging', icon: '📧', component: GmailNode, description: 'Gmail integration' },
  
  // Productivity
  notion: { label: 'Notion', category: 'Productivity', icon: '🗒️', component: NotionNode, description: 'Notion workspace integration' },
  googleDrive: { label: 'Google Drive', category: 'Productivity', icon: '📁', component: GoogleDriveNode, description: 'Google Drive file management' },
  trello: { label: 'Trello', category: 'Productivity', icon: '📋', component: TrelloNode, description: 'Trello board management' },
  
  // Databases
  mysql: { label: 'MySQL', category: 'Database', icon: '🗄️', component: MySQLNode, description: 'MySQL database operations' },
  postgresql: { label: 'PostgreSQL', category: 'Database', icon: '🐘', component: PostgreSQLNode, description: 'PostgreSQL operations' },
  airtable: { label: 'Airtable', category: 'Database', icon: '📊', component: AirtableNode, description: 'Airtable base operations' },
  
  // AI
  langchainAgent: { label: 'LangChain Agent', category: 'AI', icon: '🤖', component: LangChainAgentNode, description: 'AI agent powered by LangChain' },
  chatbot: { label: 'Chatbot', category: 'AI', icon: '💬', component: ChatbotNode, description: 'AI chatbot integration' }
};

export const nodeCategories = {
  'Trigger': ['start', 'webhook', 'schedule'],
  'Core': ['httpRequest', 'code', 'set'],
  'Flow': ['if', 'switch', 'merge', 'wait'],
  'Messaging': ['slack', 'discord', 'telegram', 'gmail'],
  'Productivity': ['notion', 'googleDrive', 'trello'],
  'Database': ['mysql', 'postgresql', 'airtable'],
  'AI': ['langchainAgent', 'chatbot']
};

export default n8nNodeRegistry;
