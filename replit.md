# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Minimalist Markdown Editor (mobile app)
- **Path**: `artifacts/markdown-editor/`
- **Type**: Expo (React Native)
- **Preview**: Expo Go (scan QR code) or web at port 24588
- **Screens**:
  - `app/index.tsx` — Recent files / file vault home screen
  - `app/editor.tsx` — Hybrid markdown editor (write/preview/outline modes)
  - `app/history.tsx` — Version history with revert support
- **Key Components**:
  - `components/MarkdownPreview.tsx` — Rendered markdown viewer
  - `components/MarkdownToolbar.tsx` — Sticky keyboard toolbar (H1/H2/B/I/checkbox/code)
  - `components/FileRow.tsx` — File list row with long-press actions
  - `components/NativeAdBanner.tsx` — Native ad entry in file list
- **Context**: `context/FilesContext.tsx` — All file state, auto-save, version history via AsyncStorage
- **Utils**: `utils/markdown.ts` — Markdown parser, time formatting, cursor helpers
- **Theme**: Dark-first, teal/cyan accent (`#5eead4`), from `constants/colors.ts`
- **Persistence**: AsyncStorage (fully offline, no backend needed)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/markdown-editor run dev` — run the mobile app

## Windows Download / Rebuild

This is a standard pnpm workspace. To rebuild on Windows:
1. Install Node.js 20+ and pnpm (`npm i -g pnpm`)
2. Clone/download the project
3. Run `pnpm install` from the root
4. Run `pnpm --filter @workspace/markdown-editor run dev` to start the Expo server
5. Scan the QR code with Expo Go on your phone

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
