# AGENTS.md

Guidance for AI coding agents working in this repo. `CLAUDE.md` imports this file.

## 0. TL;DR — when the user pastes only a Figma URL

A message that is just a Figma link (optionally with a word like "mweb", "web", or a page name) means **"build or update that page/component pixel-exactly from Figma, following this whole file."** Don't ask for the long prompt again. Run §2 end to end, then report the added/changed file tree.

Work out these three things yourself before asking anything:

| Question | How to answer it |
| --- | --- |
| **Which viewport?** | Frame width ≥ 1024 → **web** (desktop override). ≤ 600 → **mweb** (mobile base). In between → tablet. The `fetch` script prints this. |
| **Which page?** | Match the frame name, content and URL against the **Page registry** (§6). If it's a new page, derive the slug from the frame's main heading, and ask only if it's still ambiguous. |
| **New page, or second viewport of an existing one?** | If the registry already has the page, **update the existing components' SCSS**. Don't create new components or duplicate markup. |

## 1. Project snapshot

- **Next.js 16.3.5 (App Router), React 19, plain JavaScript**, SCSS modules via `sass`. No Tailwind, no TypeScript.
- Next 16 differs from older versions. Read `node_modules/next/dist/docs/` before using an API you're unsure of. For example, `next/image` uses `preload`; `priority` is deprecated.
- Path aliases: `@/*` → `src/*`.
- Layout: `src/app/layout.js` loads fonts, applies `theme-cloud` on `<body>`, and renders `SiteHeader` using `src/data/commonContent.json`.

```
src/
  app/<route>/page.js (+ page.module.scss)   ← composes sections top-to-bottom
  components/common/<Name>/<Name>.jsx|.module.scss  ← reusable (SiteHeader, Breadcrumb…)
  components/<page-slug>/<Name>/…            ← page-specific sections
  data/<pageSlug>Content.json, commonContent.json
  styles/  _primitives _media _mixins _theme(+_theme-mixin) _typography _typography-<page> _shared main.scss
public/assets/common/icons/, public/assets/<page-slug>/{icons,photos}/
public/fonts/<Family>/<Family>-<Weight>-latin.woff2   ← subset files actually used
scripts/figma/figma.mjs  scripts/screenshot.mjs  scripts/lighthouse.mjs
```

## 2. Figma → code workflow

### 2.1 Get the design (MCP first, REST fallback)

1. **If a Figma MCP server is connected** (tools such as `get_design_context`, `get_metadata`, `get_screenshot`, `get_variable_defs`), use it for the node tree, screenshot and variables. Treat any code it generates as a reference only, and rewrite it to this repo's conventions.
2. **Otherwise use the REST API** with the personal access token in `.env` (`FIGMA_TOKEN`). Never print, log, hardcode or commit the token.
   ```bash
   node scripts/figma/figma.mjs fetch "<figma-url>"
   ```
   - Accepts `node-id=557-17402`, `557:17402`, `557%3A17402` and the malformed `node-id-557-17402`.
   - Writes `.figma-cache/<fileKey>-<nodeId>/`, which is gitignored:
     - `outline.txt`: layout, spacing, colors, gradients with handles, effects, typography and text.
     - `assets.txt`: export candidates.
     - `frame.png`: the rendered frame, your visual source of truth.
     - `node.json`: the raw node tree.
   - **Always look at `frame.png`**, and read `outline.txt` in full before writing code.
3. Pull raw JSON for any node whose details the outline abbreviates, for example `gradientHandlePositions`, `relativeTransform`, `blendMode`, `strokeAlign`, per-fill `opacity`, or hidden fills.

### 2.2 Export assets

- Write a manifest (in the scratchpad, not the repo) that maps node IDs to **descriptive** file names. Never use Figma layer names.
  ```json
  { "scale": 2, "quality": 76,
    "svg":    { "617:63773": "public/assets/home/icons/calendar.svg" },
    "raster": { "613:40001": "public/assets/home/photos/country-istanbul.webp" } }
  ```
  ```bash
  node scripts/figma/figma.mjs export "<figma-url>" /path/to/manifest.json
  ```
- **Icons and logos:** export as SVG, from the icon **instance** (e.g. the 24×24 frame), not the inner vector, so the viewBox padding is preserved.
- **Photos:** render the image **node** at 2× with absolute bounds, then convert to WebP. This bakes in Figma's crop and stretch.
  - Don't bake overlays into photos: gradients, text and cards stay as CSS/HTML.
  - Don't use AVIF sources, because on-the-fly AVIF encoding slows the first LCP.
