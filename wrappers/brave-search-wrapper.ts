/**
 * Brave Search MCP Wrapper
 *
 * Progressive disclosure wrapper for Brave Search API.
 * Only loaded when search functionality is needed.
 *
 * Usage:
 * ```typescript
 * import { BraveSearchWrapper } from './brave-search-wrapper';
 * const search = new BraveSearchWrapper();
 * const results = await search.webSearch('traffic theory Netherlands');
 * ```
 */

interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  snippet?: string;
}

interface BraveSearchResponse {
  query: string;
  results: BraveSearchResult[];
  totalResults?: number;
}

export class BraveSearchWrapper {
  private apiKey: string;
  private baseUrl = 'https://api.search.brave.com/res/v1';

  constructor() {
    this.apiKey = process.env.BRAVE_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('BRAVE_API_KEY environment variable not set');
    }
  }

  /**
   * Perform web search using Brave Search API
   *
   * @param query - Search query string
   * @param options - Optional search parameters
   * @returns Search results with titles, URLs, and descriptions
   */
  async webSearch(
    query: string,
    options: {
      count?: number;
      offset?: number;
      country?: string;
      safesearch?: 'off' | 'moderate' | 'strict';
    } = {}
  ): Promise<BraveSearchResponse> {
    const params = new URLSearchParams({
      q: query,
      count: (options.count || 10).toString(),
      offset: (options.offset || 0).toString(),
      ...(options.country && { country: options.country }),
      ...(options.safesearch && { safesearch: options.safesearch }),
    });

    const response = await fetch(`${this.baseUrl}/web/search?${params}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave Search API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      query,
      results: (data.web?.results || []).map((result: any) => ({
        title: result.title,
        url: result.url,
        description: result.description,
        snippet: result.snippet,
      })),
      totalResults: data.web?.totalResults,
    };
  }

  /**
   * Search for images using Brave Search API
   *
   * @param query - Image search query
   * @param options - Optional search parameters
   * @returns Image search results
   */
  async imageSearch(
    query: string,
    options: {
      count?: number;
      safesearch?: 'off' | 'moderate' | 'strict';
    } = {}
  ): Promise<{ query: string; images: Array<{ title: string; url: string; thumbnail: string }> }> {
    const params = new URLSearchParams({
      q: query,
      count: (options.count || 10).toString(),
      ...(options.safesearch && { safesearch: options.safesearch }),
    });

    const response = await fetch(`${this.baseUrl}/images/search?${params}`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave Image Search API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      query,
      images: (data.results || []).map((result: any) => ({
        title: result.title,
        url: result.properties?.url || result.url,
        thumbnail: result.thumbnail?.src,
      })),
    };
  }
}

// Export convenience function for quick usage
export async function searchWeb(query: string, count: number = 10): Promise<BraveSearchResponse> {
  const wrapper = new BraveSearchWrapper();
  return wrapper.webSearch(query, { count });
}
