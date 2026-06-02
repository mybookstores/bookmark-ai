export interface SummaryHeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3;
  text: string;
}

export interface SummaryParagraphBlock {
  type: 'paragraph';
  text: string;
}

export interface SummaryListBlock {
  type: 'list';
  ordered: boolean;
  items: string[];
}

export type SummaryBlock = SummaryHeadingBlock | SummaryParagraphBlock | SummaryListBlock;

export function normalizeSummary(summary?: string): string {
  if (!summary) return '';

  let text = summary.replace(/\r\n/g, '\n').trim();

  text = text.replace(/^```(?:markdown|md|text)?\s*/i, '');
  text = text.replace(/\s*```$/i, '');
  text = text.replace(/^\s*(?:#{1,6}\s*)?(?:\*\*|__)?(?:摘要|总结|概述)(?:[:：])?(?:\*\*|__)?\s*/i, '');
  text = text.replace(/^\s*(?:#{1,6}\s*)?(?:Summary)(?:[:：])?\s*/i, '');
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

export function getSummaryPlainText(summary?: string): string {
  const normalized = normalizeSummary(summary);
  if (!normalized) return '';

  return normalized
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/^\s*(?:[-*•]|\d+[.)])\s+/gm, '')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function parseSummaryBlocks(summary?: string): SummaryBlock[] {
  const normalized = normalizeSummary(summary);
  if (!normalized) return [];

  const blocks: SummaryBlock[] = [];
  const lines = normalized.split('\n');
  let paragraphLines: string[] = [];
  let listItems: string[] = [];
  let listOrdered = false;

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    blocks.push({
      type: 'paragraph',
      text: paragraphLines.join(' ').replace(/\s{2,}/g, ' ').trim(),
    });
    paragraphLines = [];
  };

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push({
      type: 'list',
      ordered: listOrdered,
      items: [...listItems],
    });
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = Math.min(headingMatch[1].length, 3) as 1 | 2 | 3;
      blocks.push({
        type: 'heading',
        level,
        text: headingMatch[2].trim(),
      });
      continue;
    }

    const orderedMatch = line.match(/^\d+[.)]\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      if (!listItems.length) {
        listOrdered = true;
      }
      if (listOrdered) {
        listItems.push(orderedMatch[1].trim());
        continue;
      }
      flushList();
      listOrdered = true;
      listItems.push(orderedMatch[1].trim());
      continue;
    }

    const unorderedMatch = line.match(/^[-*•]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      if (!listItems.length) {
        listOrdered = false;
      }
      if (!listOrdered) {
        listItems.push(unorderedMatch[1].trim());
        continue;
      }
      flushList();
      listOrdered = false;
      listItems.push(unorderedMatch[1].trim());
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}
