/**
 * Firecrawl MCP Wrapper
 *
 * Progressive disclosure wrapper for Firecrawl API.
 * Only loaded when web scraping/crawling functionality is needed.
 *
 * Firecrawl converts web pages to clean markdown or structured data.
 *
 * Usage:
 * ```typescript
 * import { FirecrawlWrapper } from './firecrawl-wrapper';
 * const crawler = new FirecrawlWrapper();
 * const data = await crawler.scrapeUrl('https://example.com');
 * ```
 */

interface FirecrawlScrapeResult {
  success: boolean;
  markdown?: string;
  html?: string;
  metadata?: {
    title?: string;
    description?: string;
    language?: string;
    sourceURL?: string;
  };
  error?: string;
}

interface FirecrawlCrawlOptions {
  maxDepth?: number;
  limit?: number;
  allowBackwardCrawling?: boolean;
  allowExternalContentLinks?: boolean;
}

export class FirecrawlWrapper {
  private apiKey: string;
  private baseUrl = 'https://api.firecrawl.dev/v0';

  constructor() {
    this.apiKey = process.env.FIRECRAWL_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('FIRECRAWL_API_KEY environment variable not set');
    }
  }

  /**
   * Scrape a single URL and convert to markdown
   *
   * @param url - URL to scrape
   * @param options - Optional scraping parameters
   * @returns Scraped content as markdown with metadata
   */
  async scrapeUrl(
    url: string,
    options: {
      formats?: ('markdown' | 'html' | 'rawHtml')[];
      onlyMainContent?: boolean;
      includeTags?: string[];
      excludeTags?: string[];
      waitFor?: number;
    } = {}
  ): Promise<FirecrawlScrapeResult> {
    try {
      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          url,
          formats: options.formats || ['markdown'],
          onlyMainContent: options.onlyMainContent !== false,
          includeTags: options.includeTags,
          excludeTags: options.excludeTags,
          waitFor: options.waitFor || 0,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Firecrawl API error: ${response.status} ${response.statusText} - ${errorText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        markdown: data.data?.markdown,
        html: data.data?.html,
        metadata: {
          title: data.data?.metadata?.title,
          description: data.data?.metadata?.description,
          language: data.data?.metadata?.language,
          sourceURL: data.data?.metadata?.sourceURL || url,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to scrape URL: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Crawl a website starting from a URL
   *
   * @param url - Starting URL to crawl
   * @param options - Crawl configuration
   * @returns Crawl job ID for status checking
   */
  async crawlWebsite(
    url: string,
    options: FirecrawlCrawlOptions = {}
  ): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/crawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          url,
          crawlerOptions: {
            maxDepth: options.maxDepth || 2,
            limit: options.limit || 100,
            allowBackwardCrawling: options.allowBackwardCrawling || false,
            allowExternalContentLinks: options.allowExternalContentLinks || false,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Firecrawl crawl error: ${response.status} ${response.statusText} - ${errorText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        jobId: data.jobId,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to start crawl: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check crawl job status
   *
   * @param jobId - Job ID from crawlWebsite
   * @returns Job status and results if completed
   */
  async getCrawlStatus(jobId: string): Promise<{
    success: boolean;
    status?: 'pending' | 'processing' | 'completed' | 'failed';
    data?: Array<{ url: string; markdown: string; metadata: any }>;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/crawl/status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Failed to get crawl status: ${response.status} ${response.statusText} - ${errorText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        status: data.status,
        data: data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to check crawl status: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}

// Export convenience function for quick single-page scraping
export async function scrapePage(url: string): Promise<FirecrawlScrapeResult> {
  const wrapper = new FirecrawlWrapper();
  return wrapper.scrapeUrl(url);
}
