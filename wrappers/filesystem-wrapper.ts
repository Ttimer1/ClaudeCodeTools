/**
 * Filesystem MCP Wrapper
 *
 * Progressive disclosure wrapper for file system operations.
 * Only loaded when file access is needed.
 *
 * Security: Restricts access to allowed directories only.
 *
 * Usage:
 * ```typescript
 * import { FilesystemWrapper } from './filesystem-wrapper';
 * const fs = new FilesystemWrapper(['/Users/tomlu/Desktop', '/Users/tomlu/Documents']);
 * const files = await fs.listDirectory('/Users/tomlu/Desktop');
 * ```
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
}

export class FilesystemWrapper {
  private allowedPaths: string[];

  constructor(allowedPaths: string[] = []) {
    this.allowedPaths = allowedPaths.map(p => path.resolve(p));

    if (this.allowedPaths.length === 0) {
      throw new Error('FilesystemWrapper requires at least one allowed path for security');
    }
  }

  /**
   * Check if a path is within allowed directories
   */
  private isPathAllowed(targetPath: string): boolean {
    const resolved = path.resolve(targetPath);
    return this.allowedPaths.some(allowed => resolved.startsWith(allowed));
  }

  /**
   * List files and directories in a path
   *
   * @param dirPath - Directory to list
   * @returns Array of file information
   */
  async listDirectory(dirPath: string): Promise<FileInfo[]> {
    if (!this.isPathAllowed(dirPath)) {
      throw new Error(`Access denied: ${dirPath} is not in allowed paths`);
    }

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const fileInfos: FileInfo[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const stats = await fs.stat(fullPath);

      fileInfos.push({
        name: entry.name,
        path: fullPath,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        modified: stats.mtime,
      });
    }

    return fileInfos;
  }

  /**
   * Read file contents
   *
   * @param filePath - File to read
   * @param encoding - File encoding (default: utf-8)
   * @returns File contents
   */
  async readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
    if (!this.isPathAllowed(filePath)) {
      throw new Error(`Access denied: ${filePath} is not in allowed paths`);
    }

    return fs.readFile(filePath, encoding);
  }

  /**
   * Write file contents
   *
   * @param filePath - File to write
   * @param content - Content to write
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    if (!this.isPathAllowed(filePath)) {
      throw new Error(`Access denied: ${filePath} is not in allowed paths`);
    }

    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Check if file or directory exists
   *
   * @param targetPath - Path to check
   * @returns True if exists
   */
  async exists(targetPath: string): Promise<boolean> {
    if (!this.isPathAllowed(targetPath)) {
      return false;
    }

    try {
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create directory
   *
   * @param dirPath - Directory to create
   * @param recursive - Create parent directories if needed
   */
  async createDirectory(dirPath: string, recursive: boolean = true): Promise<void> {
    if (!this.isPathAllowed(dirPath)) {
      throw new Error(`Access denied: ${dirPath} is not in allowed paths`);
    }

    await fs.mkdir(dirPath, { recursive });
  }

  /**
   * Delete file or directory
   *
   * @param targetPath - Path to delete
   * @param recursive - Delete directory and contents
   */
  async delete(targetPath: string, recursive: boolean = false): Promise<void> {
    if (!this.isPathAllowed(targetPath)) {
      throw new Error(`Access denied: ${targetPath} is not in allowed paths`);
    }

    const stats = await fs.stat(targetPath);

    if (stats.isDirectory()) {
      await fs.rmdir(targetPath, { recursive });
    } else {
      await fs.unlink(targetPath);
    }
  }

  /**
   * Search for files matching pattern
   *
   * @param dirPath - Directory to search
   * @param pattern - RegExp pattern to match filenames
   * @param recursive - Search subdirectories
   * @returns Array of matching file paths
   */
  async search(dirPath: string, pattern: RegExp, recursive: boolean = false): Promise<string[]> {
    if (!this.isPathAllowed(dirPath)) {
      throw new Error(`Access denied: ${dirPath} is not in allowed paths`);
    }

    const results: string[] = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (pattern.test(entry.name)) {
        results.push(fullPath);
      }

      if (recursive && entry.isDirectory()) {
        const subResults = await this.search(fullPath, pattern, true);
        results.push(...subResults);
      }
    }

    return results;
  }

  /**
   * Get file or directory stats
   *
   * @param targetPath - Path to get stats for
   * @returns File stats
   */
  async getStats(targetPath: string): Promise<{
    size: number;
    created: Date;
    modified: Date;
    accessed: Date;
    isDirectory: boolean;
    isFile: boolean;
  }> {
    if (!this.isPathAllowed(targetPath)) {
      throw new Error(`Access denied: ${targetPath} is not in allowed paths`);
    }

    const stats = await fs.stat(targetPath);

    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
    };
  }
}

// Export convenience functions with default allowed paths
const DEFAULT_ALLOWED_PATHS = [
  process.env.HOME + '/Desktop',
  process.env.HOME + '/Documents',
  process.env.HOME + '/Downloads',
];

export async function listFiles(dirPath: string): Promise<FileInfo[]> {
  const wrapper = new FilesystemWrapper(DEFAULT_ALLOWED_PATHS);
  return wrapper.listDirectory(dirPath);
}

export async function readFileContents(filePath: string): Promise<string> {
  const wrapper = new FilesystemWrapper(DEFAULT_ALLOWED_PATHS);
  return wrapper.readFile(filePath);
}

export async function writeFileContents(filePath: string, content: string): Promise<void> {
  const wrapper = new FilesystemWrapper(DEFAULT_ALLOWED_PATHS);
  return wrapper.writeFile(filePath, content);
}
