# Changelog

All notable changes to **Auto Cookie Reject** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Version numbers here match the `version` field in `manifest.json`, which is what
the Chrome Web Store uses to order releases. Bump rules:

- **PATCH** (`1.0.0` → `1.0.1`): bug fixes, new CMP selectors, no behavior change for users.
- **MINOR** (`1.0.0` → `1.1.0`): new user-facing features (new settings, new UI).
- **MAJOR** (`1.0.0` → `2.0.0`): breaking changes to settings/permissions.

Each store submission must use a version strictly greater than the previously
published one — the store rejects re-uploads of an existing version.

## [Unreleased]

## [1.0.0] - 2026-06-15

Initial public release.

### Added
- Automatic rejection of cookie consent banners for 11 named CMPs: OneTrust,
  Cookiebot, TrustArc, Quantcast, Didomi, Sourcepoint, Osano, Usercentrics,
  Complianz, Iubenda, and Klaro, plus a generic best-effort fallback.
- Immediate CSS hiding of known banner elements at `document_start`.
- `MutationObserver`-based detection for banners injected after load.
- Scroll-unblocking for pages locked behind a consent overlay.
- Popup UI with global on/off, per-site on/off, and blocked-banner statistics.
- 100% local operation — no network requests, no data collection.

### Fixed (pre-release hardening)
- Blocked-banner statistics now actually increment: the content script sends a
  `BANNER_BLOCKED` message to the service worker on every successful rejection
  (previously the listener existed but no message was ever sent, so counts were
  stuck at 0).
- The generic rejecter now scopes its button search to the confirmed
  cookie-banner container instead of the whole document, preventing accidental
  clicks on unrelated "decline" / "no thanks" buttons elsewhere on the page.
- The generic rejecter no longer skips buttons hidden by the extension's own
  `display:none` CSS, so rejection is genuinely registered with the site rather
  than the banner merely being hidden.

[Unreleased]: https://github.com/lokeshd1/auto-cookie-reject/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/lokeshd1/auto-cookie-reject/releases/tag/v1.0.0
