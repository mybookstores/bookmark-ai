import { create } from 'zustand';
import type { Bookmark, Settings, Folder, SortBy } from '@/types';
import { defaultSettings } from '@/types';
import * as db from '@/lib/db';

interface AppState {
  bookmarks: Bookmark[];
  folders: Folder[];
  settings: Settings;
  isLoading: boolean;
  searchQuery: string;
  selectedTags: string[];
  selectedFolderId: string | null;
  isDarkMode: boolean;
  sortBy: SortBy;

  loadBookmarks: () => Promise<void>;
  loadFolders: () => Promise<void>;
  addBookmark: (bookmark: Bookmark) => Promise<void>;
  deleteBookmarks: (ids: string[]) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
  updateBookmark: (bookmark: Bookmark) => Promise<void>;
  batchUpdateBookmarks: (ids: string[], updates: Partial<Bookmark>) => Promise<void>;
  addFolder: (folder: Folder) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setSelectedFolderId: (folderId: string | null) => void;
  setSortBy: (sortBy: SortBy) => void;
  toggleTag: (tag: string) => void;
  getAllTags: () => Array<{ tag: string; count: number }>;
  renameTag: (oldTag: string, newTag: string) => Promise<void>;
  deleteTag: (tag: string) => Promise<void>;
  getFilteredBookmarks: () => Bookmark[];
  getFolderStats: () => Array<Folder & { count: number }>;
  exportBookmarks: () => string;
  importBookmarks: (json: string) => Promise<number>;
  setDarkMode: (dark: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  bookmarks: [],
  folders: [],
  settings: defaultSettings,
  isLoading: false,
  searchQuery: '',
  selectedTags: [],
  selectedFolderId: null,
  isDarkMode: false,
  sortBy: 'createdDesc',

  loadBookmarks: async () => {
    set({ isLoading: true });
    const bookmarks = await db.getAllBookmarks();
    set({ bookmarks, isLoading: false });
  },

  loadFolders: async () => {
    const folders = await db.getAllFolders();
    set({ folders });
  },

  addBookmark: async (bookmark) => {
    await db.saveBookmark(bookmark);
    set((state) => ({ bookmarks: [bookmark, ...state.bookmarks] }));
  },

  deleteBookmarks: async (ids) => {
    await Promise.all(ids.map((id) => db.deleteBookmark(id)));
    const idSet = new Set(ids);
    set((state) => ({
      bookmarks: state.bookmarks.filter((b) => !idSet.has(b.id)),
    }));
  },

  deleteBookmark: async (id) => {
    await db.deleteBookmark(id);
    set((state) => ({
      bookmarks: state.bookmarks.filter((b) => b.id !== id),
    }));
  },

  updateBookmark: async (bookmark) => {
    await db.saveBookmark(bookmark);
    set((state) => ({
      bookmarks: state.bookmarks.map((b) => (b.id === bookmark.id ? bookmark : b)),
    }));
  },

  batchUpdateBookmarks: async (ids, updates) => {
    const idSet = new Set(ids);
    const updatedBookmarks = get().bookmarks.map((b) => {
      if (idSet.has(b.id)) {
        const updated = { ...b, ...updates, updatedAt: Date.now() };
        void db.saveBookmark(updated);
        return updated;
      }
      return b;
    });
    set({ bookmarks: updatedBookmarks });
  },

  addFolder: async (folder) => {
    await db.saveFolder(folder);
    set((state) => ({ folders: [...state.folders, folder] }));
  },

  deleteFolder: async (id) => {
    await db.deleteFolder(id);
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== id),
      bookmarks: state.bookmarks.map((b) =>
        b.folderId === id ? { ...b, folderId: undefined } : b
      ),
      selectedFolderId: state.selectedFolderId === id ? null : state.selectedFolderId,
    }));
  },

  loadSettings: async () => {
    const settings = await db.getSettings();
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    set({ settings, isDarkMode: isDark });
  },

  updateSettings: async (newSettings) => {
    const settings = { ...get().settings, ...newSettings };
    await db.saveSettings(settings);
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    set({ settings, isDarkMode: isDark });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedTags: (tags) => set({ selectedTags: tags }),
  setSelectedFolderId: (folderId) => set({ selectedFolderId: folderId }),
  setSortBy: (sortBy) => set({ sortBy }),

  toggleTag: (tag) => {
    const { selectedTags } = get();
    if (selectedTags.includes(tag)) {
      set({ selectedTags: selectedTags.filter((t) => t !== tag) });
    } else {
      set({ selectedTags: [...selectedTags, tag] });
    }
  },

  getAllTags: () => {
    const { bookmarks } = get();
    const tagCount = new Map<string, number>();
    bookmarks.forEach((b) => {
      b.tags.forEach((t) => tagCount.set(t, (tagCount.get(t) || 0) + 1));
    });
    return Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  },

  renameTag: async (oldTag, newTag) => {
    const { bookmarks } = get();
    const updatedBookmarks = bookmarks.map((b) => {
      if (b.tags.includes(oldTag)) {
        const updated = {
          ...b,
          tags: b.tags.map((t) => (t === oldTag ? newTag : t)),
          updatedAt: Date.now(),
        };
        void db.saveBookmark(updated);
        return updated;
      }
      return b;
    });
    set({ bookmarks: updatedBookmarks });
  },

  deleteTag: async (tag) => {
    const { bookmarks } = get();
    const updatedBookmarks = bookmarks.map((b) => {
      if (b.tags.includes(tag)) {
        const updated = {
          ...b,
          tags: b.tags.filter((t) => t !== tag),
          updatedAt: Date.now(),
        };
        void db.saveBookmark(updated);
        return updated;
      }
      return b;
    });
    set({ bookmarks: updatedBookmarks });
  },

  getFilteredBookmarks: () => {
    const { bookmarks, searchQuery, selectedTags, selectedFolderId, sortBy } = get();
    let filtered = bookmarks;

    if (selectedFolderId) {
      filtered = filtered.filter((b) => b.folderId === selectedFolderId);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.url.toLowerCase().includes(query) ||
          b.summary?.toLowerCase().includes(query) ||
          b.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((b) => selectedTags.some((t) => b.tags.includes(t)));
    }

    // 排序
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'createdDesc':
          return b.createdAt - a.createdAt;
        case 'createdAsc':
          return a.createdAt - b.createdAt;
        case 'updatedDesc':
          return b.updatedAt - a.updatedAt;
        case 'titleAsc':
          return a.title.localeCompare(b.title);
        case 'domain':
          const domainA = a.url ? new URL(a.url).hostname : '';
          const domainB = b.url ? new URL(b.url).hostname : '';
          return domainA.localeCompare(domainB);
        default:
          return 0;
      }
    });

    return filtered;
  },

  getFolderStats: () => {
    const { folders, bookmarks } = get();
    return folders.map((folder) => ({
      ...folder,
      count: bookmarks.filter((b) => b.folderId === folder.id).length,
    }));
  },

  exportBookmarks: () => {
    const { bookmarks, folders } = get();
    return JSON.stringify({ bookmarks, folders, exportedAt: Date.now() }, null, 2);
  },

  importBookmarks: async (json) => {
    try {
      const data = JSON.parse(json);
      const importedBookmarks = Array.isArray(data) ? data : data.bookmarks || [];
      const importedFolders = data.folders || [];

      for (const folder of importedFolders) {
        await db.saveFolder(folder);
      }

      let count = 0;
      for (const b of importedBookmarks) {
        if (b.url && b.title) {
          await db.saveBookmark({
            ...b,
            id: b.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: b.createdAt || Date.now(),
            updatedAt: Date.now(),
          });
          count++;
        }
      }
      await get().loadBookmarks();
      await get().loadFolders();
      return count;
    } catch {
      return 0;
    }
  },

  setDarkMode: (dark) => set({ isDarkMode: dark }),
}));