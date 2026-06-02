export interface Bookmark {
  id: string;
  url: string;
  title: string;
  excerpt?: string;
  summary?: string;
  notes?: string;
  favicon?: string;
  tags: string[];
  folderId?: string;
  createdAt: number;
  updatedAt: number;
  readingTime?: number;
  ogImage?: string;
}

export type SortBy = 'createdDesc' | 'createdAsc' | 'updatedDesc' | 'titleAsc' | 'domain';

export interface Folder {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: number;
}

export interface Settings {
  apiKey: string;
  apiProvider: 'openai' | 'anthropic' | 'ollama' | 'custom';
  baseUrl: string;
  ollamaUrl: string;
  autoSummary: boolean;
  summaryModel: string;
  theme: 'light' | 'dark' | 'auto';
  hasSeenOnboarding: boolean;
}

export const defaultSettings: Settings = {
  apiKey: '',
  apiProvider: 'custom',
  baseUrl: 'https://lanyiapi.com/v1',
  ollamaUrl: 'http://localhost:11434',
  autoSummary: true,
  summaryModel: 'claude-sonnet-4-20250514',
  theme: 'auto',
  hasSeenOnboarding: false,
};