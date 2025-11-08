/**
 * N8N Workflows MCP Wrapper
 *
 * Progressive disclosure wrapper for N8N workflow automation via remote MCP.
 * Only loaded when workflow operations are needed.
 *
 * Note: This uses mcp-remote to connect to N8N workflows repository.
 *
 * Usage:
 * ```typescript
 * import { N8NWorkflowsWrapper } from './n8n-workflows-wrapper';
 * const n8n = new N8NWorkflowsWrapper();
 * // Remote MCP integration - tools depend on repository
 * ```
 */

/**
 * N8N Workflows wrapper for remote MCP integration
 *
 * This wrapper connects to N8N workflows via mcp-remote.
 * The actual tools available depend on the remote repository configuration.
 */
export class N8NWorkflowsWrapper {
  private repoUrl: string;

  constructor(repoUrl: string = 'https://gitmcp.io/Zie619/n8n-workflows/tree/main') {
    this.repoUrl = repoUrl;
  }

  /**
   * Get repository URL for mcp-remote connection
   *
   * @returns Remote MCP repository URL
   */
  getRepoUrl(): string {
    return this.repoUrl;
  }

  /**
   * Execute remote MCP tool
   *
   * Note: This requires npx mcp-remote to be available.
   * Tools are defined in the remote repository.
   *
   * @param toolName - Tool to execute
   * @param params - Tool parameters
   * @returns Tool execution result
   */
  async executeTool(toolName: string, params: Record<string, any> = {}): Promise<any> {
    // This is a placeholder for remote MCP tool execution
    // Actual implementation would use npx mcp-remote
    throw new Error(
      'Remote MCP tool execution requires npx mcp-remote. ' +
      `Connect using: npx mcp-remote ${this.repoUrl}`
    );
  }

  /**
   * Get information about this remote MCP server
   */
  getInfo(): {
    name: string;
    type: 'remote-mcp';
    repository: string;
    description: string;
  } {
    return {
      name: 'n8n-workflows',
      type: 'remote-mcp',
      repository: this.repoUrl,
      description: 'N8N workflow automation tools via remote MCP',
    };
  }
}

// Export convenience function
export function createN8NConnection(repoUrl?: string): N8NWorkflowsWrapper {
  return new N8NWorkflowsWrapper(repoUrl);
}
