import type { Bookmark } from '@/types';
import { getBookmarkByUrl, getSettings, saveBookmark } from '@/lib/db';
import { estimateReadingTime, extractPageContent, generateId, generateSummary, generateTags } from '@/lib/ai';

export interface SaveBookmarkResult {
  bookmark: Bookmark;
  generatedSummary: boolean;
  isDuplicate: boolean;
}

function getDomainTitle(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function buildBookmark(input: Partial<Bookmark> & Pick<Bookmark, 'url' | 'title'>): Bookmark {
  const now = Date.now();
  return {
    id: input.id || generateId(),
    url: input.url,
    title: input.title,
    excerpt: input.excerpt,
    summary: input.summary,
    favicon: input.favicon,
    tags: input.tags || [],
    folderId: input.folderId,
    createdAt: input.createdAt || now,
    updatedAt: now,
    readingTime: input.readingTime,
    ogImage: input.ogImage,
  };
}

export async function saveCurrentTabBookmark(tab: chrome.tabs.Tab, folderId?: string | null): Promise<SaveBookmarkResult> {
  if (!tab.id || !tab.url) {
    throw new Error('当前标签页无效');
  }

  // 检查重复
  const existing = await getBookmarkByUrl(tab.url);
  if (existing) {
    return { bookmark: existing, generatedSummary: Boolean(existing.summary), isDuplicate: true };
  }

  const settings = await getSettings();
  const extracted = await extractPageContent(tab.id, {
    title: tab.title,
    favIconUrl: tab.favIconUrl,
  });

  let bookmark = buildBookmark({
    url: tab.url,
    title: extracted.title || tab.title || getDomainTitle(tab.url),
    excerpt: extracted.content.slice(0, 300),
    favicon: extracted.favicon || tab.favIconUrl,
    ogImage: extracted.ogImage,
    tags: [],
    folderId: folderId || undefined,
    readingTime: estimateReadingTime(extracted.content),
  });

  // 自动生成摘要
  if (settings.autoSummary && settings.apiKey && (extracted.content || bookmark.title)) {
    const summary = await generateSummary(extracted.content, bookmark.title, settings);
    bookmark = { ...bookmark, summary, updatedAt: Date.now() };

    // 自动生成标签
    const tags = await generateTags(extracted.content, bookmark.title, settings);
    if (tags.length > 0) {
      bookmark = { ...bookmark, tags, updatedAt: Date.now() };
    }
  }

  await saveBookmark(bookmark);
  return { bookmark, generatedSummary: Boolean(bookmark.summary), isDuplicate: false };
}

export async function saveLinkBookmark(
  linkUrl: string,
  linkText?: string | null,
  sourceTab?: chrome.tabs.Tab
): Promise<SaveBookmarkResult> {
  const existing = await getBookmarkByUrl(linkUrl);
  if (existing) {
    return { bookmark: existing, generatedSummary: Boolean(existing.summary), isDuplicate: true };
  }

  const bookmark = buildBookmark({
    url: linkUrl,
    title: linkText?.trim() || getDomainTitle(linkUrl),
    favicon: sourceTab?.favIconUrl,
    excerpt: linkUrl,
    tags: [],
  });

  await saveBookmark(bookmark);
  return { bookmark, generatedSummary: false, isDuplicate: false };
}

export async function saveSelectionBookmark(
  pageUrl: string,
  pageTitle: string,
  selectionText: string,
  sourceTab?: chrome.tabs.Tab
): Promise<SaveBookmarkResult> {
  const bookmark = buildBookmark({
    url: pageUrl,
    title: selectionText.slice(0, 200),
    excerpt: selectionText.slice(0, 300),
    favicon: sourceTab?.favIconUrl,
    tags: [],
  });

  await saveBookmark(bookmark);
  return { bookmark, generatedSummary: false, isDuplicate: false };
}
