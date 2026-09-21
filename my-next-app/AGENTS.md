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
| Search result — "Choose a visa" | `/search-result` | `rxtwECShBU2TwVlnjvXQvI` (IVS) | `754:167951` "SRP" 1280 wide | `682:141406` "srp" 360×1408 (header/intro first built from `666:139769`) | `common/SiteHeader`, `common/Disclaimer`, `common/BottomStickyBar`, `search-result/TripSummary`, `search-result/TripSearchPanel`, `common/PageIntro`, `search-result/VisaPlanResults`, `search-result/VisaPlanFilters`, `search-result/VisaPlanCard` | Web + mweb implemented; tablet uses the mweb layout |
| Traveller details — "Enter Traveller Details" | `/traveller-details` | `rxtwECShBU2TwVlnjvXQvI` (IVS) | `557:14539` "Applicant Details" 1280×1378 (content `582:43762`); filled `601:12589` "Applicant Details-filled" 1280×2031 (left column `601:12672`, right column `601:13113`) | `653:138308` "Applicant Details" 360×1596; filled `999:264577` "Applicant Details" 360×2702 (empty `999:261726`) | `common/SiteHeader`, `common/PageIntro`, `common/BottomStickyBar` (`compact`), `common/DateCalendar`, `common/Toast`, `traveller-details/TravellerDetailsForm`, `traveller-details/FetchDetailsToggle`, `traveller-details/TravellerAccordion`, `traveller-details/DetailsField`, `traveller-details/PrimaryContact`, `traveller-details/ConsentList`, `traveller-details/StepProgress`, `traveller-details/SummaryCard` | Web + mweb implemented; tablet uses the mweb layout |
| Review application — "Review your application" | `/review-application` | `rxtwECShBU2TwVlnjvXQvI` (IVS) | none — above desktop the review is a popup over `/traveller-details` (`595:51941` "Popup with Overlay" 1280×1113) | `999:265215` "Review application" 360×1349 | `common/SiteHeader`, `common/PageIntro`, `common/BottomStickyBar` (`review`), `review-application/ReviewSummary`, `review-application/ReviewConsent`, `review-application/ReviewPayment`, `review-application/ReviewApplicationModal` | mweb implemented; the page's own web layout is PROVISIONAL |

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

Notes for the shared search form:
- mweb option dropdown (destination/nationality) follows `776:206235` "Popup with Overlay": `DropdownSurface` with `modal` (gradient blurred scrim, r20 sheet, grab handle) and the `<desktop` block in `OptionDropdown.module.scss`. The mweb traveller picker follows `776:205142` the same way (`modal`, a "Select Travellers" `sheetTitle`, and `continueLabel.mobile` "Next" vs `.desktop` "Continue"). Nothing uses the plain sheet now. The grab handle is commented out in `DropdownSurface.jsx` on purpose.

