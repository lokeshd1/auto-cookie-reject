# Auto Cookie Reject

A privacy-first browser extension that automatically rejects cookie consent popups and banners.

## Features

- **Auto-reject cookies** - Automatically clicks "Reject All" or "Only Necessary" buttons
- **CSS hiding** - Instantly hides cookie banners while JavaScript handles rejection
- **10+ CMPs supported** - OneTrust, Cookiebot, TrustArc, Quantcast, Didomi, and more
- **100% local** - No data sent to external servers, everything runs in your browser
- **Per-site control** - Enable/disable for specific websites
- **Scroll fix** - Removes scroll-blocking overlays automatically

## Supported Cookie Management Platforms (CMPs)

| CMP | Status |
|-----|--------|
| OneTrust | Supported |
| Cookiebot | Supported |
| TrustArc | Supported |
| Quantcast Choice | Supported |
| Didomi | Supported |
| Sourcepoint | Supported |
| Osano | Supported |
| Usercentrics | Supported |
| Complianz (WordPress) | Supported |
| Iubenda | Supported |
| Klaro | Supported |
| Generic banners | Best-effort |

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `auto-cookie-reject` folder

### From Chrome Web Store

Coming soon!

## Usage

1. **Install the extension** - The extension starts working immediately
2. **Click the icon** - View stats and toggle protection
3. **Per-site control** - Disable for specific sites if needed

## How It Works

### Phase 1: CSS Hiding (Immediate)
The extension injects CSS that immediately hides known cookie banner elements. This provides instant visual relief while JavaScript loads.

### Phase 2: Auto-Reject (100-500ms)
The content script detects the specific CMP (Cookie Management Platform) being used and clicks the appropriate "Reject All" button.

### Phase 3: Scroll Fix
Many cookie banners block page scrolling. The extension removes these restrictions automatically.

## File Structure

```
auto-cookie-reject/
├── manifest.json      # Extension manifest (MV3)
├── content.js         # Main content script - detection & rejection
├── styles.css         # CSS rules for hiding banners
├── background.js      # Service worker for stats & settings
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic
├── icons/             # Extension icons
│   └── icon.svg       # Source icon
└── README.md          # This file
```

## Development

### Adding Support for New CMPs

1. Open `content.js`
2. Add a new handler to the `CMP_HANDLERS` object:

```javascript
newcmp: {
  detect: () => document.querySelector('#newcmp-banner'),
  reject: () => {
    const btn = document.querySelector('#newcmp-reject-btn');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }
}
```

3. Add corresponding CSS selectors to `styles.css`

### Testing

1. Load the extension in developer mode
2. Visit sites using different CMPs:
   - OneTrust: salesforce.com, bbc.com
   - Cookiebot: cookiebot.com
   - Quantcast: quantcast.com
   - TrustArc: trustarc.com

### Building for Production

1. Create PNG icons from the SVG:
   ```bash
   # Using ImageMagick
   convert -background none icons/icon.svg -resize 16x16 icons/icon16.png
   convert -background none icons/icon.svg -resize 48x48 icons/icon48.png
   convert -background none icons/icon.svg -resize 128x128 icons/icon128.png
   ```

2. Zip the extension folder (excluding .git, README, etc.)

## Privacy

This extension:
- Does NOT collect any user data
- Does NOT send any data to external servers
- Stores settings locally using Chrome's storage API
- Operates entirely within your browser

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

Priority areas:
- Adding support for more CMPs
- Improving detection reliability
- Translations

## License

MIT License - see LICENSE file

## Acknowledgments

- Inspired by "I don't care about cookies" (RIP)
- CSS patterns from Fanboy's Cookie List
- Detection strategies from Consent-O-Matic
