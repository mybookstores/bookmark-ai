import type { Bookmark } from '@/types';
import { generateId } from '@/lib/ai';

export interface ImportedBookmark {
  url: string;
  title: string;
  addedAt?: number;
}

export function parseBookmarksHtml(html: string): ImportedBookmark[] {
  const results: ImportedBookmark[] = [];
  const anchorRegex = /<A\s+HREF="([^"]+)"[^>]*>([^<]+)<\/A>/gi;
  let match;

  while ((match = anchorRegex.exec(html)) !== null) {
    const url = match[1];
    const title = decodeHtmlEntities(match[2].trim());

    if (url && title && url.startsWith('http')) {
      results.push({ url, title });
    }
  }

  return results;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

export function bookmarksHtmlToBookmarks(items: ImportedBookmark[]): Bookmark[] {
  return items.map((item) => ({
    id: generateId(),
    url: item.url,
    title: item.title,
    tags: [],
    createdAt: item.addedAt || Date.now(),
    updatedAt: Date.now(),
  }));
}