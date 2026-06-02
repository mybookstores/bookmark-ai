import React from 'react';
import type { Bookmark } from '@/types';
import { useStore } from '@/stores/appStore';
import BookmarkCard from './BookmarkCard';

interface BookmarkListProps {
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onOpenPreview?: (bookmark: Bookmark) => void;
}

export default function BookmarkList({ selectionMode, selectedIds, onToggleSelect, onOpenPreview }: BookmarkListProps) {
  const { getFilteredBookmarks } = useStore();
  const filteredBookmarks = getFilteredBookmarks();

  return (
    <div className="space-y-2.5">
      {filteredBookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          selectionMode={selectionMode}
          selected={selectedIds?.has(bookmark.id)}
          onToggleSelect={onToggleSelect}
          onOpenPreview={onOpenPreview}
        />
      ))}
    </div>
  );
}