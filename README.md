# GS1 Vault PWA

Offline-first GS1 and in-house barcode scanner.

## Features
- Camera scan via `html5-qrcode`
- Image upload barcode decoding
- Manual GS1/raw input parsing
- AI extraction: 01, 17, 10, 21, 30
- Product matching: exact GTIN, last-8, sequence-6, ambiguity flagging
- Master product CSV/TSV upload
- Manual in-house product creation
- IndexedDB storage with localStorage fallback
- Scan history search, filter, sort
- Export history to CSV/TSV
- Backup and restore full app JSON
- PWA manifest + service worker

## Deploy
Host with HTTPS (GitHub Pages works). Open once online so external font and scanner library assets can be cached for offline reuse.
