import React, { useState } from 'react';
import { X, Edit3, Trash2, Tag } from 'lucide-react';
import { useStore } from '@/stores/appStore';

interface TagManagerProps {
  onClose: () => void;
}

export default function TagManager({ onClose }: TagManagerProps) {
  const { getAllTags, renameTag, deleteTag } = useStore();
  const allTags = getAllTags();
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [deletingTag, setDeletingTag] = useState<string | null>(null);

  const handleRename = async () => {
    if (editingTag && newTagName.trim() && newTagName.trim() !== editingTag) {
      await renameTag(editingTag, newTagName.trim());
    }
    setEditingTag(null);
    setNewTagName('');
  };

  const handleDelete = async () => {
    if (deletingTag) {
      await deleteTag(deletingTag);
    }
    setDeletingTag(null);
  };

  return (
    <div className="fixed inset-0 z-50 animate-fade-in flex items-center justify-center">
      <button
        className="absolute inset-0 bg-slate-950/40 -z-10"
        onClick={onClose}
        aria-label="关闭"
      />

      <div className="w-full max-w-md max-h-[80vh] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary-500" />
            标签管理
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {allTags.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              暂无标签
            </div>
          ) : (
            <div className="space-y-1">
              {allTags.map((item) => (
                <div
                  key={item.tag}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-800 dark:text-white font-medium">
                      {item.tag}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {item.count} 个书签
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingTag(item.tag);
                        setNewTagName(item.tag);
                      }}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="重命名"
                    >
                      <Edit3 className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => setDeletingTag(item.tag)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 重命名弹窗 */}
      {editingTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            className="absolute inset-0 bg-slate-950/40 -z-10"
            onClick={() => setEditingTag(null)}
          />
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl p-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
              重命名标签
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                  旧名称
                </label>
                <p className="text-sm text-slate-700 dark:text-slate-300">{editingTag}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                  新名称
                </label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditingTag(null)}
                  className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  取消
                </button>
                <button
                  onClick={handleRename}
                  disabled={!newTagName.trim() || newTagName.trim() === editingTag}
                  className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deletingTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            className="absolute inset-0 bg-slate-950/40 -z-10"
            onClick={() => setDeletingTag(null)}
          />
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl p-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
              删除标签
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              确定删除标签 "{deletingTag}"？此操作将同时从所有书签中移除此标签。
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeletingTag(null)}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}