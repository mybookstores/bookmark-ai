import React from 'react';
import { parseSummaryBlocks } from '@/lib/summary';

interface SummaryMarkdownProps {
  content?: string;
  className?: string;
}

function renderInlineMarkdown(text: string) {
  const parts: React.ReactNode[] = [];
  const pattern = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|\*([^*]+)\*|_([^_]+)_)/g;
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }

    if (match[2] && match[3]) {
      parts.push(
        <a
          key={`token-${key++}`}
          href={match[3]}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary-600 underline decoration-primary-300 underline-offset-4 hover:text-primary-700 dark:text-primary-400 dark:decoration-primary-700 dark:hover:text-primary-300"
        >
          {match[2]}
        </a>
      );
    } else if (match[4] || match[5]) {
      parts.push(
        <strong key={`token-${key++}`} className="font-semibold text-slate-900 dark:text-slate-100">
          {match[4] || match[5]}
        </strong>
      );
    } else if (match[6]) {
      parts.push(
        <code
          key={`token-${key++}`}
          className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[13px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          {match[6]}
        </code>
      );
    } else if (match[7] || match[8]) {
      parts.push(
        <em key={`token-${key++}`} className="italic text-slate-800 dark:text-slate-200">
          {match[7] || match[8]}
        </em>
      );
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export default function SummaryMarkdown({ content, className = '' }: SummaryMarkdownProps) {
  const blocks = parseSummaryBlocks(content);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 text-[15px] leading-7 text-slate-700 dark:text-slate-300 ${className}`.trim()}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <h4
              key={`block-${index}`}
              className={block.level === 1 ? 'text-base font-semibold text-slate-900 dark:text-white' : 'text-sm font-semibold text-slate-900 dark:text-white'}
            >
              {renderInlineMarkdown(block.text)}
            </h4>
          );
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          return (
            <ListTag
              key={`block-${index}`}
              className={`space-y-2 pl-5 ${block.ordered ? 'list-decimal' : 'list-disc'} marker:text-slate-400 dark:marker:text-slate-500`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`block-${index}-item-${itemIndex}`} className="pl-1">
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ListTag>
          );
        }

        return (
          <p key={`block-${index}`} className="text-[15px] leading-7 text-slate-700 dark:text-slate-300">
            {renderInlineMarkdown(block.text)}
          </p>
        );
      })}
    </div>
  );
}
