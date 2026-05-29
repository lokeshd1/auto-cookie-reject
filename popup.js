/**
 * Auto Cookie Reject - Popup Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  const globalToggle = document.getElementById('global-toggle');
  const siteToggle = document.getElementById('site-toggle');
  const domainInfo = document.getElementById('domain-info');
  const statusEl = document.getElementById('status');
  const todayCount = document.getElementById('today-count');
  const totalCount = document.getElementById('total-count');

  let currentDomain = '';

  // Get current tab's domain
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const url = new URL(tab.url);
      currentDomain = url.hostname;
      domainInfo.textContent = currentDomain;
    } else {
      domainInfo.textContent = 'N/A';
    }
  } catch (e) {
    domainInfo.textContent = 'Unable to detect';
  }

  // Load settings
  chrome.storage.sync.get(['enabled', 'disabledDomains', 'stats'], (result) => {
    // Global toggle
    const isEnabled = result.enabled !== false;
    globalToggle.checked = isEnabled;

    // Site toggle
    const disabledDomains = result.disabledDomains || [];
    const isSiteEnabled = !disabledDomains.includes(currentDomain);
    siteToggle.checked = isSiteEnabled;

    // Stats
    const stats = result.stats || { today: 0, total: 0, date: new Date().toDateString() };

    // Reset today count if it's a new day
    if (stats.date !== new Date().toDateString()) {
      stats.today = 0;
      stats.date = new Date().toDateString();
      chrome.storage.sync.set({ stats });
    }

    todayCount.textContent = stats.today;
    totalCount.textContent = stats.total;

    updateStatus(isEnabled && isSiteEnabled);
  });

  // Global toggle handler
  globalToggle.addEventListener('change', () => {
    const isEnabled = globalToggle.checked;
    chrome.storage.sync.set({ enabled: isEnabled });
    updateStatus(isEnabled && siteToggle.checked);

    // Reload current tab to apply changes
    reloadCurrentTab();
  });

  // Site toggle handler
  siteToggle.addEventListener('change', () => {
    chrome.storage.sync.get(['disabledDomains'], (result) => {
      let disabledDomains = result.disabledDomains || [];

      if (siteToggle.checked) {
        // Remove from disabled list
        disabledDomains = disabledDomains.filter(d => d !== currentDomain);
      } else {
        // Add to disabled list
        if (!disabledDomains.includes(currentDomain)) {
          disabledDomains.push(currentDomain);
        }
      }

      chrome.storage.sync.set({ disabledDomains });
      updateStatus(globalToggle.checked && siteToggle.checked);

      // Reload current tab to apply changes
      reloadCurrentTab();
    });
  });

  function updateStatus(isActive) {
    if (isActive) {
      statusEl.textContent = 'Protection Active';
      statusEl.className = 'status active';
    } else {
      statusEl.textContent = 'Protection Disabled';
      statusEl.className = 'status disabled';
    }
  }

  async function reloadCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        chrome.tabs.reload(tab.id);
      }
    } catch (e) {
      console.error('Failed to reload tab:', e);
    }
  }
});
