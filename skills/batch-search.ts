/**
 * Batch Search Skill
 *
 * Generated skill - reusable across sessions
 *
 * Performs multiple web searches efficiently using the Brave Search API.
 * Useful for research, documentation discovery, and gathering best practices.
 *
 * @example
 * ```typescript
 * import { batchSearch, formatSearchResults } from './batch-search';
 *
 * const queries = [
 *   'BullMQ in-memory queue mock',
 *   'Supabase JS client mock testing strategy',
 *   'Vitest React Testing Library setup'
 * ];
 *
 * const results = await batchSearch(queries, { resultsPerQuery: 3 });
 * console.log(formatSearchResults(results));
 * ```
 *
 * Token efficiency:
 * - First use (generate): ~2000 tokens
 * - Subsequent uses (import): ~200 tokens
 * - Savings: 90% reduction
 *
 * Created: 2025-11-08
 * Pattern: Code execution with progressive disclosure
 */

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

interface QueryResult {
  query: string;
  totalResults?: number;
  results: SearchResult[];
  error?: string;
}

interface BatchSearchOptions {
  resultsPerQuery?: number;
  delayMs?: number;
  country?: string;
  safesearch?: 'off' | 'moderate' | 'strict';
}

/**
 * Execute multiple searches in sequence with rate limiting
 *
 * @param queries - Array of search queries
 * @param options - Search configuration
 * @returns Array of results for each query
 */
export async function batchSearch(
  queries: string[],
  options: BatchSearchOptions = {}
): Promise<QueryResult[]> {
  const {
    resultsPerQuery = 5,
    delayMs = 1000,
    country,
    safesearch = 'moderate',
  } = options;

  // Progressive loading: Only import wrapper when needed
  const { BraveSearchWrapper } = await import(
    '../wrappers/brave-search-wrapper.ts'
  );

  const wrapper = new BraveSearchWrapper();
  const results: QueryResult[] = [];

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];

    try {
      const searchResult = await wrapper.webSearch(query, {
        count: resultsPerQuery,
        country,
        safesearch,
      });

      results.push({
        query,
        totalResults: searchResult.totalResults,
        results: searchResult.results,
      });
    } catch (error) {
      results.push({
        query,
        results: [],
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Rate limiting: delay between requests (except last one)
    if (i < queries.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Format batch search results as human-readable text
 *
 * @param results - Results from batchSearch
 * @returns Formatted string for display
 */
export function formatSearchResults(results: QueryResult[]): string {
  let output = '';

  results.forEach((result, index) => {
    output += `\n${'='.repeat(80)}\n`;
    output += `Query ${index + 1}: "${result.query}"\n`;
    output += `${'='.repeat(80)}\n`;

    if (result.error) {
      output += `❌ Error: ${result.error}\n`;
      return;
    }

    if (result.totalResults !== undefined) {
      output += `Found ${result.totalResults.toLocaleString()} total results\n\n`;
    }

    result.results.forEach((item, i) => {
      output += `${i + 1}. ${item.title}\n`;
      output += `   URL: ${item.url}\n`;
      if (item.description) {
        const desc = item.description.substring(0, 150);
        output += `   ${desc}${item.description.length > 150 ? '...' : ''}\n`;
      }
      output += '\n';
    });
  });

  return output;
}

/**
 * Export results as JSON for further processing
 *
 * @param results - Results from batchSearch
 * @returns JSON string
 */
export function exportResultsAsJson(results: QueryResult[]): string {
  return JSON.stringify(results, null, 2);
}

/**
 * Extract unique URLs from all search results
 *
 * @param results - Results from batchSearch
 * @returns Array of unique URLs
 */
export function extractUrls(results: QueryResult[]): string[] {
  const urls = new Set<string>();

  results.forEach((result) => {
    result.results.forEach((item) => {
      urls.add(item.url);
    });
  });

  return Array.from(urls);
}

/**
 * Filter results by domain
 *
 * @param results - Results from batchSearch
 * @param domains - Array of domains to filter (e.g., ['github.com', 'stackoverflow.com'])
 * @returns Filtered results
 */
export function filterByDomain(
  results: QueryResult[],
  domains: string[]
): QueryResult[] {
  return results.map((result) => ({
    ...result,
    results: result.results.filter((item) => {
      const url = new URL(item.url);
      return domains.some((domain) => url.hostname.includes(domain));
    }),
  }));
}

/**
 * Convenience function for testing-related searches
 *
 * @param technologies - Array of technologies to search (e.g., ['BullMQ', 'Supabase'])
 * @returns Formatted search results
 */
export async function searchTestingPatterns(
  technologies: string[]
): Promise<string> {
  const queries = technologies.map((tech) => `${tech} mock testing strategy`);

  const results = await batchSearch(queries, {
    resultsPerQuery: 3,
    delayMs: 1500, // Slower to avoid rate limits
  });

  return formatSearchResults(results);
}
