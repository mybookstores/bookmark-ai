import React, { useState } from 'react';
import { Tag, X, ChevronDown } from 'lucide-react';
import { useStore } from '@/stores/appStore';

export default function TagFilter() {
  const { getAllTags, selectedTags, toggleTag, setSelectedTags } = useStore();
  const allTags = getAllTags();
  const [expanded, setExpanded] = useState(false);

  if (allTags.length === 0) return null;

  const visibleTags = expanded ? allTags : allTags.slice(0, 6);
  const hasMore = allTags.length > 6;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Tag className="w-3 h-3" />
        </span>
        {visibleTags.map((item) => (
          <button
            key={item.tag}
            onClick={() => toggleTag(item.tag)}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
              selectedTags.includes(item.tag)
                ? 'bg-primary-500 border-primary-500 text-white'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-primary-300 hover:text-primary-600 dark:hover:text-primary-400'
            }`}
          >
            {item.tag}
          </button>
        ))}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-2 py-1 text-xs text-primary-500 hover:text-primary-600 flex items-center gap-0.5 transition-colors"
          >
            {expanded ? '收起' : `+${allTags.length - 6}`}
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}
        {selectedTags.length > 0 && (
          <button
            onClick={() => setSelectedTags([])}
            className="px-2 py-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            清除
          </button>
        )}
      </div>
    </div>
  );
}
