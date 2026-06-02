import { useState } from 'react';
import { FolderPlus, FolderOpen, Trash2, Inbox } from 'lucide-react';
import { useStore } from '@/stores/appStore';
import { generateId } from '@/lib/ai';

const folderColors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function FolderSidebar() {
  const { getFolderStats, selectedFolderId, setSelectedFolderId, addFolder, deleteFolder } = useStore();
  const folders = getFolderStats();
  const [isAdding, setIsAdding] = useState(false);
  const [folderName, setFolderName] = useState('');

  const handleAddFolder = async () => {
    if (!folderName.trim()) return;
    const color = folderColors[Math.floor(Math.random() * folderColors.length)];
    await addFolder({
      id: generateId(),
      name: folderName.trim(),
      color,
      icon: 'folder',
      createdAt: Date.now(),
    });
    setFolderName('');
    setIsAdding(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-800 dark:text-white">文件夹</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="新建文件夹"
          aria-label="新建文件夹"
        >
          <FolderPlus className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {isAdding && (
        <div className="flex gap-2">
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddFolder();
              if (e.key === 'Escape') setIsAdding(false);
            }}
            placeholder="文件夹名称"
            autoFocus
            className="flex-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={handleAddFolder}
            className="px-3 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            添加
          </button>
        </div>
      )}

      <div className="space-y-1">
        <button
          onClick={() => setSelectedFolderId(null)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
            selectedFolderId === null
              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
              : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>全部书签</span>
        </button>

        {folders.map((folder) => (
          <div key={folder.id} className="group flex items-center gap-1">
            <button
              onClick={() => setSelectedFolderId(folder.id)}
              className={`flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-lg transition-all ${
                selectedFolderId === folder.id
                  ? 'bg-primary-50 dark:bg-primary-900/30'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <FolderOpen className="w-4 h-4 flex-shrink-0" style={{ color: folder.color }} />
              <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{folder.name}</span>
              <span className="text-xs text-slate-400 ml-auto shrink-0">{folder.count}</span>
            </button>
            <button
              onClick={() => deleteFolder(folder.id)}
              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-all shrink-0"
              title="删除文件夹"
              aria-label="删除文件夹"
            >
              <Trash2 className="w-3 h-3 text-slate-300 dark:text-slate-600 hover:text-red-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
