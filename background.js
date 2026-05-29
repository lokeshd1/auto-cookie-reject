/**
 * Auto Cookie Reject - Background Service Worker
 */

// Initialize default settings on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      enabled: true,
      disabledDomains: [],
      stats: {
        today: 0,
        total: 0,
        date: new Date().toDateString()
      }
    });

    console.log('[Auto Cookie Reject] Extension installed, defaults set');
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'BANNER_BLOCKED') {
    // Update statistics
    chrome.storage.sync.get(['stats'], (result) => {
      const stats = result.stats || { today: 0, total: 0, date: new Date().toDateString() };

      // Reset today count if it's a new day
      if (stats.date !== new Date().toDateString()) {
        stats.today = 0;
        stats.date = new Date().toDateString();
      }

      stats.today++;
      stats.total++;

      chrome.storage.sync.set({ stats });

      console.log(`[Auto Cookie Reject] Banner blocked on ${message.domain}. Total: ${stats.total}`);
    });

    sendResponse({ success: true });
  }

  return true; // Keep message channel open for async response
});

// Optional: Add badge to show protection status
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.storage.sync.get(['enabled', 'disabledDomains'], (result) => {
      const isEnabled = result.enabled !== false;
      const disabledDomains = result.disabledDomains || [];

      try {
        const url = new URL(tab.url);
        const isSiteEnabled = !disabledDomains.includes(url.hostname);

        if (isEnabled && isSiteEnabled) {
          chrome.action.setBadgeText({ tabId, text: '' });
          chrome.action.setBadgeBackgroundColor({ tabId, color: '#667eea' });
        } else {
          chrome.action.setBadgeText({ tabId, text: 'OFF' });
          chrome.action.setBadgeBackgroundColor({ tabId, color: '#ff6b6b' });
        }
      } catch (e) {
        // Invalid URL, ignore
      }
    });
  }
});
