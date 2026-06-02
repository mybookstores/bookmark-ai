import { Bookmark, FolderOpen, Tag } from 'lucide-react';
import { useStore } from '@/stores/appStore';

export default function StatsBar() {
  const { bookmarks, folders, getAllTags } = useStore();
  const tags = getAllTags();

  const stats = [
    { label: '书签', value: bookmarks.length, icon: Bookmark },
    { label: '文件夹', value: folders.length, icon: FolderOpen },
    { label: '标签', value: tags.length, icon: Tag },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-800 rounded-xl px-3 py-2.5 border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="text-xs text-slate-400 dark:text-slate-500">{stat.label}</span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
          </div>
        );
      })}
    </div>
  );
}
