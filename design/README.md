# App icon

`icon-source.png` is the supplied Red Pushup 2027 Brush Icon artwork (1254 × 1254).
The previous source and public icon set are preserved in `archive/pre-2027-brush/`.
The legacy deployed assets under `docs/` remain untouched until deployment cutover.

Public derivatives: 16/32px favicons, multi-resolution ICO (16/32/48), 180px Apple
icon, 192/512px PWA icons, and 192/512px maskable icons. `icon.png` and `pushup.png`
are 512px compatibility copies. All PNGs have an opaque black background.
Maskable artwork occupies 56% of the square, keeping its corners inside the
central 80%-diameter safe circle. Derivatives use ImageMagick Lanczos resizing.

The service-worker cache suffix and browser-icon query strings identify this
artwork revision so existing caches can refresh through the app's update flow.
Existing installed home-screen icons may require reinstalling the app after
publication, depending on the operating system.

To roll back, restore the archived assets to their original locations and change
the service-worker cache suffix and browser-icon query strings to a new revision.

Header wordmark: `src/assets/brand/pushup-wordmark.webp` is the white PUSHUP lettering cut from
`icon-source.png` (transparent background, 320 px wide). The year stays live text in `BrandMark.jsx`.