- Assets used by shared components go in `public/assets/common/`. Everything else goes in `public/assets/<page-slug>/icons|photos/`.
- `assets.txt` can miss plain FRAMEs that wrap a vector (e.g. a chevron inside a button). Scan `outline.txt` for those.
- **Don't export:** hidden layers (`visible:false`), off-canvas frames (the outline marks them `OFF-CANVAS(ignore)`; they're parked variants), or other frames' assets.
- **When a file changes, give it a new name.** `/assets/*` is cached for 30 days (`next.config.mjs`).

### 2.3 Content → JSON

- All copy lives in `src/data/<pageSlug>Content.json`, keyed by meaning (`intro.title`, `search.selects[].options`), never by Figma layer name.
  - Store text as typed in Figma. For Figma `textCase: UPPER`, apply `text-transform: uppercase` in CSS instead of uppercasing the string.
  - Trim stray trailing spaces.
- JSON also holds:
  - asset paths
  - alt text
  - link hrefs
  - form option lists
  - `aria-label` strings
  - page `meta` (title and description)
- **Rich text** (for example a title with a highlighted `<span>`) is stored as an HTML string and rendered with `dangerouslySetInnerHTML={{ __html: … }}`.
- **Data flow:** the page imports the JSON and passes content objects down as props. Components never import JSON themselves; the exception is `layout.js` with `commonContent.json`.

### 2.4 SCSS foundation (reuse, extend only when needed)

| File | Purpose |
| --- | --- |
| `_primitives.scss` | Raw hex values as `$color-*`. **The only place hex values may appear.** Group new colors under a page comment. |
| `_media.scss` | The `$breakpoints` map and `@include media(">=desktop")`. Keys: phone-sm 320, phone 375, phone-m 540, tablet 768, tablet-lg 900, desktop 1024, desktop-lg 1280, desktop-ml 1440, desktop-lm 1600, desktop-xl 1920. |
| `_mixins.scss` | `rem($px)`, `defaultTypoStyles($size, $space, $height, $weight, $family)`, the font family vars `$font-poppins-{light,regular,medium,semibold}` and `$font-bauhaus-medium`, and `focus-ring($offset)`. |
| `_theme.scss` | Role-based CSS custom-property maps (`$theme-cloud` is the default on `<body>`). Tokens are named for their **role** (`--border-widget`, `--overlay-ink`), not their color. Alpha colors use `color.change($color-x, $alpha: …)`. |
| `_typography.scss` | One mixin per text style used by **shared** components. |
| `_typography-<page>.scss` | One mixin per text style used by that page, named `<page>-<role>`. |
| `_shared.scss` | `@forward`s everything. Components only need `@use '<relative>/styles/_shared' as *;`. |

### 2.5 Components

Location, naming and structure:
- Put components at `src/components/<page-slug>/<Name>/<Name>.jsx` with a co-located `<Name>.module.scss`. Shared components go in `src/components/common/`.
- Write functional components with a default export. The PascalCase name matches the folder.
- Import styles as `styles` and use camelCase classes (`styles.searchInput`).
- **Server components by default.** Add `"use client"` only for state, effects or browser APIs, and keep that client island as small as possible (e.g. only the carousel). Forms work as native `<form>` elements without JS.

SCSS rules:
- **No raw px and no raw hex in module SCSS.** Use `rem()` for every size and `var(--token)` for every color. If a token is missing, add a primitive and a theme token.
- Mobile styles are the base; web values go in `@include media(">=desktop")` for layout. Typography mixins switch at `>=tablet`.

Images:
- Use `next/image` for every image and icon; never a plain `<img>`.
  - Fixed icons: set `width`/`height`.
  - Photos: use `fill` with a correct `sizes`.
  - The LCP image gets `preload`, and only that one image.

Links:
- Use `next/link` for internal links.
- Pass `prefetch={false}` for links whose route may not exist yet. A 404 prefetch logs a console error, which fails Best Practices.

### 2.6 Figma → CSS translation rules (pixel-exact)

