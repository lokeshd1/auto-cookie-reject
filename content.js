/**
 * Auto Cookie Reject - Content Script
 * Automatically detects and rejects cookie consent popups
 */

(function() {
  'use strict';

  // Check if extension is enabled for this domain
  let isEnabled = true;

  // Track if we've already handled a banner on this page to prevent repeated attempts
  let hasHandledBanner = false;

  // CMP-specific rejection handlers
  const CMP_HANDLERS = {
    // OneTrust
    onetrust: {
      detect: () => document.querySelector('#onetrust-consent-sdk, #onetrust-banner-sdk'),
      reject: () => {
        const rejectBtn = document.querySelector(
          '#onetrust-reject-all-handler, ' +
          '.ot-pc-refuse-all-handler, ' +
          '[aria-label="Reject All"], ' +
          'button[title="Reject All"]'
        );
        if (rejectBtn) {
          rejectBtn.click();
          return true;
        }
        return false;
      }
    },

    // Cookiebot
    cookiebot: {
      detect: () => document.querySelector('#CybotCookiebotDialog, #Cookiebot'),
      reject: () => {
        const rejectBtn = document.querySelector(
          '#CybotCookiebotDialogBodyButtonDecline, ' +
          '#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll, ' +
          'a[id*="Decline"], ' +
          'button[id*="Decline"]'
        );
        if (rejectBtn) {
          rejectBtn.click();
          return true;
        }
        // Try "Only necessary" option
        const necessaryBtn = document.querySelector(
          '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowallSelection'
        );
        if (necessaryBtn) {
          necessaryBtn.click();
          return true;
        }
        return false;
      }
    },

    // TrustArc
    trustarc: {
      detect: () => document.querySelector('#truste-consent-track, .truste_box_overlay'),
      reject: () => {
        const rejectBtn = document.querySelector(
          '.truste-button2, ' +
          '#truste-consent-required, ' +
          'a.required, ' +
          'button[data-choice="required"]'
        );
        if (rejectBtn) {
          rejectBtn.click();
          return true;
        }
        return false;
      }
    },

    // Quantcast
    quantcast: {
      detect: () => document.querySelector('#qc-cmp2-container, .qc-cmp-ui-container'),
      reject: () => {
        const rejectBtn = document.querySelector(
          'button[mode="secondary"], ' +
          '.qc-cmp2-summary-buttons button:last-child, ' +
          'button[aria-label*="Disagree"], ' +
          'button[aria-label*="Reject"]'
        );
        if (rejectBtn) {
          rejectBtn.click();
          return true;
        }
        return false;
      }
    },

    // Didomi
    didomi: {
      detect: () => document.querySelector('#didomi-host, .didomi-popup-container'),
      reject: () => {
        const rejectBtn = document.querySelector(
          '#didomi-notice-disagree-button, ' +
          'button[aria-label*="Disagree"], ' +
          '.didomi-components-button--secondary'
        );
        if (rejectBtn) {
          rejectBtn.click();
          return true;
        }
        return false;
      }
    },

    // Sourcepoint (used by The Guardian, etc.)
    sourcepoint: {
      detect: () => {
        // In main doc: check for SP container
        if (document.querySelector('[id^="sp_message_container"]')) {
          return true;
        }
        // In iframe: check if we're in an iframe AND have consent buttons
        if (window.self !== window.top) {
          const hasConsentUI = document.querySelector('[class*="message-component"], [class*="privacy-manager"]') ||
                              document.body?.textContent?.includes('Yes, I accept');
          if (hasConsentUI) {
            console.log('[Auto Cookie Reject] Inside Sourcepoint iframe');
            return true;
          }
        }
        return false;
      },
      reject: () => {
        // Find reject button by various methods
        const rejectSelectors = [
          'button[title="No, thank you"]',
          'button[title="Reject"]',
          'button[title="Reject all"]',
          'button[title="Decline"]',
          'button[aria-label*="reject" i]',
          'button[aria-label*="decline" i]'
        ];

        for (const selector of rejectSelectors) {
          const btn = document.querySelector(selector);
          if (btn && isVisible(btn)) {
            btn.click();
            console.log('[Auto Cookie Reject] Clicked Sourcepoint button via selector');
            return true;
          }
        }

        // Search all buttons by text content
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const text = btn.textContent.toLowerCase().trim();
          if ((text.includes('no, thank') ||
               text.includes('reject') ||
               text.includes('decline') ||
               text.includes('do not accept')) &&
              isVisible(btn)) {
            btn.click();
            console.log('[Auto Cookie Reject] Clicked Sourcepoint button via text:', text);
            return true;
          }
        }
        return false;
      }
    },

    // Osano
    osano: {
      detect: () => document.querySelector('.osano-cm-window, #osano-cm-window'),
      reject: () => {
        const rejectBtn = document.querySelector(
          '.osano-cm-deny, ' +
          'button.osano-cm-denyAll'
        );
        if (rejectBtn) {
          rejectBtn.click();
          return true;
        }
        return false;
      }
    },

    // Usercentrics
    usercentrics: {
      detect: () => document.querySelector('#usercentrics-root'),
      reject: () => {
        // Usercentrics uses shadow DOM
        const root = document.querySelector('#usercentrics-root');
        if (root && root.shadowRoot) {
          const rejectBtn = root.shadowRoot.querySelector(
            'button[data-testid="uc-deny-all-button"]'
          );
          if (rejectBtn) {
            rejectBtn.click();
            return true;
          }
        }
        return false;
      }
    },

    // Complianz (WordPress)
    complianz: {
      detect: () => document.querySelector('#cmplz-cookiebanner-container, .cmplz-cookiebanner'),
      reject: () => {
        const rejectBtn = document.querySelector(
          '.cmplz-deny, ' +
          'button.cmplz-btn-deny'
        );
        if (rejectBtn) {
          rejectBtn.click();
          return true;
        }
        return false;
      }
    },

    // Iubenda
    iubenda: {
      detect: () => document.querySelector('#iubenda-cs-banner, .iubenda-cs-container'),
      reject: () => {
        const rejectBtn = document.querySelector(
          '.iubenda-cs-reject-btn, ' +
          'a.iub-cmp-reject-btn'
        );
        if (rejectBtn) {
          rejectBtn.click();
          return true;
        }
        return false;
      }
    },

    // Klaro
    klaro: {
      detect: () => document.querySelector('.klaro, #klaro'),
      reject: () => {
        const rejectBtn = document.querySelector(
          '.klaro .cn-decline, ' +
          'button.cm-btn-decline'
        );
        if (rejectBtn) {
          rejectBtn.click();
          return true;
        }
        return false;
      }
    },

    // Generic fallback patterns
    generic: {
      detect: () => {
        // Only match elements with explicit cookie/consent/gdpr/privacy in class or id
        const genericSelectors = [
          '[class*="cookie-banner"]',
          '[class*="cookie-consent"]',
          '[class*="cookie-notice"]',
          '[class*="cookie-panel"]',
          '[class*="cookie-popup"]',
          '[class*="cookie-modal"]',
          '[class*="cookie-dialog"]',
          '[class*="cookie-warning"]',
          '[class*="cookie-message"]',
          '[id*="cookie-banner"]',
          '[id*="cookie-consent"]',
          '[id*="cookie-notice"]',
          '[id*="cookie-panel"]',
          '[id*="gdpr"]',
          '[id*="privacy-notice"]',
          '[class*="consent-banner"]',
          '[class*="consent-modal"]',
          '[class*="privacy-banner"]',
          '[class*="privacy-notice"]',
          '[aria-label*="cookie" i]',
          '[aria-label*="consent" i]'
        ];
        const found = document.querySelector(genericSelectors.join(', '));

        // Verify the found element actually contains cookie-related text
        if (found) {
          const text = found.innerText?.toLowerCase() || '';
          if (text.includes('cookie') || text.includes('consent') || text.includes('gdpr') || text.includes('privacy')) {
            return found;
          }
        }

        return null;
      },
      reject: () => {
        // Try common reject button patterns
        const rejectPatterns = [
          // Reject/Decline buttons
          'button[id*="reject"]',
          'button[id*="decline"]',
          'button[id*="deny"]',
          'button[class*="reject"]',
          'button[class*="decline"]',
          'button[class*="deny"]',
          'a[id*="reject"]',
          'a[class*="reject"]',
          // "Only necessary" / "Essential only" buttons
          'button[id*="necessary"]',
          'button[class*="necessary"]',
          'button[class*="essential"]',
          // Aria labels
          'button[aria-label*="Reject" i]',
          'button[aria-label*="Decline" i]',
          'button[aria-label*="Deny" i]',
          'button[aria-label*="necessary only" i]',
        ];

        for (const selector of rejectPatterns) {
          const btn = document.querySelector(selector);
          if (btn && isVisible(btn)) {
            console.log('[Auto Cookie Reject] Clicking generic button via selector');
            btn.click();
            return true;
          }
        }

        // Try matching by button text - expanded list
        // Include plain <a> tags since many consent UIs use links for reject
        const buttons = document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"], span[onclick], div[onclick]');
        const rejectTexts = [
          'reject all', 'reject non-essential', 'reject cookies', 'reject',
          'decline all', 'decline', 'deny all', 'deny', 'refuse',
          'only necessary', 'necessary only', 'essential only', 'necessary cookies only',
          'no thanks', 'no, thanks', 'not now', 'maybe later',
          'nur notwendige', 'ablehnen', 'alle ablehnen',
          'refuser', 'tout refuser', 'continuer sans accepter',
          'rechazar', 'rechazar todo'
        ];

        for (const btn of buttons) {
          const text = btn.textContent.toLowerCase().trim();
          if (rejectTexts.some(t => text.includes(t)) && isVisible(btn)) {
            btn.click();
            return true;
          }
        }

        return false;
      }
    }
  };

  // Check if element is visible
  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0' &&
           el.offsetParent !== null;
  }

  // Fix scroll blocking
  function fixScrollBlocking() {
    const html = document.documentElement;
    const body = document.body;

    // Bail if DOM not ready
    if (!html && !body) return;

    // Remove common scroll-blocking classes
    const blockingClasses = [
      'cookie-consent-open', 'modal-open', 'no-scroll',
      'overflow-hidden', 'gdpr-shown', 'has-cookie-banner'
    ];

    blockingClasses.forEach(cls => {
      if (html) html.classList.remove(cls);
      if (body) body.classList.remove(cls);
    });

    // Reset overflow styles
    if (html && html.style.overflow === 'hidden') html.style.overflow = '';
    if (body && body.style.overflow === 'hidden') body.style.overflow = '';
    if (html && html.style.position === 'fixed') html.style.position = '';
    if (body && body.style.position === 'fixed') body.style.position = '';
  }

  // Main handler - detect and reject
  function handleCookieConsent() {
    if (!isEnabled) return;

    // Don't keep trying if we've already handled a banner on this page
    if (hasHandledBanner) return;

    let handled = false;

    // Try each CMP handler
    for (const [name, handler] of Object.entries(CMP_HANDLERS)) {
      if (handler.detect()) {
        console.log(`[Auto Cookie Reject] Detected: ${name}`);

        // Small delay to ensure DOM is ready
        setTimeout(() => {
          if (handler.reject()) {
            console.log(`[Auto Cookie Reject] Rejected: ${name}`);
            hasHandledBanner = true; // Prevent further attempts
            fixScrollBlocking();
          }
        }, 100);

        handled = true;
        break;
      }
    }

    // Always try to fix scroll blocking
    fixScrollBlocking();

    return handled;
  }

  // Set up MutationObserver for dynamically loaded banners
  function setupObserver() {
    // Wait for document.documentElement to be available
    const target = document.documentElement || document.body;
    if (!target) {
      // Retry after a short delay if DOM not ready
      setTimeout(setupObserver, 10);
      return;
    }

    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false;

      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldCheck = true;
          break;
        }
      }

      if (shouldCheck) {
        // Debounce
        clearTimeout(window._cookieRejectTimeout);
        window._cookieRejectTimeout = setTimeout(handleCookieConsent, 200);
      }
    });

    observer.observe(target, {
      childList: true,
      subtree: true
    });
  }

  // Initialize
  function init() {
    // Check settings
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get(['enabled', 'disabledDomains'], (result) => {
        isEnabled = result.enabled !== false;

        const currentDomain = window.location.hostname;
        if (result.disabledDomains && result.disabledDomains.includes(currentDomain)) {
          isEnabled = false;
        }

        if (isEnabled) {
          // Initial check
          handleCookieConsent();

          // Set up observer for dynamic content
          setupObserver();

          // Check again after page load
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', handleCookieConsent);
          }
          window.addEventListener('load', () => {
            setTimeout(handleCookieConsent, 500);
            setTimeout(handleCookieConsent, 1500); // Extra check for slow-loading banners
          });
        }
      });
    } else {
      // Fallback if storage API not available
      handleCookieConsent();
      setupObserver();
    }
  }

  // Start
  init();
})();