Notes for the search result page:
- mweb only: the plan card's "Validity" pill and "· 30 days duration", derived from the plan's `validity`/`stay` facts via `plans.summary`. The card's DOM is shaped for web, and below desktop `.head`/`.headRow`/`.body` are `display: contents` inside a one-column grid (see `VisaPlanCard.module.scss`). web only: the facts columns and the sort button.
- The mweb chip row scrolls sideways and bleeds through the right gutter to the screen edge.
- The two frames use different fixture plans (mweb: four cards, all ₹2,000/₹1,000). The JSON keeps the web frame's three.
- Deliberate deviation: the validity pill label is `#906A0C`, not Figma's `#A97D0E` (3.5:1 on `#FFF8E5`).
- Open Lighthouse items, both inherited from Figma values: mobile Best Practices "legible font sizes" (the 10px disclaimer is ~66% of the page's text), and desktop contrast on "Incl. Taxes" (60% opacity, 2.8:1).

Notes for the traveller details page:
- Flow: `/search-result` → `/traveller-details` → the review step → Juspay payment. The review step is drawn twice, so it behaves twice: below desktop the sticky button posts the form and the `submitTravellerDetails` server action (`src/app/traveller-details/actions.js`) redirects to `/review-application`; at desktop the button opens the popup over this page and only the popup's "Pay" posts, going straight on to `booking.paymentHref`. Either way the action re-validates. See the review application notes below; saving to the booking API is still a TODO there.
- `src/lib/travellerDetails.js` holds the validation shared by the client form and the action: DOB in the past, passport number `^[A-Z0-9]{6,9}$`, expiry at least 6 months out, a primary contact, both consents. Dates are typed as DD-MM-YYYY in text inputs (so the Figma placeholder shows); the calendar icon opens `common/DateCalendar` (see below), not the browser's own picker.
- The "Fetch travellers' information" switch calls the `fetchSavedTravellerDetails` action. The saved profiles in the JSON never reach page props. It fills only empty fields, and switching it off clears only what it filled.
- The sticky button is grey (`inactive`, `aria-disabled`) until the form is complete, but still clickable: a click reveals every error, opens the cards holding them, and focuses the first one.
- The route renders its own `SiteHeader` (not the `(site)` group) so the mweb header reads "Traveller Details" and steps back to `/search-result` (`header` in the JSON).
- mweb only: the stepper under the "Powered by Calleo" pill (`PageIntro` children), the compact 68-tall sticky bar (36 button, 500 12/18). web only: the aside (stepper + Visa/Trip Summary) and the "Enter passenger details · 0/3 Added" row (visually hidden below desktop so the h2 stays).
- The mweb frame draws the switch on; the page still starts off, because turning it on fetches saved details. The subtitle is worded per frame (`intro.subtitle.mobile|desktop`).
- The mweb frame subtracts 118 (Safari chrome + a second status bar) from outline y-values; content starts 64 below the header's top.
- The web **filled** frame `601:12589` supplies everything a value reveals, and the page now matches it at every measured y (±1px):
  - Dates read and are typed as **DD-MM-YYYY** (`01-11-1970`), not `DD/MM/YYYY`.
  - A field holding a value takes the darker `#9999DE` edge; empty ones keep `#C2C2EB`. That's `:not(:placeholder-shown)` in `DetailsField.module.scss`.
  - A **child** — 2 years to under 12, the airline's own fare category — gets the "This booking has been authorised by parent / legal guardian." checkbox between the date of birth and the passport fields, and it counts towards "3/3 Added". The band is `form.rules.childAgeYears` (`{ min: 2, max: 12 }`, max exclusive) and the check is `isChildDob()` in `src/lib/travellerDetails.js`. An infant under 2 does not get it — say so if that's wrong. The card knows the age band because the booking carries the child's `dob` (`booking.travellers[].dob`), which is why that field is shown locked, like the names — the same read-only grey with a `#4B5772` icon.
  - The chosen primary contact's row grows: a "Primary" chip beside the name (500 weight), then their Phone Number and Email Id, ruled off with `#9BA4B8`. The dialling code is a native `<select>` lying invisibly over the flag/code/chevron, so the code keeps Figma's 93 width instead of the widest option's. `form.primaryContact.fields.phone.codes` holds the list; **PROVISIONAL**: only India has a flag asset, so the others show the code alone.
  - Every traveller's card starts open, as the filled frame draws them. The empty frame (557:14539) collapses travellers 2 and 3 behind "Add details", which hid a child's locked date of birth and its guardian checkbox on load.
  - The Visa/Trip Summary cards start open (right column `601:13113`): `#EAF8FF` head, chevron up, each fact's
    label over its value. The two heads' badges differ — the visa card's "E-Visa" is `#25304B`, the trip card's
    flight number `#4B5772` (`.cardTrip .badge` in `SummaryCard.module.scss`).
- The mweb **filled** frame `999:264577` is the newer drawing of this page and supplies what the web frame never showed. Every section y now lines up with it within 2px (the 2 is the shared `PageIntro` pill, 27 tall here against Figma's 25):
  - **Error states**, no longer provisional: field edge and message `#C3272E`, message row = 16 icon + 4 gap + 10/16 text, 4 under the field. An unticked consent turns its box red too (`checkbox-unchecked-error.svg`). Copy comes from Figma: "Invalid Passport number", and the consent's "Read and provide consent before moving forward".
  - A field being typed into takes the `#EAF8FF` fill, label notch included.
  - The switch is worded per frame — mweb "Pre-fill details from IndiGo database.", web "Fetch travellers’ information…" — via `fetchToggle.label.{mobile,desktop}`, rendered like `intro.subtitle`.
  - Email Id carries a standing hint, "This email id will be used for all communications", in the same message row but `--text-body` with the info icon. A field shows its error *or* its note, never both.
  - **A child can't be the primary contact**: their radio's stroke and label go grey. On mweb the card ends with the `#EAF8FF` note strip "Child cannot be a primary contact"; on web (`728:143214`, the contact card's own web frame) the strip is gone and an info icon + 400 10/16 `#4B5772` "Child cannot be primary contact" sits under the child's name instead (`childNote.label.{mobile,desktop}`). The radio keeps `aria-disabled` rather than `disabled`, so it stays in the tab order, and is described by the inline note at both widths; clicks are refused in `onClick`, and `validateTravellerDetails` rejects it server-side too.
  - mweb sizes: switch 44×36 (not 44×44), traveller cards 24 apart with 12 body padding, the switch 12 under the sub-heading, the "Primary" chip 10/16 with 2/8 padding, the radio dot 8, the guardian row top-aligned rather than centred in a 48 row.
- Where the two frames disagree, the newer mweb one wins, except for a child's date of birth: `999:264577` draws it editable, `601:12589` draws it locked, and it stays locked at both widths (the booking supplies it).
- The email hint is drawn only in the mweb frame, but it's a product rule, not mweb styling, so it renders at both widths (the web frame `728:143214` shows the email field mid-typing with no hint). That puts the web radio rows below the chosen block 20 lower than `728:143214`.
- Designs not in Figma yet, all marked `PROVISIONAL`: the "Edit details" label on a completed card, and the web counterpart of the email hint.
- Deliberate deviations: the primary-contact hint uses `--text-body`, not Figma's `#7A85A0` (3.7:1). The "Primary" chip label is `#2C76A5`, not Figma's `#348DC4` (3.4:1 on `#EAF8FF`). The consent error reads "…before moving forward"; Figma types it "befor emoving forward". The "Powered by Calleo" pill keeps the SRP's `#565564`; this frame draws it `#263238`. The radio rows are 16 apart on web, as the filled frame draws them, not the empty frame's 12. The "Visa Summary" title sits 16 above its card, like "Trip Summary"; the filled frame shows 24 there because that card was dragged out of its own wrapper frame.

Notes for the date picker (`common/DateCalendar`, Figma "Calendar" — days 1098:310437, months 1098:311067, years 1098:310617):
- Date of birth and passport expiry share it, at both widths. The head's centre is a button that climbs a level (days → months → years) and a pick comes back down, which is how a 1970 date of birth is reachable without paging the arrow 600 times.
- **Presentation** is DropdownSurface's, as for the search dropdowns: from desktop up a popover hanging 4 under the field's own box and flush with its left edge (`--popover-offset`, added to DropdownSurface for anchors that *are* the box), 375 wide — Figma's width, and within 2 of the web passport expiry field's; below desktop the `modal` sheet over the gradient scrim. The web day frame 1098:310437 also draws an inline mweb card, but all three views present as the sheet, since a picker that changed container halfway through a drill-down would jump under the finger.
- **mweb** follows 999:263696 (days) and 1098:312122 (months), measured exact at 360: the sheet is 420 tall for a five-week month, with a 56 "<PopupModalHeader>" — the 24 close icon 16 off the right edge, a 1 #E0E0F6 rule under it — then 8, the 44 head, and 20 below the last row (the sheet's own 8 gap plus the 12 "Safe Area"). The close bar and the grid run edge to edge, so the sheet zeroes `--sheet-gutter` (added to DropdownSurface beside `sheetClassName`) and `.body` takes the 16 over instead. The sheet, not the card, paints the surface: an opaque card would square off its r20 corners. Its −4 y shadow is the calendar's own — the search dropdown's sheet (776:206237) has none, so it stays out of the shared `.modal .sheet`.
- The close button is drawn in the sheet only. The popover has none in Figma, and needs none: the field it hangs from is still on screen beside it. `useIsDesktop()` decides, the same hook the review popup uses.
- `TravellerAccordion`'s card lost its `overflow: hidden` so the popover can hang out of it. The open head's tinted fill is clipped by its own top radius instead (card radius less the 1 stroke: 11, and 15 at desktop).
- The range comes from the field: `dateLimits` in `TravellerDetailsForm` (DOB `minBirthYear`–today, expiry from today + `passportMinValidityMonths`). It is read from the clock when the picker opens, never during render, so a server/client clock difference can't cause a hydration mismatch. Out-of-range days, months and years are disabled, and a nav arrow greys to Figma's #9BA4B8 (`calendar-nav-*-disabled.svg`) once there is nothing its way.
- The day grid is one tab stop with the arrows moving within it (arrows, Page Up/Down, Home/End), the way a date grid is expected to behave. The neighbouring months' days render as **disabled buttons**, not spans: that keeps the cell in the grid for a screen reader, and axe skips a disabled control when it checks contrast — Figma's #9BA4B8 on white is 2.6:1.
- PROVISIONAL, since no frame draws them: the chosen date and the current month/year take the page's `#EAF8FF` "active" fill and the medium cut; a month or year the range rules out greys like a muted day; and mweb has no year-grid frame, so it reuses the web one's four columns. The "Holiday Tag" dot on a date cell is not built — it is transparent in every live instance and means nothing to a date of birth.
- `common/icons/calendar-close.svg` is byte-identical to `traveller-details/icons/review-close.svg`: the same Figma icon, exported once per owner because a shared component shouldn't reach into a page's asset folder. Worth consolidating if a third caller appears.

Notes for the toast (`common/Toast`, Figma "Toast" — success 595:50608, error 761:196473):
- One component, two variants. The frames differ only in the status edge (2 #218946 / #C3272E), the tint (#F0FFF6 / #F4DEDF) and the icon; the title (600 16/24) and body (400 14/20) stay #25304B on both, which is what keeps them legible on either tint (10.6:1 and 8.7:1). The height is whatever the message wraps to — that, not the variant, is why Figma draws 84 and 64.
- `ToastStack` is where they appear and `useToasts()` is the queue behind it. A hook rather than a context, since this codebase prop-drills everywhere else and one client island raises toasts today. A toast may carry a `key`, and a second toast with the same key replaces the first instead of stacking a duplicate — picking a primary traveller twice says it once.
- **Placement is PROVISIONAL**: both frames are the component alone, with no page around them. The stack is fixed under the sticky header (its 56/80 plus 16) and on the page's own right gutter (16, 44 from desktop), newest first, 12 apart, capped at Figma's 420 and never past the opposite gutter — 358 at 360 wide. A page with a taller header sets `--toast-top` on itself. z-index 20: over the page, under the mobile sheet layer (30), so the date picker covers a toast rather than the other way round.
- Portalled to `<body>`, for the same reason DropdownSurface portals its sheet, and so the live region is in the DOM from the first render — a live region that appears at the same moment as its message is the one case screen readers reliably miss. The region is `aria-live="polite"`; an error toast carries `role="alert"` and so overrides it for itself.
- **Auto-dismiss is opt-in, in seconds**: `durationSeconds` on the toast (the primary-traveller one carries 10, in `form.primaryContact.toast`). Pass nothing and there is no timer at all — the toast waits to be closed, which is what Figma draws, since it gives a close button and no clock. Hovering or focusing a toast holds its timer and letting go restarts it from the top, so nothing vanishes mid-sentence — that, plus the close button, is what keeps a timed toast clear of WCAG 2.2.1.
- `ToastStack` hands `onDismiss` to each toast **unwrapped**, and `useToasts` returns it from `useCallback`. Wrapping it in an arrow here would make a new function every render, the timer effect would tear down and restart on each one, and a toast raised on a form that re-renders as you type would never go. Verified: it still leaves at 10.1s while typing into the passport field.
- **Wired to one thing so far**: choosing a primary traveller raises the success toast, which is what 595:50608's own copy describes ("Primary Traveller" / "Traveller set as primary for future communications"). The error variant is built and verified but has no caller yet — 761:196473's "Re-upload the document for Nishi" belongs to a document-upload flow this repo doesn't have. Raise it with `showToast({ variant: "error", title, message })`.
- The shared chrome (the three icons and the close button's label) is `commonContent.json` → `toast`; the words belong to whatever raises one (`form.primaryContact.toast`). The fetch-details failure keeps its inline message — the mweb frame 999:264577 draws it that way, so it was left alone.

Notes for the review application step (mweb page `999:265215` "Review application" 360×1349, web popup `595:51941` "Popup with Overlay" 1280×1113):
- **The two frames are different containers, not two sizes of one.** Below desktop the review is its own route, `/review-application`, with the shared `SiteHeader` ("Review Application", back to the form), a `PageIntro` and a sticky "Pay" bar. At desktop it's `ReviewApplicationModal`, a 480 panel over `/traveller-details`. `TravellerDetailsForm` picks between them with `useIsDesktop()` (exported by `common/DropdownSurface`): at desktop the sticky button opens the popup and only the popup's "Pay" posts; below it the sticky button posts straight away and the action redirects to the page.
- Everything both surfaces have in common is `review-application/ReviewSummary` (the four cards and the amber strip) and `review-application/ReviewConsent`. The mweb frame is the base — 12 of card padding, Bauhaus 16/20 titles, a Bauhaus plan name, r12 amber strip — and the popup supplies the `>=desktop` overrides: 16 padding, 20/24 titles, a Poppins 400 16/24 plan name, r8 strip. Their type lives in `_typography-review-application.scss`, not under either page.
- `ReviewSummary` renders "Edit" as a `<Link>` when given `editHref` (the page, back to the form) and as a `<button>` when given `onEdit` (the popup, which closes and focuses `passengers-title` — it carries a `tabIndex={-1}` for that — or `primary-contact-toggle`). It takes no state, so it renders in the page's server tree and the popup's client tree alike.
- **Data.** `src/lib/reviewApplication.js` shapes both. Nothing is a second source of truth: the Adult/Child split is `isChildDob`, the same rule that puts the guardian checkbox on a traveller's card, and `buildPriceSummary()` turns the head count into the rows from `review.price` (which adds up to Figma's ₹9,723 for this booking). The popup builds its digest from the live form values; the page reads what the submit carried over.
- **How the page gets the application.** `submitTravellerDetails` writes an `applicationDigest` — dates of birth, who the primary contact is, and their contact details, deliberately **not** passport numbers — into a short-lived httpOnly cookie, and the page reads it. That is a stand-in for the booking API the action's TODO describes; replace both ends with a real application id. Opened without a cookie (a deep link, or an hour later) the page falls back to `bookingDigest()`, so it still renders something true about the booking.
- **Where each button goes.** The form's post carries `intent=pay` only from the popup's button, so the action sends the popup on to `booking.paymentHref` and the sticky button to `booking.reviewHref` (the page). The page's own "Pay" is `payForApplication`, which also goes to `booking.paymentHref`. **`/payment` isn't a route yet** — it's where Juspay goes.
- `readTravellerDetails` reads `contact.dialCode` by name rather than through `CONTACT_FIELDS`, which only lists the two validated fields. Without that the review page shows a phone number with no country code on it.
- Layout, measured against both frames: the popup's head and foot stay put while the cards scroll, its body hugs its content (`flex: 0 1 auto`) so at Figma's 1113 the foot sits straight under the strip, and every y is exact — title 26, cards 110/231/408/555, strip 832, acknowledgement 936, button 1010. The page is exact too (pill 20, cards 157/266/431/566, strip 839, acknowledgement 961, bar 72 with a 40 button), give or take the two notes below.
- Three spacing traps: the popup title's text box is 25 tall against its 28 line height (the mixin follows the box); the amber strip lays its padding out from *inside* its 1 INSIDE stroke (content at 13,13 in a 98-tall mweb frame), so there the border adds to the padding instead of eating into it, unlike the cards above; and the mweb frame leaves 16 between the "Powered by Calleo" pill and the heading where every other mweb frame leaves 11 — the page sets `--page-intro-gap` on itself to say so.
- The scrim is the same two colours as the mweb dropdown overlay (`--overlay-popup-*`); on the popup's 1280×1372 box the handles give 196.63deg with stops at 3.1% and 88.2%. Its background blur is switched off in Figma, so there is none.
- Deliberate deviations: the strip's copy takes `#906A0C`, not Figma's `#A97D0E` (3.5:1 on `#FFF8E5`); the card titles render in Bauhaus Medium because only that cut is subset into the repo, where the web frame types them 400; the "Powered by Calleo" pill keeps the shared mweb style (26.8 tall, 500 14) rather than this frame's 25-tall 400 12/18 and its `#06066A` fill, which puts everything below it 2px low; and "Aarav Kumar Kumar" in both frames is the fixture's first name with the last name appended twice — the booking's `Aarav Kumar` is what renders.
- The visa card's three facts need 313 and the mweb frame gives them 296, so Figma lets them overflow its own card. They wrap here instead (row gap 0, so a wrap costs exactly one 24 line), which puts everything below that card 24 lower at 360. At 390 and up they fit on one line and every y matches.
- PROVISIONAL: the page has no web frame — above desktop the review is the popup, so `/review-application` at that width is a centred 760 column. The payment acknowledgement is drawn ticked in both frames with no error state; it starts empty and the "Pay" button wears the sticky bar's inactive grey until it's ticked, with the form's own consent error under it. That box is client-side only — the two consents the form already posts are what the server checks. Its "Terms and conditions" link points at `/terms`, which doesn't exist yet. The page's breadcrumb (desktop only) is invented, since the mweb frame has none.

- `common/PageIntro` replaced `search-result/ResultsIntro`. `home/VisaSearchIntro` stays separate because its mweb badge is plain text, not a pill.
