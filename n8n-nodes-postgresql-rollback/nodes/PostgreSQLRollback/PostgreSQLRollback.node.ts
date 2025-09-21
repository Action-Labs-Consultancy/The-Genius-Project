import { IExecuteFunctions } from 'n8n-core';
import {
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

export class PostgreSQLRollback implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'PostgreSQL Rollback',
    name: 'postgresqlRollback',
    icon: 'file:postgresql.svg',
    group: ['database'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Database rollback and recovery operations with PITR support',
    defaults: {
      name: 'PostgreSQL Rollback',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Create Backup',
            value: 'backup',
            description: 'Create a full database backup',
            action: 'Create a database backup',
          },
          {
            name: 'Point-in-Time Recovery',
            value: 'pitr',
            description: 'Rollback database to specific timestamp',
            action: 'Perform point-in-time recovery',
          },
          {
            name: 'Restore from Backup',
            value: 'restore',
            description: 'Restore database from backup file',
            action: 'Restore from backup file',
          },
          {
            name: 'List Backups',
            value: 'list',
            description: 'List available backup files',
            action: 'List available backups',
          },
          {
            name: 'Check Status',
            value: 'status',
            description: 'Check database and service status',
            action: 'Check database status',
          },
        ],
        default: 'status',
      },
      {
        displayName: 'Recovery Timestamp',
        name: 'timestamp',
        type: 'dateTime',
        default: '',
        placeholder: '2024-01-15T10:30:00Z',
        description: 'Target timestamp for point-in-time recovery',
        displayOptions: {
          show: {
            operation: ['pitr'],
          },
        },
      },
      {
        displayName: 'Backup File',
        name: 'backupFile',
        type: 'string',
        default: '',
        placeholder: 'n8n_backup_2024-01-15T10-30-00-000Z.sql',
        description: 'Name of backup file to restore from',
        displayOptions: {
          show: {
            operation: ['restore'],
          },
        },
      },
      {
        displayName: 'Confirmation Required',
        name: 'confirmDestructive',
        type: 'boolean',
        default: false,
        description: 'I understand this operation may be destructive and have verified the parameters',
        displayOptions: {
          show: {
            operation: ['pitr', 'restore'],
          },
        },
      },
      {
        displayName: 'Database API URL',
        name: 'apiUrl',
        type: 'string',
        default: 'http://localhost:10000',
        description: 'URL of the database management API server',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const operation = this.getNodeParameter('operation', i) as string;
        const apiUrl = this.getNodeParameter('apiUrl', i) as string;

        let endpoint = '';
        let method = 'GET';
        let body: any = null;

        switch (operation) {
          case 'status':
            endpoint = '/api/database/status';
            method = 'GET';
            break;

          case 'backup':
            endpoint = '/api/database/backup';
            method = 'POST';
            break;

          case 'list':
            endpoint = '/api/database/backups';
            method = 'GET';
            break;

          case 'pitr':
            const timestamp = this.getNodeParameter('timestamp', i) as string;
            const confirmPitr = this.getNodeParameter('confirmDestructive', i) as boolean;
            
            if (!confirmPitr) {
              throw new NodeOperationError(
                this.getNode(),
                'Point-in-time recovery requires confirmation. Please check the confirmation checkbox.',
                { itemIndex: i }
              );
            }
            
            if (!timestamp) {
              throw new NodeOperationError(
                this.getNode(),
                'Recovery timestamp is required for point-in-time recovery',
                { itemIndex: i }
              );
            }

            endpoint = '/api/database/rollback';
            method = 'POST';
            body = { timestamp };
            break;

          case 'restore':
            const backupFile = this.getNodeParameter('backupFile', i) as string;
            const confirmRestore = this.getNodeParameter('confirmDestructive', i) as boolean;
            
            if (!confirmRestore) {
              throw new NodeOperationError(
                this.getNode(),
                'Database restore requires confirmation. Please check the confirmation checkbox.',
                { itemIndex: i }
              );
            }
            
            if (!backupFile) {
              throw new NodeOperationError(
                this.getNode(),
                'Backup file name is required for restore operation',
                { itemIndex: i }
              );
            }

            endpoint = '/api/database/recovery';
            method = 'POST';
            body = { backupFile };
            break;

          default:
            throw new NodeOperationError(
              this.getNode(),
              `Unknown operation: ${operation}`,
              { itemIndex: i }
            );
        }

        const url = `${apiUrl}${endpoint}`;
        
        const requestOptions: any = {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          json: true,
        };

        if (body) {
          requestOptions.body = body;
        }

        const response = await this.helpers.request(requestOptions.url || url, requestOptions);

        let responseData: any;
        if (typeof response === 'string') {
          try {
            responseData = JSON.parse(response);
          } catch (error) {
            responseData = { result: response };
          }
        } else {
          responseData = response;
        }

        // Add metadata about the operation
        const result = {
          operation,
          timestamp: new Date().toISOString(),
          apiUrl,
          endpoint,
          ...responseData,
        };

        // Add success indicators
        if (operation === 'backup' && responseData.success) {
          result.message = '✅ Database backup completed successfully';
        } else if (operation === 'pitr' && responseData.success) {
          result.message = '✅ Point-in-time recovery completed successfully';
        } else if (operation === 'restore' && responseData.success) {
          result.message = '✅ Database restore completed successfully';
        } else if (operation === 'status') {
          result.message = responseData.status === 'healthy' ? '✅ Database is healthy' : '⚠️ Database issues detected';
        } else if (operation === 'list') {
          result.message = `📋 Found ${responseData.totalBackups || 0} backup files`;
        }

        returnData.push({
          json: result,
          pairedItem: { item: i },
        });

      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error.message,
              operation: this.getNodeParameter('operation', i),
              timestamp: new Date().toISOString(),
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
