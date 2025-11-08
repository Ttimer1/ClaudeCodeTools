/**
 * N8N MCP Wrapper
 *
 * Progressive disclosure wrapper for N8N automation platform via Docker.
 * Only loaded when N8N integration is needed.
 *
 * Usage:
 * ```typescript
 * import { N8NMCPWrapper } from './n8n-mcp-wrapper';
 * const n8n = new N8NMCPWrapper();
 * const workflows = await n8n.listWorkflows();
 * ```
 */

interface N8NWorkflow {
  id: string;
  name: string;
  active: boolean;
  tags?: string[];
}

interface N8NExecution {
  id: string;
  workflowId: string;
  status: 'success' | 'error' | 'running';
  startedAt: string;
  stoppedAt?: string;
}

export class N8NMCPWrapper {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.N8N_API_URL || '';
    this.apiKey = process.env.N8N_API_KEY || '';

    if (!this.apiUrl) {
      throw new Error('N8N_API_URL environment variable not set');
    }

    if (!this.apiKey) {
      throw new Error('N8N_API_KEY environment variable not set');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'X-N8N-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`N8N API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List all workflows
   *
   * @returns Array of workflows
   */
  async listWorkflows(): Promise<N8NWorkflow[]> {
    const data = await this.request('/workflows');
    return (data.data || []).map((wf: any) => ({
      id: wf.id,
      name: wf.name,
      active: wf.active,
      tags: wf.tags,
    }));
  }

  /**
   * Get workflow by ID
   *
   * @param workflowId - Workflow ID
   * @returns Workflow details
   */
  async getWorkflow(workflowId: string): Promise<any> {
    return this.request(`/workflows/${workflowId}`);
  }

  /**
   * Execute workflow
   *
   * @param workflowId - Workflow ID to execute
   * @param data - Input data for workflow
   * @returns Execution result
   */
  async executeWorkflow(workflowId: string, data: Record<string, any> = {}): Promise<N8NExecution> {
    const result = await this.request(`/workflows/${workflowId}/execute`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return {
      id: result.data?.id || '',
      workflowId,
      status: result.data?.status || 'running',
      startedAt: result.data?.startedAt || new Date().toISOString(),
      stoppedAt: result.data?.stoppedAt,
    };
  }

  /**
   * Get execution status
   *
   * @param executionId - Execution ID
   * @returns Execution details
   */
  async getExecution(executionId: string): Promise<N8NExecution> {
    const data = await this.request(`/executions/${executionId}`);

    return {
      id: data.id,
      workflowId: data.workflowId,
      status: data.finished ? (data.data.resultData.error ? 'error' : 'success') : 'running',
      startedAt: data.startedAt,
      stoppedAt: data.stoppedAt,
    };
  }

  /**
   * Activate workflow
   *
   * @param workflowId - Workflow ID
   */
  async activateWorkflow(workflowId: string): Promise<void> {
    await this.request(`/workflows/${workflowId}/activate`, {
      method: 'POST',
    });
  }

  /**
   * Deactivate workflow
   *
   * @param workflowId - Workflow ID
   */
  async deactivateWorkflow(workflowId: string): Promise<void> {
    await this.request(`/workflows/${workflowId}/deactivate`, {
      method: 'POST',
    });
  }
}

// Export convenience functions
export async function listN8NWorkflows(): Promise<N8NWorkflow[]> {
  const wrapper = new N8NMCPWrapper();
  return wrapper.listWorkflows();
}

export async function executeN8NWorkflow(workflowId: string, data: Record<string, any> = {}): Promise<N8NExecution> {
  const wrapper = new N8NMCPWrapper();
  return wrapper.executeWorkflow(workflowId, data);
}
