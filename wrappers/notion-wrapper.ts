/**
 * Notion MCP Wrapper
 *
 * Progressive disclosure wrapper for Notion API.
 * Only loaded when Notion integration is needed.
 *
 * Usage:
 * ```typescript
 * import { NotionWrapper } from './notion-wrapper';
 * const notion = new NotionWrapper();
 * const pages = await notion.searchPages('meeting notes');
 * ```
 */

interface NotionPage {
  id: string;
  title: string;
  url: string;
  created_time: string;
  last_edited_time: string;
}

interface NotionDatabase {
  id: string;
  title: string;
  url: string;
}

export class NotionWrapper {
  private apiToken: string;
  private baseUrl = 'https://api.notion.com/v1';
  private version = '2022-06-28';

  constructor() {
    this.apiToken = process.env.NOTION_API_TOKEN || '';
    if (!this.apiToken) {
      throw new Error('NOTION_API_TOKEN environment variable not set');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Notion-Version': this.version,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Search for pages in Notion workspace
   *
   * @param query - Search query
   * @param options - Search options
   * @returns Array of matching pages
   */
  async searchPages(
    query: string,
    options: {
      filter?: 'page' | 'database';
      sort?: {
        direction: 'ascending' | 'descending';
        timestamp: 'last_edited_time';
      };
    } = {}
  ): Promise<NotionPage[]> {
    const body: any = {
      query,
    };

    if (options.filter) {
      body.filter = { property: 'object', value: options.filter };
    }

    if (options.sort) {
      body.sort = options.sort;
    }

    const data = await this.request('/search', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return (data.results || []).map((result: any) => ({
      id: result.id,
      title: this.extractTitle(result),
      url: result.url,
      created_time: result.created_time,
      last_edited_time: result.last_edited_time,
    }));
  }

  /**
   * Get page content by ID
   *
   * @param pageId - Notion page ID
   * @returns Page content
   */
  async getPage(pageId: string): Promise<any> {
    return this.request(`/pages/${pageId}`);
  }

  /**
   * Get database by ID
   *
   * @param databaseId - Notion database ID
   * @returns Database information
   */
  async getDatabase(databaseId: string): Promise<NotionDatabase> {
    const data = await this.request(`/databases/${databaseId}`);

    return {
      id: data.id,
      title: this.extractTitle(data),
      url: data.url,
    };
  }

  /**
   * Query database
   *
   * @param databaseId - Database ID
   * @param options - Query options
   * @returns Database entries
   */
  async queryDatabase(
    databaseId: string,
    options: {
      filter?: any;
      sorts?: any[];
      pageSize?: number;
    } = {}
  ): Promise<any[]> {
    const body: any = {
      page_size: options.pageSize || 100,
    };

    if (options.filter) {
      body.filter = options.filter;
    }

    if (options.sorts) {
      body.sorts = options.sorts;
    }

    const data = await this.request(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return data.results || [];
  }

  /**
   * Create a new page
   *
   * @param parent - Parent page or database
   * @param properties - Page properties
   * @returns Created page
   */
  async createPage(parent: { page_id: string } | { database_id: string }, properties: any): Promise<any> {
    return this.request('/pages', {
      method: 'POST',
      body: JSON.stringify({
        parent,
        properties,
      }),
    });
  }

  /**
   * Update page properties
   *
   * @param pageId - Page ID
   * @param properties - Properties to update
   * @returns Updated page
   */
  async updatePage(pageId: string, properties: any): Promise<any> {
    return this.request(`/pages/${pageId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        properties,
      }),
    });
  }

  /**
   * Helper to extract title from Notion object
   */
  private extractTitle(obj: any): string {
    if (obj.properties?.title?.title?.[0]?.plain_text) {
      return obj.properties.title.title[0].plain_text;
    }
    if (obj.properties?.Name?.title?.[0]?.plain_text) {
      return obj.properties.Name.title[0].plain_text;
    }
    if (obj.title?.[0]?.plain_text) {
      return obj.title[0].plain_text;
    }
    return 'Untitled';
  }
}

// Export convenience functions
export async function searchNotion(query: string): Promise<NotionPage[]> {
  const wrapper = new NotionWrapper();
  return wrapper.searchPages(query);
}

export async function getNotionPage(pageId: string): Promise<any> {
  const wrapper = new NotionWrapper();
  return wrapper.getPage(pageId);
}
