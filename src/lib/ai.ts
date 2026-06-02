import type { Settings } from '@/types';
import { normalizeSummary } from '@/lib/summary';

export interface ExtractedPageContent {
  title: string;
  content: string;
  favicon?: string;
  ogImage?: string;
}

export async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] ?? null;
}

export async function extractPageContent(
  tabId: number,
  fallback?: Pick<chrome.tabs.Tab, 'title' | 'favIconUrl'>
): Promise<ExtractedPageContent> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const resolveUrl = (value: string | null | undefined) => {
          if (!value) return undefined;
          try {
            return new URL(value, window.location.href).toString();
          } catch {
            return value;
          }
        };

        const getMetaContent = (name: string) => {
          const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
          return el?.getAttribute('content') || '';
        };

        const title =
          document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
          document.querySelector('h1')?.textContent?.trim() ||
          document.title ||
          '';

        const description = getMetaContent('og:description') || getMetaContent('description') || '';

        const favicon = resolveUrl(
          document.querySelector("link[rel='icon']")?.getAttribute('href') ||
            document.querySelector("link[rel='shortcut icon']")?.getAttribute('href') ||
            '/favicon.ico'
        );

        const ogImage = resolveUrl(getMetaContent('og:image'));
        const article = document.querySelector('article') || document.querySelector('main') || document.body;
        const paragraphs = article?.querySelectorAll('p') || [];
        const content = Array.from(paragraphs)
          .map((p) => p.textContent?.trim())
          .filter((t): t is string => Boolean(t && t.length > 50))
          .join(' ')
          .slice(0, 5000);

        return {
          title: title.slice(0, 500),
          content: content || description,
          favicon,
          ogImage,
        };
      },
    });

    return results[0]?.result || {
      title: fallback?.title || '',
      content: '',
      favicon: fallback?.favIconUrl,
    };
  } catch {
    return {
      title: fallback?.title || '',
      content: '',
      favicon: fallback?.favIconUrl,
    };
  }
}

function buildOpenAICompatibleUrl(baseUrl: string): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return new URL('chat/completions', normalizedBase).toString();
}

export async function generateSummary(content: string, title: string, settings: Settings): Promise<string> {
  if (!content && !title) return '';
  if (!settings.apiKey) return '';

  const prompt = `请为以下网页内容生成一个简洁的中文摘要（100字以内）：

标题：${title}
内容：${content.slice(0, 3000)}

要求：
- 简洁明了，突出重点
- 用中文回答
- 只输出摘要正文
- 不要写“摘要：”“总结：”这类标题
- 不要使用 Markdown 标题、加粗或列表
- 不要添加额外解释`;

  try {
    if (settings.apiProvider === 'custom') {
      const response = await fetch(buildOpenAICompatibleUrl(settings.baseUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.summaryModel || 'claude-sonnet-4-20250514',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('API Error:', data);
        return '';
      }
      const content = data.choices?.[0]?.message?.content || data.content?.[0]?.text || data.response || data.result || '';
      return normalizeSummary(content);
    }

    if (settings.apiProvider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: settings.summaryModel || 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('API Error:', data);
        return '';
      }
      return normalizeSummary(data.content?.[0]?.text || '');
    }

    if (settings.apiProvider === 'ollama') {
      const response = await fetch(`${settings.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.summaryModel || 'llama3',
          prompt,
          stream: false,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('API Error:', data);
        return '';
      }
      return normalizeSummary(data.response || '');
    }

    const response = await fetch(buildOpenAICompatibleUrl(settings.baseUrl || 'https://api.openai.com/v1'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.summaryModel || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('API Error:', data);
      return '';
    }
    const content = data.choices?.[0]?.message?.content || data.content?.[0]?.text || data.response || '';
    return normalizeSummary(content);
  } catch (error) {
    console.error('Failed to generate summary:', error);
    return '';
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export async function generateTags(content: string, title: string, settings: Settings): Promise<string[]> {
  if (!settings.apiKey) return [];

  const prompt = `请根据以下网页内容生成3-5个标签（仅标签词，不要解释，用中文或英文均可）：

标题：${title}
内容摘要：${content.slice(0, 1000)}

要求：
- 直接输出标签，用逗号分隔
- 不要编号、不要列表格式
- 标签要简洁，1-3个字或1-3个英文单词
- 例如：技术,教程,Python,机器学习`;

  try {
    if (settings.apiProvider === 'custom') {
      const response = await fetch(buildOpenAICompatibleUrl(settings.baseUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.summaryModel || 'claude-sonnet-4-20250514',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 50,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Tags API Error:', data);
        return [];
      }
      const content = data.choices?.[0]?.message?.content || data.content?.[0]?.text || data.response || data.result || '';
      return parseTags(content);
    }

    if (settings.apiProvider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: settings.summaryModel || 'claude-sonnet-4-20250514',
          max_tokens: 50,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Tags API Error:', data);
        return [];
      }
      return parseTags(data.content?.[0]?.text || '');
    }

    if (settings.apiProvider === 'ollama') {
      const response = await fetch(`${settings.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.summaryModel || 'llama3',
          prompt,
          stream: false,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Tags API Error:', data);
        return [];
      }
      return parseTags(data.response || '');
    }

    const response = await fetch(buildOpenAICompatibleUrl(settings.baseUrl || 'https://api.openai.com/v1'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.summaryModel || 'claude',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('Tags API Error:', data);
      return [];
    }
    const content = data.choices?.[0]?.message?.content || data.content?.[0]?.text || data.response || '';
    return parseTags(content);
  } catch (error) {
    console.error('Failed to generate tags:', error);
    return [];
  }
}

function parseTags(text: string): string[] {
  const cleaned = text.replace(/[#*`\n\r]/g, ' ').replace(/[,，、]/g, ',');
  return cleaned.split(',').map((t) => t.trim()).filter((t) => t.length > 0 && t.length <= 20).slice(0, 5);
}
