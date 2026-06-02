# Willa's × AI 101 — A Live Working Session

A single-page companion site for OBSOLETE's live "AI 101" working session with the Willa's team.
Built in Willa's brand language (Fraunces + DM Sans/Mono, cream + navy + oat-green palette).

## What's on the page
- **Hero** — "Flow for Today" overlay (5 beats), fine print, scrolling tickers
- **Three Questions** — warm-up overlay (answers go in each person's own chat)
- **Two builds** — expandable chapters:
  - *Make me a thing* — 5 principles · copy-paste starter prompts · live generator · live Website POC builder with crowd-participation
  - *Do this for me, every time* — 5 principles · copy-paste starter prompts · live generator · Markdown-automation deep-dive
- **Hacks & Best Practices** — persistent floating drawer, two tabs, copy-paste prompts
- **Live "bring your own use case" generators** — powered by Claude

## Stack
- Static `index.html` (no build step) + one Vercel serverless function
- `api/generate.js` — calls the Anthropic API (`claude-sonnet-4-6`) to write custom starter prompts

## Environment
Set in **Vercel → Project → Settings → Environment Variables** (never commit it):
- `ANTHROPIC_API_KEY` — Willa's Anthropic key (marked Sensitive)

The site degrades gracefully: if the key is missing/unreachable, the generators fall back to a strong built-in starter prompt.

## Deploy
Push to `main` → Vercel rebuilds automatically.
