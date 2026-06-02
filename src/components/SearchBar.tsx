import React, { useState, useRef, useEffect } from 'react';
import { Search, ArrowUpDown, ChevronDown } from 'lucide-react';
import { useStore } from '@/stores/appStore';
import type { SortBy } from '@/types';

const sortOptions: Array<{ value: SortBy; label: string }> = [
  { value: 'createdDesc', label: '最新优先' },
  { value: 'createdAsc', label: '最早优先' },
  { value: 'updatedDesc', label: '最近更新' },
  { value: 'titleAsc', label: '标题 A-Z' },
  { value: 'domain', label: '按域名' },
];

export default function SearchBar() {
  const { searchQuery, setSearchQuery, sortBy, setSortBy } = useStore();
  const [showSortMenu, setShowSortMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    if (showSortMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSortMenu]);

  const currentSort = sortOptions.find((o) => o.value === sortBy);

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="搜索书签..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-300 dark:focus:border-primary-600 transition-all shadow-sm"
        />
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowSortMenu(!showSortMenu)}
          className="h-full px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 transition-colors flex items-center gap-1.5 bg-white dark:bg-slate-800"
          title="排序"
        >
          <ArrowUpDown className="w-4 h-4" />
          <ChevronDown className="w-3 h-3" />
        </button>
        {showSortMenu && (
          <div className="absolute top-full right-0 mt-1 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-50">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSortBy(option.value);
                  setShowSortMenu(false);
                }}
                className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                  sortBy === option.value
                    ? 'text-primary-600 dark:text-primary-400 font-medium'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {option.label}
                {sortBy === option.value && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
