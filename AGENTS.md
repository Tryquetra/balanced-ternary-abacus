# AI Agents Guide: Hei-San-Ban (Balanced Ternary Abacus)

This document provides instructions and context for AI Agents working on this repository to maintain high standards of SEO, AEO (Answer Engine Optimization), and performance.

## Project Intent
**Hei-San-Ban** is an educational simulator for **Balanced Ternary Logic** (digits: -1, 0, 1). The goal is to provide a premium, fast, and accessible tool for understanding non-standard numeral systems.

---

## 1. SEO & AEO Best Practices (Answer Engine Optimization)
AI Agents must ensure the project remains crawlable and understandable by both traditional search engines and LLM-based agents.

- **Semantic HTML**: Use only semantic tags (`<main>`, `<article>`, `<section>`, `<nav>`). Avoid div-soups.
- **JSON-LD Schema**:
    - Always update the `WebApplication` schema if the canonical URL or author changes.
    - Maintain the `FAQPage` schema to answer core questions (e.g., "What is balanced ternary?").
- **AEO Hidden Context**: Use `.sr-only` containers for concise, direct definitions of complex terms. This helps LLMs extract "answers" quickly.
- **Multilingual Integrity**:
    - Ensure `hreflang` tags in `index.html` match the logic in `sitemap.xml`.
    - Keep region-specific codes: `pt-br` and `en-us`.
- **Robots.txt**: Explicitly permit AI crawlers (`GPTBot`, `Claude-Web`, `Google-Extended`).

---

## 2. Page Performance Best Practices
The project targets a Lighthouse score of 100 in Performance.

- **Asset Loading**:
    - Use `defer` for all scripts.
    - Use `preconnect` for CDNs (Tailwind, MathJax).
    - Use `fetchpriority="high"` for the primary visual element (Triquetra logo).
- **Image Optimization**:
    - All images MUST be in **WebP** format.
    - Always include `loading="lazy"` and `decoding="async"` for non-LCP images.
    - Explicitly set `width` and `height` to prevent Cumulative Layout Shift (CLS).
- **MathJax Strategy**:
    - MathJax is heavy; it is lazy-loaded in `app.js` only when needed or after the initial render. Do not move it to a synchronous `<script>` in the head.
- **PWA / Service Worker**:
    - Maintain the `service-worker.js` to ensure the app works offline.
    - Ensure cache-busting versioning (e.g., `?v=YYYYMMDD`) for assets.

---

## 3. Implementation Workflow for Agents

1.  **Logical Analysis**: Before modifying math logic, check `POW3` precomputations in `app.js`.
2.  **i18n Sync**: Any new UI text must be added to BOTH `translations` objects in `app.js` (for content) and `main.js` (for UI/Menu).
3.  **Visual Polish**: Follow the "Rich Aesthetics" rule. Use HSL colors, smooth transitions, and glassmorphism where appropriate.
4.  **Verification**: After any change to metadata, re-verify the `sitemap.xml` and `robots.txt` paths.

---
*Created by Antigravity AI - 2025-12-24*
