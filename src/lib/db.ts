import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Bookmark, Settings, Folder } from '@/types';
import { defaultSettings } from '@/types';

interface StoredSettings {
  key: string;
  value: Settings;
}

interface BookmarkDB extends DBSchema {
  bookmarks: {
    key: string;
    value: Bookmark;
    indexes: {
      'by-url': string;
      'by-created': number;
      'by-tags': string;
      'by-folder': string;
    };
  };
  folders: {
    key: string;
    value: Folder;
  };
  settings: {
    key: string;
    value: StoredSettings;
  };
}

const DB_NAME = 'bookmark-ai';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<BookmarkDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<BookmarkDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<BookmarkDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const bookmarkStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
        bookmarkStore.createIndex('by-url', 'url');
        bookmarkStore.createIndex('by-created', 'createdAt');
        bookmarkStore.createIndex('by-tags', 'tags');
        bookmarkStore.createIndex('by-folder', 'folderId');
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('folders')) {
          db.createObjectStore('folders', { keyPath: 'id' });
        }
      }
    },
  });

  return dbInstance;
}

export async function saveBookmark(bookmark: Bookmark): Promise<void> {
  const db = await getDB();
  await db.put('bookmarks', bookmark);
}

export async function getBookmark(id: string): Promise<Bookmark | undefined> {
  const db = await getDB();
  return db.get('bookmarks', id);
}

export async function getAllBookmarks(): Promise<Bookmark[]> {
  const db = await getDB();
  const bookmarks = await db.getAllFromIndex('bookmarks', 'by-created');
  return bookmarks.reverse();
}

export async function getBookmarksByFolder(folderId: string | null): Promise<Bookmark[]> {
  const db = await getDB();
  if (folderId === null) {
    return getAllBookmarks();
  }
  const bookmarks = await db.getAllFromIndex('bookmarks', 'by-folder', folderId);
  return bookmarks.reverse();
}

export async function deleteBookmark(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('bookmarks', id);
}

export async function searchBookmarks(query: string): Promise<Bookmark[]> {
  const allBookmarks = await getAllBookmarks();
  const lowerQuery = query.toLowerCase();

  return allBookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(lowerQuery) ||
      b.url.toLowerCase().includes(lowerQuery) ||
      b.summary?.toLowerCase().includes(lowerQuery) ||
      b.tags.some((t) => t.toLowerCase().includes(lowerQuery))
  );
}

export async function getBookmarkByUrl(url: string): Promise<Bookmark | undefined> {
  const db = await getDB();
  return db.getFromIndex('bookmarks', 'by-url', url);
}

// Folder operations
export async function saveFolder(folder: Folder): Promise<void> {
  const db = await getDB();
  await db.put('folders', folder);
}

export async function getAllFolders(): Promise<Folder[]> {
  const db = await getDB();
  return db.getAll('folders');
}

export async function deleteFolder(id: string): Promise<void> {
  const db = await getDB();
  // Move bookmarks to uncategorized
  const bookmarks = await db.getAllFromIndex('bookmarks', 'by-folder', id);
  for (const bookmark of bookmarks) {
    await db.put('bookmarks', { ...bookmark, folderId: undefined });
  }
  await db.delete('folders', id);
}

export async function getSettings(): Promise<Settings> {
  const db = await getDB();
  const stored = await db.get('settings', 'user-settings');
  return stored?.value || defaultSettings;
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key: 'user-settings', value: settings });
}