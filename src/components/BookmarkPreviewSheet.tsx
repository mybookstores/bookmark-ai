import {
  Clock,
  ExternalLink,
  FolderOpen,
  Tag,
  Trash2,
  X,
  ChevronDown,
  Share2,
  Edit3,
  Check,
  StickyNote,
  Link,
  Image,
} from 'lucide-react';
import type { Bookmark, Folder } from '@/types';
import SummaryMarkdown from '@/components/SummaryMarkdown';
import { normalizeSummary } from '@/lib/summary';
import { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { getSummaryPlainText } from '@/lib/summary';

interface BookmarkPreviewSheetProps {
  bookmark: Bookmark;
  folder?: Folder;
  onClose: () => void;
  onOpen: () => void;
  onDelete: () => void;
  onUpdate: (bookmark: Bookmark) => void;
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export default function BookmarkPreviewSheet({
  bookmark,
  folder,
  onClose,
  onOpen,
  onDelete,
  onUpdate,
}: BookmarkPreviewSheetProps) {
  const summary = normalizeSummary(bookmark.summary);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [notes, setNotes] = useState(bookmark.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotes(bookmark.notes || '');
  }, [bookmark.notes]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showShareMenu]);

  const handleSaveNotes = () => {
    onUpdate({ ...bookmark, notes, updatedAt: Date.now() });
    setIsEditingNotes(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookmark.url);
      setShowShareMenu(false);
      // 通知父组件显示提示
      const event = new CustomEvent('bookmark-toast', { detail: { message: '链接已复制', type: 'success' } });
      document.dispatchEvent(event);
    } catch {
      console.error('Failed to copy link');
    }
  };

  const handleShareApi = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: bookmark.title,
          text: summary || bookmark.title,
          url: bookmark.url,
        });
        const event = new CustomEvent('bookmark-toast', { detail: { message: '分享成功', type: 'success' } });
        document.dispatchEvent(event);
      } catch {
        // 用户取消分享
      }
    }
    setShowShareMenu(false);
  };

  const handleGenerateShareCard = async () => {
    if (!shareCardRef.current) return;
    setIsGeneratingImage(true);
    setShowShareMenu(false);
    try {
      // 临时显示卡片用于截图
      const card = shareCardRef.current;
      card.style.left = '0';
      card.style.top = '0';

      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await toPng(card, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        filter: (node) => {
          // 排除关闭按钮等非分享内容
          return !node.classList?.contains('share-card-hidden');
        },
      });

      // 隐藏卡片
      card.style.left = '-9999px';
      card.style.top = '0';

      const link = document.createElement('a');
      link.download = `bookmark-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      const event = new CustomEvent('bookmark-toast', { detail: { message: '分享卡片已保存', type: 'success' } });
      document.dispatchEvent(event);
    } catch (error) {
      console.error('Failed to generate image:', error);
      const event = new CustomEvent('bookmark-toast', { detail: { message: '生成失败，请重试', type: 'error' } });
      document.dispatchEvent(event);
    }
    setIsGeneratingImage(false);
  };

  return (
    <div className="fixed inset-0 z-40 animate-fade-in flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="bookmark-preview-title">
      <button
        className="absolute inset-0 bg-slate-950/40 -z-10"
        onClick={onClose}
        aria-label="关闭预览"
      />

      <div className="w-full max-w-lg max-h-[90vh] overflow-hidden rounded-t-3xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
        <div className="flex justify-center pt-2 pb-1 shrink-0">
          <div className="h-1 w-8 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        <div className="flex items-start gap-3 px-4 py-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="min-w-0 flex-1">
            <h2 id="bookmark-preview-title" className="text-[15px] font-semibold leading-snug text-slate-900 dark:text-white line-clamp-2">
              {bookmark.title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500 truncate">{getDomain(bookmark.url)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="关闭详情"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 overscroll-contain">
          <div className="space-y-2">
            {/* Meta pills */}
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" />
                {bookmark.readingTime || 1} 分钟阅读
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {formatTime(bookmark.createdAt)}
              </span>
              {folder && (
                <span
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: folder.color + '20', color: folder.color }}
                >
                  <FolderOpen className="w-3 h-3" />
                  {folder.name}
                </span>
              )}
            </div>

            {/* OG Image */}
            {bookmark.ogImage && (
              <div className="rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={bookmark.ogImage}
                  alt={`${bookmark.title} 预览图`}
                  className="w-full object-contain max-h-36"
                />
              </div>
            )}

            {/* AI Summary */}
            <section className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">AI 摘要</h3>
                {summary && (
                  <span className="text-xs text-primary-500 font-medium">已生成</span>
                )}
              </div>
              {summary ? (
                <SummaryMarkdown content={summary} />
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500">暂无摘要</p>
              )}
            </section>

            {/* Tags */}
            {bookmark.tags.length > 0 && (
              <section className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    标签
                  </h3>
                  {bookmark.tags.length > 6 && (
                    <button
                      onClick={() => setTagsExpanded(!tagsExpanded)}
                      className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-0.5"
                    >
                      {tagsExpanded ? '收起' : `更多 ${bookmark.tags.length - 6}`}
                      <ChevronDown className={`w-3 h-3 transition-transform ${tagsExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {(tagsExpanded ? bookmark.tags : bookmark.tags.slice(0, 6)).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Notes */}
            <section className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <StickyNote className="w-3 h-3" />
                  笔记
                </h3>
                {!isEditingNotes && (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-0.5"
                  >
                    <Edit3 className="w-3 h-3" />
                    {notes ? '编辑' : '添加'}
                  </button>
                )}
              </div>
              {isEditingNotes ? (
                <div className="space-y-2">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="添加你的笔记..."
                    className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => { setNotes(bookmark.notes || ''); setIsEditingNotes(false); }}
                      className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveNotes}
                      className="px-3 py-1 text-xs bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                  {notes || <span className="text-slate-400 dark:text-slate-500 italic">暂无笔记</span>}
                </p>
              )}
            </section>

            {/* URL */}
            <a
              href={bookmark.url}
              target="_blank"
              rel="noreferrer"
              className="block text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 truncate px-1"
            >
              {bookmark.url}
            </a>
          </div>
        </div>

        <div className="shrink-0 px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex gap-2">
            <button
              onClick={onOpen}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              打开原网页
            </button>
            <div className="relative" ref={shareMenuRef}>
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                aria-label="分享"
              >
                <Share2 className="w-4 h-4" />
              </button>
              {showShareMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-50">
                  <button
                    onClick={handleGenerateShareCard}
                    disabled={isGeneratingImage}
                    className="w-full px-3 py-2.5 text-sm text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    <Image className="w-4 h-4 text-slate-400" />
                    {isGeneratingImage ? '生成中...' : '生成分享卡片'}
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="w-full px-3 py-2.5 text-sm text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Link className="w-4 h-4 text-slate-400" />
                    复制链接
                  </button>
                  {'share' in navigator && (
                    <button
                      onClick={handleShareApi}
                      className="w-full px-3 py-2.5 text-sm text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Share2 className="w-4 h-4 text-slate-400" />
                      分享到...
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={onDelete}
              className="px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-900 text-red-500 text-sm flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              aria-label="删除书签"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Share card template - positioned off-screen but visible for html-to-image */}
        <div
          ref={shareCardRef}
          style={{
            position: 'absolute',
            left: '-9999px',
            top: 0,
            width: '400px',
            padding: '24px',
            backgroundColor: '#ffffff',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ width: '24px', height: '24px', background: 'linear-gradient(135deg, #0284c7, #7c3aed)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>B</span>
            </div>
            <span style={{ fontSize: '14px', color: '#64748b' }}>BookmarkAI</span>
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '8px', lineHeight: '1.4' }}>{bookmark.title}</h2>

          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bookmark.url}</p>

          {summary && (
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>{getSummaryPlainText(summary)}</p>
            </div>
          )}

          {bookmark.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {bookmark.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '9999px' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div style={{ fontSize: '12px', color: '#94a3b8' }}>saved with BookmarkAI</div>
        </div>
      </div>
    </div>
  );
}