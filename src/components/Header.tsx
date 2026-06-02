import React from 'react';
import { Settings } from 'lucide-react';

interface HeaderProps {
  onSettings: () => void;
}

export default function Header({ onSettings }: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">BookmarkAI</h1>
      <button
        onClick={onSettings}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        title="设置"
        aria-label="打开设置"
      >
        <Settings className="w-4 h-4 text-slate-400 dark:text-slate-500" />
      </button>
    </div>
  );
}
