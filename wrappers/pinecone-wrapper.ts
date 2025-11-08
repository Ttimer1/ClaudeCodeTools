/**
 * Pinecone MCP Wrapper
 *
 * Progressive disclosure wrapper for Pinecone vector database.
 * Only loaded when vector operations are needed.
 *
 * Usage:
 * ```typescript
 * import { PineconeWrapper } from './pinecone-wrapper';
 * const pinecone = new PineconeWrapper();
 * const results = await pinecone.query([0.1, 0.2, 0.3], { topK: 10 });
 * ```
 */

interface PineconeVector {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}

interface QueryResult {
  id: string;
  score: number;
  metadata?: Record<string, any>;
}

export class PineconeWrapper {
  private apiKey: string;
  private assistantHost: string;

  constructor() {
    this.apiKey = process.env.PINECONE_API_KEY || '';
    this.assistantHost = process.env.PINECONE_ASSISTANT_HOST || '';

    if (!this.apiKey) {
      throw new Error('PINECONE_API_KEY environment variable not set');
    }

    if (!this.assistantHost) {
      throw new Error('PINECONE_ASSISTANT_HOST environment variable not set');
    }
  }

  /**
   * Query vectors by similarity
   *
   * @param vector - Query vector
   * @param options - Query options
   * @returns Matching vectors with scores
   */
  async query(
    vector: number[],
    options: {
      topK?: number;
      filter?: Record<string, any>;
      includeMetadata?: boolean;
    } = {}
  ): Promise<QueryResult[]> {
    const response = await fetch(`${this.assistantHost}/query`, {
      method: 'POST',
      headers: {
        'Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vector,
        topK: options.topK || 10,
        filter: options.filter,
        includeMetadata: options.includeMetadata !== false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Pinecone API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.matches || [];
  }

  /**
   * Upsert vectors to index
   *
   * @param vectors - Vectors to upsert
   * @param namespace - Optional namespace
   */
  async upsert(vectors: PineconeVector[], namespace?: string): Promise<void> {
    const response = await fetch(`${this.assistantHost}/vectors/upsert`, {
      method: 'POST',
      headers: {
        'Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vectors,
        namespace,
      }),
    });

    if (!response.ok) {
      throw new Error(`Pinecone upsert error: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Delete vectors by ID
   *
   * @param ids - Vector IDs to delete
   * @param namespace - Optional namespace
   */
  async delete(ids: string[], namespace?: string): Promise<void> {
    const response = await fetch(`${this.assistantHost}/vectors/delete`, {
      method: 'POST',
      headers: {
        'Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids,
        namespace,
      }),
    });

    if (!response.ok) {
      throw new Error(`Pinecone delete error: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Fetch vectors by ID
   *
   * @param ids - Vector IDs to fetch
   * @param namespace - Optional namespace
   * @returns Fetched vectors
   */
  async fetch(ids: string[], namespace?: string): Promise<Record<string, PineconeVector>> {
    const response = await fetch(`${this.assistantHost}/vectors/fetch`, {
      method: 'POST',
      headers: {
        'Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids,
        namespace,
      }),
    });

    if (!response.ok) {
      throw new Error(`Pinecone fetch error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.vectors || {};
  }
}

// Export convenience function
export async function queryVectors(vector: number[], topK: number = 10): Promise<QueryResult[]> {
  const wrapper = new PineconeWrapper();
  return wrapper.query(vector, { topK });
}
