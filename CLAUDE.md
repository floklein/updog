# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server**: `npm run dev` (starts on port 3000)
- **Build**: `npm run build`
- **Start production**: `npm run start`
- **Lint**: `npm run lint`

## Tech Stack

- Next.js 16 with App Router (`app/` directory)
- React 19 with TypeScript (strict mode)
- Tailwind CSS v4 (CSS-first config with `@import "tailwindcss"`)
- ESLint 9 (flat config format)
- Vercel AI SDK v6 (`ai` package) with AI Gateway for model routing
- Zod for structured output schemas
- Package manager: npm

## Architecture

- **Routing**: File-based routing via Next.js App Router under `app/`
- **Styling**: Tailwind utility classes with CSS custom properties for theming (`--background`, `--foreground`). Dark mode via `prefers-color-scheme` media query.
- **Fonts**: Geist Sans and Geist Mono loaded via `next/font` with CSS variables
- **Path alias**: `@/*` maps to the project root
- **AI Integration**: API route at `app/api/analyze/route.ts` uses `generateObject()` with Google Gemini 2.5 Flash via Vercel AI Gateway (model string: `google/gemini-2.5-flash`)
- **Animal Images**: Dog images from Dog CEO API (`dog.ceo`), cat images from TheCatAPI (`api.thecatapi.com`), both with server-side fuzzy breed name matching
- **Dog/Cat Mode**: User chooses dog or cat breed matching after taking a selfie; mode flows through to API which uses animal-specific AI prompts and image sources
- **Environment**: `AI_GATEWAY_API_KEY` in `.env.local` (gitignored)
