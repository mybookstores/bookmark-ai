import { Sparkles, FolderOpen, Tag, Search, CheckCircle } from 'lucide-react';

interface OnboardingProps {
  onFinish: () => void;
}

const steps = [
  {
    icon: Sparkles,
    title: '一键保存网页',
    description: '点击按钮即可保存当前页面，并自动提取标题、内容和 AI 摘要。',
  },
  {
    icon: FolderOpen,
    title: '文件夹分组',
    description: '创建文件夹整理不同主题的书签，让收藏更有条理。',
  },
  {
    icon: Tag,
    title: '标签管理',
    description: '为书签添加标签，支持多维度分类和快速筛选。',
  },
  {
    icon: Search,
    title: '全文搜索',
    description: '按标题、网址、摘要、标签搜索，瞬间找到想要的内容。',
  },
];

export default function Onboarding({ onFinish }: OnboardingProps) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-gradient-to-br from-primary-50 via-white to-violet-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <div className="text-center mb-6 pt-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-lg">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">欢迎使用 BookmarkAI</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">你的智能书签管家，让收藏不再吃灰</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={index}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 dark:border-slate-700"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 dark:text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onFinish}
        className="w-full py-3 px-4 mt-6 bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-700 hover:to-violet-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg"
      >
        <CheckCircle className="w-5 h-5" />
        开始使用
      </button>
    </div>
  );
}