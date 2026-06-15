#!/usr/bin/env bash
#
# build.sh — package Auto Cookie Reject into a Chrome Web Store-ready zip.
#
# The output filename is stamped with the version from manifest.json so each
# build is traceable to a release. Only the files the extension actually loads
# are included; dev/meta files (README, CHANGELOG, store assets, this script)
# are excluded.
#
# Usage:  ./build.sh
# Output: dist/auto-cookie-reject-v<version>.zip

set -euo pipefail

cd "$(dirname "$0")"

# Read the version from manifest.json (single source of truth).
VERSION="$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")"

OUT_DIR="dist"
OUT_FILE="${OUT_DIR}/auto-cookie-reject-v${VERSION}.zip"

# Files/dirs that ship inside the published extension.
RUNTIME_FILES=(
  manifest.json
  content.js
  background.js
  popup.html
  popup.js
  styles.css
  icons
)

mkdir -p "$OUT_DIR"
rm -f "$OUT_FILE"

# Zip the runtime files, stripping macOS cruft.
zip -r "$OUT_FILE" "${RUNTIME_FILES[@]}" \
  -x "*.DS_Store" \
  -x "icons/icon_original.png" \
  -x "icons/icon_clean.png" \
  -x "icons/icon_new.png" \
  -x "icons/icon_square.png" \
  >/dev/null

echo "Built ${OUT_FILE}"
echo "Contents:"
unzip -l "$OUT_FILE"
