import React, { useState } from 'react';
import { ExternalLink, Eye, Trash2, Tag, X, Check, Clock } from 'lucide-react';
import type { Bookmark } from '@/types';
import { useStore } from '@/stores/appStore';
import { getSummaryPlainText } from '@/lib/summary';

interface BookmarkCardProps {
  bookmark: Bookmark;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  onOpenPreview?: (bookmark: Bookmark) => void;
}

export default function BookmarkCard({
  bookmark,
  selectionMode,
  selected,
  onToggleSelect,
  onOpenPreview,
}: BookmarkCardProps) {
  const { deleteBookmark, updateBookmark } = useStore();
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [tagsExpanded, setTagsExpanded] = useState(false);

  const handleOpen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    chrome.tabs.create({ url: bookmark.url });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个书签吗？')) {
      deleteBookmark(bookmark.id);
    }
  };

  const handleCardClick = () => {
    if (selectionMode && onToggleSelect) {
      onToggleSelect(bookmark.id);
      return;
    }
    onOpenPreview?.(bookmark);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !bookmark.tags.includes(newTag.trim())) {
      updateBookmark({
        ...bookmark,
        tags: [...bookmark.tags, newTag.trim()],
        updatedAt: Date.now(),
      });
    }
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    updateBookmark({
      ...bookmark,
      tags: bookmark.tags.filter((t) => t !== tag),
      updatedAt: Date.now(),
    });
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const summaryPreview = getSummaryPlainText(bookmark.summary);

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white dark:bg-slate-800 rounded-xl p-3 border shadow-sm hover:shadow-md transition-all cursor-pointer group ${
        selected
          ? 'border-primary-400 ring-2 ring-primary-500/20'
          : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
      }`}
    >
      <div className="flex items-start gap-3">
        {selectionMode && (
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors mt-1 shrink-0 ${
              selected ? 'border-primary-500 bg-primary-500' : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            {selected && <Check className="w-3 h-3 text-white" />}
          </div>
        )}

        {bookmark.favicon ? (
          <img
            src={bookmark.favicon}
            alt=""
            className="w-8 h-8 rounded-lg object-contain bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
            <ExternalLink className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-slate-800 dark:text-white text-sm leading-snug line-clamp-2">
              {bookmark.title}
            </h3>

            {!selectionMode && (
              <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenPreview?.(bookmark); }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title="查看详情"
                  aria-label="查看书签详情"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                </button>
                <button
                  onClick={(e) => handleOpen(e)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title="打开网页"
                  aria-label="打开原网页"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(e); }}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="删除"
                  aria-label="删除书签"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 hover:text-red-500" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-slate-500 dark:text-slate-400">{getDomain(bookmark.url)}</span>
            {bookmark.readingTime && (
              <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                <Clock className="w-3 h-3" />
                {bookmark.readingTime} 分钟
              </span>
            )}
          </div>

          {summaryPreview && bookmark.summary !== '正在生成摘要...' && (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {summaryPreview}
            </p>
          )}

          {(bookmark.tags.length > 0 || showTagEditor) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(tagsExpanded ? bookmark.tags : bookmark.tags.slice(0, 2)).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs rounded-full"
                >
                  {tag}
                  {showTagEditor && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag); }}
                      aria-label={`移除标签 ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
              {bookmark.tags.length > 2 && !tagsExpanded && (
                <button
                  onClick={(e) => { e.stopPropagation(); setTagsExpanded(true); }}
                  className="text-xs text-slate-400 dark:text-slate-500 hover:text-primary-500 transition-colors"
                >
                  +{bookmark.tags.length - 2} 更多
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setShowTagEditor(true); }}
                className="text-xs text-slate-400 dark:text-slate-500 hover:text-primary-500 transition-colors flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
              </button>
            </div>
          )}

          {showTagEditor && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') handleAddTag();
                  if (e.key === 'Escape') setShowTagEditor(false);
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="输入标签"
                autoFocus
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
              <button
                onClick={(e) => { e.stopPropagation(); setShowTagEditor(false); }}
                className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                取消
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
