/**
 * SerpAPI MCP Wrapper
 *
 * Progressive disclosure wrapper for SerpAPI search.
 * Only loaded when search engine results are needed.
 *
 * Usage:
 * ```typescript
 * import { SerpWrapper } from './serp-wrapper';
 * const serp = new SerpWrapper();
 * const results = await serp.googleSearch('latest AI news');
 * ```
 */

interface SerpResult {
  title: string;
  link: string;
  snippet: string;
  position?: number;
}

interface SerpResponse {
  query: string;
  organicResults: SerpResult[];
  relatedSearches?: string[];
  totalResults?: number;
}

export class SerpWrapper {
  private apiKey: string;
  private baseUrl = 'https://serpapi.com';

  constructor() {
    this.apiKey = process.env.SERPAPI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('SERPAPI_API_KEY environment variable not set');
    }
  }

  /**
   * Perform Google search
   *
   * @param query - Search query
   * @param options - Search options
   * @returns Search results
   */
  async googleSearch(
    query: string,
    options: {
      location?: string;
      language?: string;
      num?: number;
      start?: number;
    } = {}
  ): Promise<SerpResponse> {
    const params = new URLSearchParams({
      q: query,
      api_key: this.apiKey,
      engine: 'google',
      ...options,
      num: (options.num || 10).toString(),
    });

    const response = await fetch(`${this.baseUrl}/search?${params}`);

    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      query,
      organicResults: (data.organic_results || []).map((result: any) => ({
        title: result.title,
        link: result.link,
        snippet: result.snippet,
        position: result.position,
      })),
      relatedSearches: data.related_searches?.map((s: any) => s.query),
      totalResults: parseInt(data.search_information?.total_results || '0'),
    };
  }

  /**
   * Perform image search
   *
   * @param query - Image search query
   * @param options - Search options
   * @returns Image results
   */
  async imageSearch(
    query: string,
    options: {
      num?: number;
      safe?: 'active' | 'off';
    } = {}
  ): Promise<Array<{ title: string; link: string; thumbnail: string }>> {
    const params = new URLSearchParams({
      q: query,
      api_key: this.apiKey,
      engine: 'google_images',
      num: (options.num || 10).toString(),
      ...(options.safe && { safe: options.safe }),
    });

    const response = await fetch(`${this.baseUrl}/search?${params}`);

    if (!response.ok) {
      throw new Error(`SerpAPI image search error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return (data.images_results || []).map((result: any) => ({
      title: result.title,
      link: result.original,
      thumbnail: result.thumbnail,
    }));
  }

  /**
   * Get search suggestions
   *
   * @param query - Partial query
   * @returns Search suggestions
   */
  async getSuggestions(query: string): Promise<string[]> {
    const params = new URLSearchParams({
      q: query,
      api_key: this.apiKey,
      engine: 'google_autocomplete',
    });

    const response = await fetch(`${this.baseUrl}/search?${params}`);

    if (!response.ok) {
      throw new Error(`SerpAPI suggestions error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return (data.suggestions || []).map((s: any) => s.value);
  }

  /**
   * Search news
   *
   * @param query - News search query
   * @param options - Search options
   * @returns News results
   */
  async newsSearch(
    query: string,
    options: {
      num?: number;
      timeRange?: 'd' | 'w' | 'm' | 'y';
    } = {}
  ): Promise<Array<{ title: string; link: string; snippet: string; source: string; date: string }>> {
    const params = new URLSearchParams({
      q: query,
      api_key: this.apiKey,
      engine: 'google',
      tbm: 'nws',
      num: (options.num || 10).toString(),
      ...(options.timeRange && { tbs: `qdr:${options.timeRange}` }),
    });

    const response = await fetch(`${this.baseUrl}/search?${params}`);

    if (!response.ok) {
      throw new Error(`SerpAPI news search error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return (data.news_results || []).map((result: any) => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet,
      source: result.source,
      date: result.date,
    }));
  }
}

// Export convenience functions
export async function searchGoogle(query: string, num: number = 10): Promise<SerpResponse> {
  const wrapper = new SerpWrapper();
  return wrapper.googleSearch(query, { num });
}

export async function searchImages(query: string, num: number = 10): Promise<Array<{ title: string; link: string; thumbnail: string }>> {
  const wrapper = new SerpWrapper();
  return wrapper.imageSearch(query, { num });
}

export async function searchNews(query: string, num: number = 10): Promise<Array<{ title: string; link: string; snippet: string; source: string; date: string }>> {
  const wrapper = new SerpWrapper();
  return wrapper.newsSearch(query, { num });
}
