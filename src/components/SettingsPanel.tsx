import React, { useState, useRef, useEffect } from 'react';
import { X, Key, Sparkles, Check, Sun, Moon, Monitor, Download, Upload, Trash2, Globe, ChevronDown, Tag } from 'lucide-react';
import { useStore } from '@/stores/appStore';
import type { Settings } from '@/types';
import { exportToMarkdown, exportToCsv, exportToBookmarksHtml } from '@/lib/exporters';
import { parseBookmarksHtml, bookmarksHtmlToBookmarks } from '@/lib/importers/bookmarksHtml';
import TagManager from '@/components/TagManager';

interface SettingsPanelProps {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { settings, updateSettings, exportBookmarks, importBookmarks, bookmarks } = useStore();
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [saved, setSaved] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportMenu]);

  const handleSave = async () => {
    await updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleProviderChange = (provider: Settings['apiProvider']) => {
    setLocalSettings((prev) => ({
      ...prev,
      apiProvider: provider,
      baseUrl: provider === 'custom' ? 'https://lanyiapi.com/v1' : prev.baseUrl,
    }));
  };

  const handleExport = async (format: 'json' | 'markdown' | 'csv' | 'html') => {
    setShowExportMenu(false);
    const date = new Date().toISOString().slice(0, 10);
    let content: string, filename: string, type: string;

    switch (format) {
      case 'markdown':
        content = exportToMarkdown(bookmarks);
        filename = `bookmarks-${date}.md`;
        type = 'text/markdown';
        break;
      case 'csv':
        content = exportToCsv(bookmarks);
        filename = `bookmarks-${date}.csv`;
        type = 'text/csv';
        break;
      case 'html':
        content = exportToBookmarksHtml(bookmarks);
        filename = `bookmarks-${date}.html`;
        type = 'text/html;charset=utf-8';
        break;
      default:
        content = exportBookmarks();
        filename = `bookmarks-${date}.json`;
        type = 'application/json';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    setImportStatus(`已导出 ${bookmarks.length} 个书签`);
    setTimeout(() => setImportStatus(''), 3000);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();

    let count = 0;
    if (file.name.endsWith('.html') || text.includes('NETSCAPE-Bookmark-file')) {
      const items = parseBookmarksHtml(text);
      const newBookmarks = bookmarksHtmlToBookmarks(items);
      for (const b of newBookmarks) {
        await importBookmarks(JSON.stringify([b]));
        count++;
      }
    } else {
      count = await importBookmarks(text);
    }

    setImportStatus(count > 0 ? `成功导入 ${count} 个书签` : '导入失败，请检查文件格式');
    setTimeout(() => setImportStatus(''), 3000);
    e.target.value = '';
  };

  const handleClearAll = async () => {
    if (confirm(`确定要删除所有 ${bookmarks.length} 个书签吗？此操作不可撤销`)) {
      const { deleteBookmarks } = useStore.getState();
      await deleteBookmarks(bookmarks.map((b) => b.id));
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">设置</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="关闭"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-4 pb-4 space-y-5">
        {/* Theme */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            外观
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'light', name: '浅色', icon: Sun },
              { id: 'dark', name: '深色', icon: Moon },
              { id: 'auto', name: '跟随系统', icon: Monitor },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setLocalSettings({ ...localSettings, theme: t.id as Settings['theme'] })}
                className={`py-2.5 px-3 text-sm rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                  localSettings.theme === t.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* AI Provider */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            AI 提供商
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'openai', name: 'OpenAI' },
              { id: 'anthropic', name: 'Claude' },
              { id: 'ollama', name: 'Ollama' },
              { id: 'custom', name: '自定义 API' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleProviderChange(p.id as Settings['apiProvider'])}
                className={`py-2 px-3 text-sm rounded-xl border transition-all ${
                  localSettings.apiProvider === p.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            API Key
          </label>
          <input
            type="password"
            value={localSettings.apiKey}
            onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
            placeholder={localSettings.apiProvider === 'ollama' ? '本地服务无需 Key' : '输入你的 API Key'}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
          />
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {localSettings.apiProvider === 'ollama'
              ? 'Ollama 服务地址见下方'
              : '密钥仅存储在本地浏览器中'}
          </p>
        </div>

        {/* Custom API URL */}
        {(localSettings.apiProvider === 'custom' || localSettings.apiProvider === 'openai') && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              API 地址
            </label>
            <input
              type="text"
              value={localSettings.baseUrl}
              onChange={(e) => setLocalSettings({ ...localSettings, baseUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
            />
          </div>
        )}

        {/* Ollama URL */}
        {localSettings.apiProvider === 'ollama' && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">服务地址</label>
            <input
              type="text"
              value={localSettings.ollamaUrl}
              onChange={(e) => setLocalSettings({ ...localSettings, ollamaUrl: e.target.value })}
              placeholder="http://localhost:11434"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
            />
          </div>
        )}

        {/* Model */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">模型</label>
          <input
            type="text"
            value={localSettings.summaryModel}
            onChange={(e) => setLocalSettings({ ...localSettings, summaryModel: e.target.value })}
            placeholder={
              localSettings.apiProvider === 'anthropic'
                ? 'claude-sonnet-4-20250514'
                : localSettings.apiProvider === 'ollama'
                ? 'llama3'
                : 'claude-3.5-sonnet'
            }
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
          />
        </div>

        {/* Auto Summary */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">自动生成摘要</label>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">保存时自动调用 AI</p>
          </div>
          <button
            onClick={() => setLocalSettings({ ...localSettings, autoSummary: !localSettings.autoSummary })}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              localSettings.autoSummary ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                localSettings.autoSummary ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Import/Export */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">数据管理</label>
          <div className="flex gap-2">
            <div className="relative flex-1" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                导出
                <ChevronDown className="w-3 h-3 ml-auto" />
              </button>
              {showExportMenu && (
                <div className="absolute z-50 mt-1 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                  {[
                    { format: 'json' as const, label: 'JSON 格式' },
                    { format: 'markdown' as const, label: 'Markdown 笔记' },
                    { format: 'csv' as const, label: 'CSV 表格' },
                    { format: 'html' as const, label: 'HTML 页面' },
                  ].map((item) => (
                    <button
                      key={item.format}
                      onClick={() => handleExport(item.format)}
                      className="w-full px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-left transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              导入
            </button>
            <input ref={fileInputRef} type="file" accept=".json,.html" onChange={handleImport} className="hidden" />
          </div>
          {importStatus && (
            <p className={`text-xs ${importStatus.includes('失败') || importStatus.includes('导入') ? 'text-red-500' : 'text-green-600 dark:text-green-400'} font-medium`}>
              {importStatus}
            </p>
          )}
        </div>

        {/* Tag Manager */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">标签管理</label>
          <button
            onClick={() => setShowTagManager(true)}
            className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Tag className="w-3.5 h-3.5" />
            管理标签
          </button>
        </div>

        {/* Clear All */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-red-500 uppercase tracking-wide">危险操作</label>
          <button
            onClick={handleClearAll}
            className="w-full py-2.5 px-3 text-sm rounded-xl border border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            删除所有书签 ({bookmarks.length})
          </button>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={handleSave}
          className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-sm transition-all ${
            saved
              ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700 text-primary-600 dark:text-primary-400'
              : 'bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {saved ? (
            <><Check className="w-4 h-4" />已保存</>
          ) : (
            '保存设置'
          )}
        </button>
      </div>

      {showTagManager && <TagManager onClose={() => setShowTagManager(false)} />}
    </div>
  );
}