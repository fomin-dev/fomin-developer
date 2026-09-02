# fomin-developer

**Live site:** [fomin-developer.pages.dev](https://fomin-developer.pages.dev/)

A responsive, multilingual portfolio website for a freelance developer specialising in Telegram bots and business websites. The experience is presented as Fomin OS: an Ubuntu/macOS-inspired desktop shell that opens a portfolio app with editorial case studies, services, pricing, contact channels and an open-source utility. The project is intentionally built with plain HTML, CSS and JavaScript, keeping the deployed site lightweight and the source easy to maintain.

![Portfolio preview](docs/preview-hero.jpg)

## What the site provides

The site presents services, starting prices, three client case studies, an open-source temporary email creator and direct contact channels inside the Fomin portfolio app. It supports Russian, English and Ukrainian UI text. The desktop shell includes a system bar, wallpaper, desktop icons, dock, window controls, workspace navigation, animated view transitions and case-study modals. The content remains accessible without relying on the visual effects; JavaScript progressively enhances language selection, app controls, keyboard shortcuts, workspace navigation and modal interactions.

## Open-source product

The site includes [`create_emails.py`](create_emails.py), a dependency-free Python CLI for creating temporary email addresses through GuerrillaMail and Tempmail. The complete setup guide, command reference, examples and responsible-use notes are available in [`GUIDE_TEMP_EMAILS.md`](GUIDE_TEMP_EMAILS.md).

| Area | Implementation |
|---|---|
| Markup and styles | Semantic HTML5, custom CSS properties, Grid and Flexbox |
| Interactivity | Vanilla JavaScript and native browser APIs: desktop shell, app window, dock, keyboard shortcuts, parallax, view transitions and case modals |
| Localisation | `data-i18n`, `data-i18n-aria-label` and `data-i18n-alt` attributes with JSON dictionaries for `ru`, `en` and `uk` |
| Images | JPEG fallback plus generated WebP sources, including responsive variants |
| Offline behaviour | Versioned service worker; HTML and language dictionaries are network-first to reduce stale UI risk |
| Deployment | Cloudflare Pages static hosting |

## Accessibility and reliability

The project includes a skip link, a high-visibility `:focus-visible` style, a keyboard-accessible mobile menu with Escape support and focus containment, gallery buttons with arrow-key navigation, image alternative-text localisation, reduced-motion handling and clearly visible content without a preloader. Interactive motion is limited to capable devices and pauses when the page is not visible.

The Ukrainian language resource uses the standard `uk` code. The displayed language option remains `UA` for visitors, while the document's `lang` attribute is updated to `uk` for browsers and assistive technology.

## Project structure

```text
index.html                  Fomin OS shell, app window and default Russian content
css/style.css               Readable Fomin OS / app / responsive stylesheet
css/style.min.css           Generated minified stylesheet
js/main.js                  Desktop controls, views, localization and case-modal logic
js/main_min.js              Generated minified script
i18n/ru.json                Russian dictionary
i18n/en.json                English dictionary
i18n/uk.json                Ukrainian dictionary
assets/                     JPEG originals and generated WebP assets
scripts/build.js            CSS/JS minification and responsive WebP generation
scripts/check.js            Static quality checks
create_emails.py            Temporary email creator CLI
GUIDE_TEMP_EMAILS.md        Product setup and usage guide
sw.js                       Service worker
_headers                    Cloudflare Pages security and cache headers
robots.txt, sitemap.xml     Search crawler directives
```

## Local development

Install dependencies once, then build and serve the project over HTTP. Opening `index.html` as `file://` is not supported because the language dictionaries are fetched at runtime.

```bash
npm ci
npm run build
npm run check
npx serve .
```

## Quality gate

Run the following commands before committing or deploying changes:

```bash
npm run build
npm run test
```

The build minifies CSS and JavaScript and regenerates full-size plus responsive WebP variants from every JPEG source. The test command checks that every translation attribute in the page has a non-empty value in all three dictionaries, confirms the use of `uk`, and verifies that every referenced asset exists.

## Making changes

Edit source files only: `index.html`, `css/style.css`, `js/main.js`, the dictionaries in `i18n/`, and original JPEG files in `assets/`. Do not edit `css/style.min.css`, `js/main_min.js` or generated `*-320.webp`, `*-480.webp` and `*-960.webp` files by hand; regenerate them with `npm run build`.

The service worker cache name must be increased whenever cached runtime behaviour changes in a way that requires existing visitors to receive a fresh app shell. The current shell uses `fomin-portfolio-v8-desktop`. The cache strategy deliberately prefers the network for the document and dictionaries, while static assets can be served from the current versioned cache.

## Deployment

Cloudflare Pages deploys the repository automatically when the configured production branch receives a new commit. The expected build command is `npm run build` and the output directory is the repository root.

© 2026 Nikita Fomin
