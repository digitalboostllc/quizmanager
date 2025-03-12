import fs from 'fs/promises';
import path from 'path';

/**
 * Lists all HTML files in the debug directory
 */
export async function listDebugHtmlFiles(): Promise<string[]> {
  try {
    const debugDir = path.join(process.cwd(), 'debug');
    const files = await fs.readdir(debugDir);
    return files.filter(file => file.endsWith('.html'));
  } catch (error) {
    console.error('Error listing debug HTML files:', error);
    return [];
  }
}

/**
 * Reads an HTML file from the debug directory
 */
export async function readDebugHtmlFile(filename: string): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), 'debug', filename);
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading debug HTML file ${filename}:`, error);
    return null;
  }
}

/**
 * Analyzes HTML files in the debug directory
 * Returns information about each file including size, creation time, and a content summary
 */
export async function analyzeDebugHtmlFiles(): Promise<Array<{
  filename: string;
  size: number;
  createdAt: Date;
  contentSummary: string;
}>> {
  try {
    const files = await listDebugHtmlFiles();
    const results = [];

    for (const filename of files) {
      const filePath = path.join(process.cwd(), 'debug', filename);
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Extract a summary of the content
      const bodyMatch = content.match(/<body>(.*?)<\/body>/s);
      const bodySummary = bodyMatch 
        ? bodyMatch[1].substring(0, 100) + '...' 
        : 'No body content found';

      results.push({
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
        contentSummary: bodySummary
      });
    }

    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error analyzing debug HTML files:', error);
    return [];
  }
}

/**
 * Cleans up old HTML files in the debug directory
 * Keeps only the most recent 'keep' files
 */
export async function cleanupDebugHtmlFiles(keep: number = 10): Promise<number> {
  try {
    const files = await listDebugHtmlFiles();
    if (files.length <= keep) return 0;

    const fileStats = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(process.cwd(), 'debug', filename);
        const stats = await fs.stat(filePath);
        return { filename, createdAt: stats.birthtime };
      })
    );

    // Sort by creation time (newest first)
    fileStats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Delete older files
    const filesToDelete = fileStats.slice(keep);
    await Promise.all(
      filesToDelete.map(async ({ filename }) => {
        const filePath = path.join(process.cwd(), 'debug', filename);
        await fs.unlink(filePath);
      })
    );

    return filesToDelete.length;
  } catch (error) {
    console.error('Error cleaning up debug HTML files:', error);
    return 0;
  }
} 