import type { Bookmark } from '@/types';

export function exportToMarkdown(bookmarks: Bookmark[]): string {
  const escapeMd = (str: string) => str.replace(/[*_`~]/g, '\\$&');

  const header = `# BookmarkAI 书签导出

> ${new Date().toLocaleString('zh-CN')} · 共 ${bookmarks.length} 个书签

---

`;

  const items = bookmarks.map((b) => {
    const tags = b.tags.length > 0 ? b.tags.map((t) => `\`${t}\``).join(' ') : '';
    const meta = [b.readingTime ? `${b.readingTime} 分钟阅读` : '', new Date(b.createdAt).toLocaleDateString('zh-CN')].filter(Boolean).join(' · ');
    const domain = b.url ? new URL(b.url).hostname.replace('www.', '') : '';

    return `## ${escapeMd(b.title)}

**${domain}** ${tags ? `· ${tags}` : ''}

${b.summary ? `> ${b.summary}` : ''}

${b.notes ? `\n**笔记：** ${b.notes}\n` : ''}

🔗 [打开链接](${b.url}) ${meta ? `· *${meta}*` : ''}

---`;
  }).join('\n\n');

  return header + items;
}

export function exportToCsv(bookmarks: Bookmark[]): string {
  // 添加 BOM 让 Excel 正确识别 UTF-8 中文
  const BOM = '﻿';
  const headers = ['标题', 'URL', '摘要', '标签', '创建时间', '阅读时长'];
  const rows = bookmarks.map((b) => [
    `"${b.title.replace(/"/g, '""')}"`,
    `"${b.url.replace(/"/g, '""')}"`,
    `"${(b.summary || b.excerpt || '').replace(/"/g, '""')}"`,
    `"${b.tags.join(';')}"`,
    `"${new Date(b.createdAt).toLocaleString('zh-CN')}"`,
    `"${b.readingTime || ''}"`,
  ]);
  return BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportToBookmarksHtml(bookmarks: Bookmark[]): string {
  const escapeHtml = (str: string) => str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const items = bookmarks.map((b) => {
    const tagsHtml = b.tags.length > 0
      ? `<div class="tags"><span class="tag">${b.tags.join('</span><span class="tag">')}</span></div>`
      : '';
    const summaryHtml = b.summary
      ? `<div class="summary">${escapeHtml(b.summary)}</div>`
      : '';
    const meta = [
      b.readingTime ? `${b.readingTime} 分钟阅读` : '',
      new Date(b.createdAt).toLocaleDateString('zh-CN'),
    ].filter(Boolean).join(' · ');

    return `<div class="bookmark-item">
    <div class="bookmark-header">
      <a href="${escapeHtml(b.url)}" class="bookmark-title">${escapeHtml(b.title)}</a>
      <span class="bookmark-domain">${escapeHtml(new URL(b.url).hostname)}</span>
    </div>
    ${tagsHtml}
    ${summaryHtml}
    <div class="bookmark-meta">${escapeHtml(meta)}</div>
  </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BookmarkAI 导出</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      color: white;
    }
    .header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 8px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    .header p {
      font-size: 1rem;
      opacity: 0.9;
    }
    .stats {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-top: 20px;
    }
    .stat {
      background: rgba(255,255,255,0.2);
      padding: 12px 24px;
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
    }
    .stat-label {
      font-size: 0.875rem;
      opacity: 0.9;
    }
    .bookmark-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .bookmark-item {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .bookmark-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    }
    .bookmark-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }
    .bookmark-title {
      flex: 1;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1a1a2e;
      text-decoration: none;
      line-height: 1.4;
    }
    .bookmark-title:hover {
      color: #667eea;
    }
    .bookmark-domain {
      font-size: 0.75rem;
      color: #94a3b8;
      background: #f1f5f9;
      padding: 4px 8px;
      border-radius: 6px;
      white-space: nowrap;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }
    .tag {
      font-size: 0.75rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 4px 10px;
      border-radius: 20px;
    }
    .summary {
      font-size: 0.875rem;
      color: #64748b;
      line-height: 1.6;
      margin-bottom: 12px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 8px;
      border-left: 3px solid #667eea;
    }
    .bookmark-meta {
      font-size: 0.75rem;
      color: #94a3b8;
    }
    @media (max-width: 600px) {
      .header h1 { font-size: 1.75rem; }
      .stats { flex-direction: column; align-items: center; }
      .bookmark-header { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BookmarkAI</h1>
      <p>书签导出 · ${new Date().toLocaleDateString('zh-CN')}</p>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${bookmarks.length}</div>
          <div class="stat-label">书签总数</div>
        </div>
        <div class="stat">
          <div class="stat-value">${new Set(bookmarks.map(b => { try { return new URL(b.url).hostname } catch { return '' } })).size}</div>
          <div class="stat-label">不同网站</div>
        </div>
      </div>
    </div>
    <div class="bookmark-list">
${items}
    </div>
  </div>
</body>
</html>`;
}