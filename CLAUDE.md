# BookmarkAI - 智能书签管理器

浏览器插件 + 本地存储的智能书签管理工具，自动抓取网页内容并生成 AI 摘要。

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **样式**: Tailwind CSS
- **存储**: IndexedDB（本地优先）
- **AI 摘要**: 浏览器端直接调用 AI API（用户自备 API Key）
- **打包**: Web Extension (Manifest V3)

## 项目结构

```
bookmark-ai/
├── extension/          # 浏览器插件核心
│   ├── manifest.json   # 插件配置
│   ├── popup/          # 弹出窗口
│   ├── background/     # 后台脚本
│   └── content/        # 内容脚本
├── src/
│   ├── components/     # React 组件
│   ├── hooks/          # 自定义 Hooks
│   ├── lib/            # 工具函数
│   ├── stores/         # 状态管理
│   └── types/          # TypeScript 类型
└── public/             # 静态资源
```

## 功能规划

### Phase 1 - MVP
- [ ] 浏览器插件安装
- [ ] 一键保存当前页面书签
- [ ] 自动抓取页面标题和内容
- [ ] 调用 AI API 生成摘要
- [ ] 本地 IndexedDB 存储
- [ ] 书签列表展示和搜索

### Phase 2 - 增强
- [ ] 标签系统
- [ ] 文件夹整理
- [ ] 导入/导出功能
- [ ] 深色模式

### Phase 3 - 云端（可选）
- [ ] 云端同步
- [ ] 多设备支持

## 开发命令

```bash
pnpm install      # 安装依赖
pnpm dev          # 开发模式
pnpm build        # 构建生产版本
pnpm lint         # 代码检查
```

## 关键设计决策

1. **用户自备 AI Key** - 降低成本，避免服务器费用
2. **IndexedDB 本地存储** - 隐私优先，无需账号
3. **纯前端实现** - 零后端依赖