| Figma | CSS |
| --- | --- |
| Auto layout `VERTICAL/HORIZONTAL`, `itemSpacing`, padding | `display:flex`, `gap`, `padding`. |
| `primaryAxisAlignItems: SPACE_BETWEEN` | `justify-content: space-between`. |
| Stroke `INSIDE` w on a frame with padding p | `border: w` and `padding: p − w`. Figma strokes don't consume padding. |
| Stroke with a sub-pixel weight (0.4) | `box-shadow: inset 0 0 0 rem(0.4) var(--…)`. |
| `DROP_SHADOW` offset x,y, radius r, spread s | `box-shadow: x y r s color`, same numbers. |
| `BACKGROUND_BLUR` radius r | `backdrop-filter: blur(r)`, plus the `-webkit-` prefix. This was verified side by side against the Figma render; `r / 2` visibly under-blurs. |
| `GRADIENT_LINEAR` handles (x0,y0)→(x1,y1) | Angle from the handle vector (top→bottom = 180deg). Stops map onto the handle line, so a start handle at y = −0.539 gives a first stop at `-53.9%`. Multiply fill `opacity` into the stop alphas. |
| `rotation: 180°` on an overlay rectangle | The gradient direction flips. Check `relativeTransform`: `[[-1,0],[0,1]]` is only a horizontal mirror, and doesn't flip vertically. |
| `blendMode: LUMINOSITY` / `MULTIPLY`… | `mix-blend-mode: luminosity` / `multiply`, inside a parent with `isolation: isolate`. |
| Text `lineHeightPx` vs node height | When the text box height differs from the line height (e.g. a 16px pill text in a 31px pill), match the **box** so neighbours line up, and note it in the mixin comment. |
| `textCase: UPPER` | `text-transform: uppercase`. |
| Node `opacity` on text | `opacity`. Contrast checkers account for it. |
| Hidden fill or layer (`visible:false`) | Ignore. |
| Frame is 1280 wide with 44px gutters | Page `max-width: rem(1280)`, `padding-inline: rem(44)` from desktop up. |

### 2.7 Web + mweb

- Figma normally provides a web frame and a separate mweb frame.
  - **The mweb frame supplies the base styles.**
  - **The web frame supplies the `@include media(">=desktop")` overrides.**
- If only one viewport exists so far:
  - implement it exactly
  - write sensible fallback styles for the other viewport
  - mark them `PROVISIONAL` in comments
  - make sure nothing overflows horizontally at 320–1440px
- When the second frame arrives:
  - fetch it and export any mweb-only assets
  - replace every `PROVISIONAL` base value with real values
  - add mweb-only copy to the same JSON
  - reuse existing components, and add DOM only if the mweb structure genuinely differs
  - update the registry

## 3. Accessibility, SEO, Lighthouse = 100 (mobile + desktop, all four categories)

- **Semantics:**
  - One `<h1>` per page, and heading levels that never skip.
  - `<section aria-labelledby>` for sections; `<nav aria-label>` with `<ol>` for breadcrumbs, and `aria-current="page"` on the last item.
  - Lists as `ul`/`ol`.
  - A scrollable carousel is a `role="region"` element with `aria-label` and `tabIndex={0}`, plus real `<button>`s that carry `aria-label`.
- **Forms:**
  - Every control has a visible `<label htmlFor>`.
  - Radio groups use `role="radiogroup"` + `aria-labelledby`, or a `fieldset`/`legend`.
  - Custom radios and selects are native elements with `appearance: none`, so they keep keyboard support.
- **Placeholder-grey values:** if Figma shows a low-contrast "example" value (e.g. `#9BA4B8` "Delhi"), render it as a real `placeholder`. Axe skips placeholders; the same text as a value fails contrast.
- **Images:**
  - Content images get real, descriptive `alt` text.
  - Decorative images get `alt=""` + `aria-hidden="true"`.
  - Icons next to a visible label are decorative.
- **Focus:** give every interactive element `:focus-visible { @include focus-ring; }`, and make touch targets at least 24×24.
- **Performance:**
  - Fonts use `next/font/local` with **Latin-subset woff2** (`pyftsubset … --unicodes="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+2026,U+20B9" --flavor=woff2`).
  - Fonts used only below the fold get `preload: false`.
  - Only the one LCP image gets `preload`, and every `fill` image has an accurate `sizes`.
  - Keep client JS minimal.
  - Avoid layout shift: give fixed dimensions to media and absolutely positioned overlays.
