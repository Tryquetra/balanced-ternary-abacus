# Hei-San-Ban: Balanced Ternary Abacus

## Project Overview
**Hei-San-Ban** (平三盤) is an interactive, web-based implementation of a balanced ternary abacus. It serves as an educational tool for understanding the balanced ternary number system (digits -1, 0, +1).

*   **Type:** Static Web Application (PWA)
*   **Hosting:** Optimized for static hosting (e.g., GitHub Pages).
*   **License:** MIT

## Tech Stack
*   **Core:** HTML5, CSS3, JavaScript (ES6+).
*   **Styling:** [TailwindCSS](https://tailwindcss.com/) (loaded via CDN) + Custom CSS (`assets/css/styles.css`).
*   **Math Rendering:** [MathJax](https://www.mathjax.org/) (loaded via CDN) for LaTeX rendering of formulas.
*   **PWA:** Custom Service Worker for offline support.

## Project Structure

```text
C:\Coding\balanced-ternary-abacus\
├── index.html              # Main entry point (DOM structure, meta tags)
├── service-worker.js       # PWA Service Worker (caching, offline support)
├── assets/
│   ├── css/
│   │   └── styles.css      # Custom styling overrides
│   ├── js/
│   │   ├── app.js          # Core abacus logic (state, rendering, math)
│   │   └── main.js         # UI logic (menu, theme, language, PWA reg)
│   └── favicons/           # Icons and manifest
└── README.md               # Project documentation
```

## Key Files Analysis

*   **`index.html`**: Contains the page skeleton, SEO/Social meta tags, and loads external libraries (Tailwind, MathJax).
*   **`assets/js/app.js`**: 
    *   **Core Logic:** Manages the abacus state (`rodValues`), rendering of beads, and click handlers.
    *   **Translations:** Contains the main translation dictionary for the abacus interface and tutorial content.
    *   **MathJax:** Handles dynamic typesetting of math formulas.
*   **`assets/js/main.js`**: 
    *   **Global UI:** Manages the top menu, language routing (URL params/hash), and theme toggling (Light/Dark mode).
    *   **PWA:** Registers the service worker and handles updates.
    *   **Sync:** Exposes `window.setPageLanguage` to sync state with `app.js`.

## Development & Usage

### Running Locally
Since this is a static site without a build step, you can run it with any static file server.

1.  **Python:**
    ```bash
    python -m http.server 8000
    ```
2.  **Node.js (http-server):**
    ```bash
    npx http-server .
    ```

**Note:** Service Workers often require the site to be served over `localhost` or HTTPS. Opening `index.html` directly via `file://` protocol may disable PWA features.

### Building
There is **no build step**. Modify the files directly.
*   **CSS:** Edit `assets/css/styles.css` for custom styles or add Tailwind classes in HTML.
*   **JS:** Edit `assets/js/*.js` files. They are loaded with `defer`.

## Coding Conventions

*   **JavaScript:**
    *   Use modern ES6+ syntax (`const`, `let`, arrow functions, `async/await`).
    *   Code is DOM-centric (direct manipulation via `document.getElementById`).
    *   Avoid external heavy frameworks; keep it lightweight.
*   **Styling:**
    *   Prioritize **TailwindCSS** utility classes for layout and spacing.
    *   Use `assets/css/styles.css` for specific component styling (e.g., beads, abacus rods).
    *   **Dark/Light Mode:** Controlled by `dark` class on `<body>` and Tailwind's `dark:` modifier (or manual CSS overrides).
*   **Internationalization (i18n):**
    *   Translations are stored in JavaScript objects (`translations` constant).
    *   To add a language, update the dictionaries in **both** `app.js` (content) and `main.js` (menu/UI).
    *   Language state is derived from URL (`?lang=pt`, `#en`) or browser defaults.

## Common Tasks

*   **Updating Content:** Modify the text in the `translations` object in `assets/js/app.js`.
*   **Changing Math Logic:** Update `rodValues` handling and `updateDisplay()` in `assets/js/app.js`.
*   **Adding Menu Items:** Update the HTML in `index.html` (inside `#app-menu`) and the translations in `assets/js/main.js`.
