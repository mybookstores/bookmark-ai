import { saveCurrentTabBookmark, saveLinkBookmark, saveSelectionBookmark } from '@/lib/bookmarkSaver';

const MENU_SAVE_PAGE = 'bookmarkai-save-page';
const MENU_SAVE_LINK = 'bookmarkai-save-link';
const MENU_SAVE_SELECTION = 'bookmarkai-save-selection';

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_SAVE_PAGE,
      title: '保存当前页面到 BookmarkAI',
      contexts: ['page'],
    });

    chrome.contextMenus.create({
      id: MENU_SAVE_LINK,
      title: '保存链接到 BookmarkAI',
      contexts: ['link'],
    });

    chrome.contextMenus.create({
      id: MENU_SAVE_SELECTION,
      title: '保存摘录到 BookmarkAI',
      contexts: ['selection'],
    });
  });
}

async function notifyBookmarkSaved(bookmarkId: string) {
  try {
    await chrome.runtime.sendMessage({
      type: 'bookmark-saved',
      bookmarkId,
    });
  } catch {
    // Popup may be closed.
  }
}

chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  createContextMenus();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (info.menuItemId === MENU_SAVE_PAGE && tab?.id && tab.url) {
      const result = await saveCurrentTabBookmark(tab);
      await notifyBookmarkSaved(result.bookmark.id);
      return;
    }

    if (info.menuItemId === MENU_SAVE_LINK && info.linkUrl) {
      const linkText = (info as chrome.contextMenus.OnClickData & { linkText?: string }).linkText;
      const result = await saveLinkBookmark(info.linkUrl, linkText || info.selectionText, tab);
      await notifyBookmarkSaved(result.bookmark.id);
      return;
    }

    if (info.menuItemId === MENU_SAVE_SELECTION && info.pageUrl && info.selectionText) {
      const result = await saveSelectionBookmark(info.pageUrl, tab?.title || '', info.selectionText, tab);
      await notifyBookmarkSaved(result.bookmark.id);
      return;
    }
  } catch (error) {
    console.error('Failed to save from context menu:', error);
  }
});