- **Best practices:** no console errors (watch for 404 prefetches and hydration mismatches), and no deprecated APIs.
- **SEO:**
  - Page `metadata` (title and description) comes from JSON; the layout's title template appends the site name.
  - `<html lang="en">`.
  - Links need real `href`s: no `#` or `javascript:`.

## 4. Verify before reporting done

**1. Build, lint, and serve.**
```bash
npm run build && npx eslint src scripts
npx next start -p 4125        # background; pick a free port
```

**2. Compare against the design.**
```bash
node scripts/screenshot.mjs http://localhost:4125 1280 /tmp/web.png    # or 390 for mweb
```
- Compare with `.figma-cache/…/frame.png` side by side, and fix the drift.
- Check section y-positions against the outline, within ±2px.

**3. Run Lighthouse on mobile and desktop.**
```bash
node scripts/lighthouse.mjs http://localhost:4125
```
- Every category must be 100 on both form factors. The script lists any failing audits.
- Performance is timing-sensitive: re-run once before concluding it regressed.

**4. Final checks and report.**
- Keyboard pass: tab through the page, confirm every control is reachable and shows a visible focus ring, and arrow keys work in radio groups and selects.
- Report the tree of files added and changed.

## 5. Don'ts

- Don't commit or print `.env` or the Figma token.
- Don't leave `.figma-cache/` or screenshots in the repo.
- Don't reintroduce `globals.css`, `@font-face` blocks, or `overflow-x: hidden` on `html`/`body`: that last one breaks the sticky header.
- Don't put a `max-width` on `body`: `SiteHeader` must span the full viewport. Full-bleed bars keep their background edge to edge and centre an inner container (`max-width: rem(1280)`). Page content is constrained by each page's own `.page` wrapper.
- Don't import Google Fonts. Fonts are local.
- Don't add dependencies without asking. Lighthouse runs through `npx`, and screenshots use Playwright's Chromium if it's installed.
- Don't kill processes this session didn't start. For example, another server may be on port 4123.

## 6. Page registry

| Page | Route | Figma file | Web frame | Mweb frame | Components | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Home — "Find visa options" | `/` | `rxtwECShBU2TwVlnjvXQvI` (IVS) | `557:17402` "Fetch Visa one-way" 1280×1860 | `653:133839` "Landing" 360×1512 | `common/SiteHeader`, `common/Breadcrumb`, `common/Disclaimer`, `common/BottomStickyBar`, `home/VisaSearchIntro`, `home/VisaSearchWidget`, `home/DestinationPromo`, `home/VisaProcessShowcase`, `home/CountryCarousel` | Web + mweb implemented; tablet (768–1023) uses the mweb layout |

Notes for the home page:
- The two frames differ in structure, not just size, so some parts render for one viewport only (CSS `display: none`). Images there stay lazy so the hidden ones never download. The exception is the mobile LCP photo in `DestinationPromo`: it's preloaded, with a desktop `sizes` of 16px.
  - mweb only: header back link / "Visa" title / 6Eskai avatar, `DestinationPromo` ("Explore Dubai"), `Disclaimer`, and the fixed `BottomStickyBar` "Continue" button (Figma `653:133835`). That button submits the search form via `form="visa-search-form"`, and the page adds 84px of bottom padding for it.
  - web only: header logo, breadcrumb, PNR ribbon, Search button, `VisaProcessShowcase`, carousel arrow buttons.
  - The intro subtitle is worded differently per frame (`intro.subtitle.mobile|desktop`).
- The mweb frame's device status bar and Safari chrome (top 94px) aren't part of the page. Subtract 94 from mweb outline y-values when checking positions.
- Deliberate deviation: the disclaimer body is `#7A85A0` in Figma (3.7:1, fails WCAG AA), so it uses `--text-body` (#4B5772).
- The header's `/itinerary` and `/6eskai` links and the disclaimer's `/disclaimer` link don't exist yet.
- Frame `608:25495` (the "60 Days Sticker visa" result card) sits off-canvas at x = 1405 and isn't part of the home page. It's likely the next "visa options" screen.
- The search form currently submits `GET /visa-options`. That route doesn't exist yet.
- `public/assets/fetch-visa/` and the full-size `public/fonts/**/*.ttf` / `*-{Weight}.woff2` files are leftovers from an earlier attempt. Nothing references them.
