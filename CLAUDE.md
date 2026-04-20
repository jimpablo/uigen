# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# First-time setup
npm run setup          # install + prisma generate + migrate

# Development
npm run dev            # Next.js dev server with Turbopack (http://localhost:3000)
npm run dev:daemon     # Same but runs in background, logs to logs.txt

# Build & lint
npm run build
npm run lint

# Tests
npm test               # run all Vitest tests
npm test -- src/lib/__tests__/file-system.test.ts  # run a single test file

# Database
npm run db:reset       # reset and re-run all migrations
```

Requires `ANTHROPIC_API_KEY` in `.env`. Without it, the app falls back to `MockLanguageModel` in `src/lib/provider.ts` which returns static component code.

For Anthropic-compatible providers (e.g. Zhipu GLM), also set:
```
ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic
MODEL_ID=GLM-5.1
```
Note: the provider fetch interceptor in `src/lib/provider.ts` rewrites the URL path to include `/v1/` since `@ai-sdk/anthropic` omits it when a custom `baseURL` is set.

## Architecture

UIGen is a chat-driven React component generator. Users describe a UI and Claude generates live-previewed JSX — no files written to disk.

### Request flow

```
POST /api/chat  (src/app/api/chat/route.ts)
  ↓
Language model via getLanguageModel()  (src/lib/provider.ts)  — defaults to GLM-5.1 / claude-haiku-4-5
  ↓ tool calls
str_replace_editor / file_manager  (src/lib/tools/)
  ↓ mutates
VirtualFileSystem  (src/lib/file-system.ts)  — in-memory Map, not disk
  ↓ serialized to JSON
Prisma / SQLite  (src/lib/prisma.ts)  — persists per project
  ↓ streaming response
FileSystemContext  (src/lib/contexts/file-system-context.tsx)
  ↓ triggers re-render
JSX Transformer  (src/lib/transform/jsx-transformer.ts)  — Babel standalone
  ↓ blob URLs + import map
PreviewFrame iframe  (src/components/preview/PreviewFrame.tsx)
```

### Key subsystems

**VirtualFileSystem** (`src/lib/file-system.ts`) — all generated files live here. `serialize()` / `deserializeFromNodes()` convert between the Map and plain JSON for DB storage.

**AI tools** (`src/lib/tools/`):
- `str_replace_editor` — view, create, str_replace, insert on VFS files
- `file_manager` — higher-level file operations

**System prompt** (`src/lib/prompts/generation.tsx`) — instructs Claude to always create `/App.jsx` as the entry point, use `@/` import alias for local files, and style with Tailwind.

**JSX Transformer** (`src/lib/transform/jsx-transformer.ts`) — uses `@babel/standalone` to compile JSX → JS, builds an import map with blob URLs for each file, resolves `@/` aliases, and proxies unknown third-party imports through `esm.sh`.

**Preview** (`src/components/preview/PreviewFrame.tsx`) — renders the compiled app in an iframe using ES module `<script type="importmap">` + dynamic `import()`.

**Auth** (`src/lib/auth.ts`, `src/middleware.ts`) — JWT sessions (7-day), HTTP-only cookies. Anonymous users can generate without signing up; their work is tracked in `src/lib/anon-work-tracker.ts`.

### Data model (Prisma/SQLite)

- `User` — email + hashed password
- `Project` — `messages` (JSON chat history), `data` (serialized VFS)

### Layout

Three-panel resizable layout (`src/app/main-content.tsx`):
- **Left** — Chat (`src/components/chat/`)
- **Center** — File tree + Monaco editor (`src/components/editor/`)
- **Right** — Live preview iframe (`src/components/preview/`)

### Import alias

All non-library local imports in generated and app code use `@/` which maps to `/src` (configured in `tsconfig.json`). The VFS mirrors this: files live at paths like `/components/Button.jsx` and are imported as `@/components/Button`.
