import { MousePointer2, Sparkles, FolderOpen, Search } from 'lucide-react';

const tips = [
  { icon: MousePointer2, text: '点击上方按钮保存当前页面' },
  { icon: Sparkles, text: '自动生成 AI 摘要' },
  { icon: FolderOpen, text: '用文件夹整理内容' },
  { icon: Search, text: '搜索标题、网址和摘要' },
];

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-2">
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed max-w-[260px]">
        还没有书签，<br />保存一个网页开始吧
      </p>
      <div className="space-y-1.5 w-full">
        {tips.map((tip, index) => {
          const Icon = tip.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left"
              style={{ backgroundColor: 'var(--chassis-bg, #f8fafc)' }}
            >
              <div className="w-7 h-7 rounded-md bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-100 dark:border-slate-700">
                <Icon className="w-3.5 h-3.5 text-primary-500" />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">{tip.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
