import React from 'react';
import { X, Trash2, Tag } from 'lucide-react';
import { useStore } from '@/stores/appStore';

interface BatchActionsProps {
  selected: string[];
  onClear: () => void;
  onAddTag: (tag: string) => void;
}

export default function BatchActions({ selected, onClear, onAddTag }: BatchActionsProps) {
  const { deleteBookmarks } = useStore();
  const [showTagInput, setShowTagInput] = React.useState(false);
  const [tagValue, setTagValue] = React.useState('');

  const handleDelete = async () => {
    if (confirm(`确定删除选中的 ${selected.length} 个书签？`)) {
      await deleteBookmarks(selected);
      onClear();
    }
  };

  const handleAddTag = () => {
    if (tagValue.trim()) {
      onAddTag(tagValue.trim());
      setTagValue('');
      setShowTagInput(false);
    }
  };

  if (selected.length === 0) return null;

  return (
    <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-xl p-3 mb-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-primary-700 dark:text-primary-300 font-medium">
          已选择 {selected.length} 个书签
        </span>
        <button onClick={onClear} className="p-1 hover:bg-primary-100 dark:hover:bg-primary-800 rounded">
          <X className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        </button>
      </div>
      <div className="flex gap-2 mt-2">
        {showTagInput ? (
          <>
            <input
              type="text"
              value={tagValue}
              onChange={(e) => setTagValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="输入标签名"
              autoFocus
              className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border border-primary-300 dark:border-primary-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleAddTag}
              className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              添加
            </button>
            <button
              onClick={() => setShowTagInput(false)}
              className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
              取消
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowTagInput(true)}
              className="flex-1 py-1.5 px-3 text-sm bg-white dark:bg-slate-700 border border-primary-300 dark:border-primary-700 rounded-lg text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-800/50 flex items-center justify-center gap-1"
            >
              <Tag className="w-4 h-4" />
              批量添加标签
            </button>
            <button
              onClick={handleDelete}
              className="py-1.5 px-3 text-sm bg-white dark:bg-slate-700 border border-red-300 dark:border-red-800 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 flex items-center justify-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              删除
            </button>
          </>
        )}
      </div>
    </div>
  );
}