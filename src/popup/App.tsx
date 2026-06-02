import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useStore } from '@/stores/appStore';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import BookmarkList from '@/components/BookmarkList';
import SettingsPanel from '@/components/SettingsPanel';
import EmptyState from '@/components/EmptyState';
import { Sparkles, CheckSquare, Square, FolderOpen, ChevronDown, Folder } from 'lucide-react';
import TagFilter from '@/components/TagFilter';
import BatchActions from '@/components/BatchActions';
import FolderSidebar from '@/components/FolderSidebar';
import StatsBar from '@/components/StatsBar';
import Onboarding from '@/components/Onboarding';
import BookmarkPreviewSheet from '@/components/BookmarkPreviewSheet';
import { useToast } from '@/components/Toast';
import type { Bookmark, Folder as FolderType } from '@/types';
import { getActiveTab } from '@/lib/ai';
import { saveCurrentTabBookmark } from '@/lib/bookmarkSaver';

export default function App() {
  const {
    loadBookmarks,
    loadFolders,
    loadSettings,
    bookmarks,
    folders,
    settings,
    updateBookmark,
    updateSettings,
    deleteBookmark,
  } = useStore();
  const { toast, dismissToast } = useToast();
  const [showSettings, setShowSettings] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeBookmark, setActiveBookmark] = useState<Bookmark | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const folderMenuRef = useRef<HTMLDivElement>(null);

  const selectedFolder = useMemo(
    () => folders.find((f) => f.id === selectedFolderId) || null as FolderType | null,
    [folders, selectedFolderId]
  );

  useEffect(() => {
    loadBookmarks();
    loadFolders();
    loadSettings();
  }, [loadBookmarks, loadFolders, loadSettings]);

  useEffect(() => {
    const handleRuntimeMessage = (message: { type?: string }) => {
      if (message?.type === 'bookmark-saved') {
        loadBookmarks();
        toast('书签已通过右键菜单保存', 'success');
      }
    };

    const handleBookmarkToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type: 'success' | 'error' | 'info' }>;
      toast(customEvent.detail.message, customEvent.detail.type);
    };

    chrome.runtime.onMessage.addListener(handleRuntimeMessage);
    document.addEventListener('bookmark-toast', handleBookmarkToast);

    return () => {
      chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
      document.removeEventListener('bookmark-toast', handleBookmarkToast);
    };
  }, [loadBookmarks, toast]);

  // 点击外部关闭文件夹菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (folderMenuRef.current && !folderMenuRef.current.contains(e.target as Node)) {
        setShowFolderMenu(false);
      }
    };
    if (showFolderMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFolderMenu]);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void handleSaveCurrentPage();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        const input = document.querySelector('input[placeholder="搜索书签..."]') as HTMLInputElement | null;
        input?.focus();
      }
      if (e.key === 'Escape' && activeBookmark) {
        setActiveBookmark(null);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [activeBookmark]);

  const previewFolder = useMemo(
    () => folders.find((folder) => folder.id === activeBookmark?.folderId),
    [folders, activeBookmark?.folderId]
  );

  const handleSaveCurrentPage = async () => {
    const loadingToastId = toast('正在保存并生成摘要...', 'loading');

    try {
      const tab = await getActiveTab();
      if (!tab?.id || !tab.url) {
        dismissToast(loadingToastId);
        toast('无法获取当前页面内容', 'error');
        return;
      }

      const result = await saveCurrentTabBookmark(tab, selectedFolderId);
      await loadBookmarks();
      dismissToast(loadingToastId);
      if (result.isDuplicate) {
        toast('该页面已保存过', 'info');
      } else {
        toast(result.generatedSummary ? '保存成功，AI 摘要已生成' : '书签已保存', 'success');
      }
    } catch (error) {
      console.error(error);
      dismissToast(loadingToastId);
      toast('保存失败，请稍后重试', 'error');
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedIds(new Set());
    setActiveBookmark(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBatchAddTag = (tag: string) => {
    const selectedBookmarks = bookmarks.filter((b) => selectedIds.has(b.id));
    selectedBookmarks.forEach((b) => {
      if (!b.tags.includes(tag)) {
        void updateBookmark({
          ...b,
          tags: [...b.tags, tag],
          updatedAt: Date.now(),
        });
      }
    });
    toast(`已为 ${selectedBookmarks.length} 个书签添加标签`, 'success');
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleFinishOnboarding = async () => {
    await updateSettings({ hasSeenOnboarding: true });
    toast('欢迎使用 BookmarkAI', 'success');
  };

  const handleDeleteFromPreview = async () => {
    if (!activeBookmark) return;
    if (!confirm('确定要删除这个书签吗？')) return;

    await deleteBookmark(activeBookmark.id);
    setActiveBookmark(null);
    toast('书签已删除', 'success');
  };

  const handleOpenBookmark = (bookmark: Bookmark) => {
    chrome.tabs.create({ url: bookmark.url });
  };

  if (!settings.hasSeenOnboarding) {
    return <Onboarding onFinish={handleFinishOnboarding} />;
  }

  if (showSettings) {
    return <SettingsPanel onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className="relative flex flex-col h-full min-h-0 bg-gradient-to-br from-slate-50 via-white to-primary-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <Header onSettings={() => setShowSettings(true)} />

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-4 pt-4 pb-4 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => void handleSaveCurrentPage()}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-700 hover:to-violet-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 text-sm transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" />
            保存当前页面
          </button>

          {/* 文件夹选择 */}
          <div className="relative" ref={folderMenuRef}>
            <button
              onClick={() => setShowFolderMenu(!showFolderMenu)}
              className="h-full px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 transition-colors flex items-center gap-1.5"
              title="选择文件夹"
            >
              {selectedFolder ? (
                <>
                  <FolderOpen className="w-4 h-4" style={{ color: selectedFolder.color }} />
                  <span className="text-xs max-w-[60px] truncate">{selectedFolder.name}</span>
                </>
              ) : (
                <Folder className="w-4 h-4" />
              )}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showFolderMenu && (
              <div className="absolute z-50 top-full right-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                <button
                  onClick={() => { setSelectedFolderId(null); setShowFolderMenu(false); }}
                  className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                    selectedFolderId === null ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Folder className="w-4 h-4 text-slate-400" />
                  不选择文件夹
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => { setSelectedFolderId(folder.id); setShowFolderMenu(false); }}
                    className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                      selectedFolderId === folder.id ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <FolderOpen className="w-4 h-4" style={{ color: folder.color }} />
                    {folder.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggleSelectionMode}
            className="py-3 px-4 rounded-xl font-medium flex items-center justify-center transition-colors text-sm border"
            style={{
              backgroundColor: selectionMode ? 'var(--color-primary, #0284c7)' : 'transparent',
              borderColor: selectionMode ? 'var(--color-primary, #0284c7)' : '#e2e8f0',
              color: selectionMode ? 'white' : '#64748b',
            }}
            title={selectionMode ? '退出选择模式' : '批量选择'}
          >
            {selectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          </button>
        </div>

        {selectionMode && selectedIds.size > 0 && (
          <BatchActions
            selected={Array.from(selectedIds)}
            onClear={() => setSelectedIds(new Set())}
            onAddTag={handleBatchAddTag}
          />
        )}

        <StatsBar />
        <FolderSidebar />

        <SearchBar />
        <TagFilter />

        {bookmarks.length === 0 ? (
          <EmptyState />
        ) : (
          <BookmarkList
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onOpenPreview={(bookmark) => setActiveBookmark(bookmark)}
          />
        )}
      </div>

      {activeBookmark && (
        <BookmarkPreviewSheet
          bookmark={activeBookmark}
          folder={previewFolder}
          onClose={() => setActiveBookmark(null)}
          onOpen={() => handleOpenBookmark(activeBookmark)}
          onDelete={() => void handleDeleteFromPreview()}
          onUpdate={(updated) => {
            updateBookmark(updated);
            setActiveBookmark(updated);
          }}
        />
      )}
    </div>
  );
}