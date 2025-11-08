/**
 * OpenMemory MCP Wrapper
 *
 * Progressive disclosure wrapper for local OpenMemory server.
 * Only loaded when memory operations are needed.
 *
 * Usage:
 * ```typescript
 * import { OpenMemoryWrapper } from './openmemory-wrapper';
 * const memory = new OpenMemoryWrapper();
 * await memory.store('user_preference', { theme: 'dark' });
 * const data = await memory.recall('user_preference');
 * ```
 */

interface MemoryEntry {
  key: string;
  value: any;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class OpenMemoryWrapper {
  private serverUrl: string;
  private userId: string;

  constructor(serverUrl?: string, userId?: string) {
    this.serverUrl = serverUrl || process.env.OPENMEMORY_URL || 'http://localhost:8765';
    this.userId = userId || process.env.OPENMEMORY_USER_ID || 'default';
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${this.serverUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`OpenMemory error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Store data in memory
   *
   * @param key - Memory key
   * @param value - Data to store
   * @param metadata - Optional metadata
   */
  async store(key: string, value: any, metadata?: Record<string, any>): Promise<void> {
    await this.request(`/mcp/claude/memory/${this.userId}`, {
      method: 'POST',
      body: JSON.stringify({
        key,
        value,
        metadata,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  /**
   * Recall data from memory
   *
   * @param key - Memory key
   * @returns Stored value
   */
  async recall(key: string): Promise<any> {
    const data = await this.request(`/mcp/claude/memory/${this.userId}/${key}`);
    return data.value;
  }

  /**
   * List all memory keys
   *
   * @returns Array of memory keys
   */
  async listKeys(): Promise<string[]> {
    const data = await this.request(`/mcp/claude/memory/${this.userId}/keys`);
    return data.keys || [];
  }

  /**
   * Delete memory entry
   *
   * @param key - Memory key to delete
   */
  async delete(key: string): Promise<void> {
    await this.request(`/mcp/claude/memory/${this.userId}/${key}`, {
      method: 'DELETE',
    });
  }

  /**
   * Search memory entries
   *
   * @param query - Search query
   * @returns Matching memory entries
   */
  async search(query: string): Promise<MemoryEntry[]> {
    const data = await this.request(`/mcp/claude/memory/${this.userId}/search`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    });

    return data.results || [];
  }

  /**
   * Clear all memory for user
   */
  async clearAll(): Promise<void> {
    await this.request(`/mcp/claude/memory/${this.userId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get memory statistics
   *
   * @returns Memory usage stats
   */
  async getStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    lastUpdated: string;
  }> {
    return this.request(`/mcp/claude/memory/${this.userId}/stats`);
  }
}

// Export convenience functions
export async function storeMemory(key: string, value: any): Promise<void> {
  const wrapper = new OpenMemoryWrapper();
  return wrapper.store(key, value);
}

export async function recallMemory(key: string): Promise<any> {
  const wrapper = new OpenMemoryWrapper();
  return wrapper.recall(key);
}

export async function searchMemory(query: string): Promise<MemoryEntry[]> {
  const wrapper = new OpenMemoryWrapper();
  return wrapper.search(query);
}
