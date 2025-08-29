# Repository Guidelines

## Project Structure & Module Organization
- `src/components`: React components (PascalCase, one component per file).
- `src/contexts`: React Context providers + hooks.
- `src/services`: Client-only service helpers (e.g., `aiClient`, WebRTC/AI glue).
- `src/types`: Shared TypeScript types.
- Entry: `index.html`, `src/main.tsx`, `src/App.tsx`.
- Config: `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`.
- Assets: keep under `src/assets/` (bundled) or `public/` for static files (if added).

## Build, Test, and Development Commands
- `npm run dev`: Start Vite dev server at `http://localhost:5173`.
- `npm run build`: Production build to `dist/`.
- `npm run preview`: Serve `dist/` locally for smoke testing.
- `npm run lint`: Run ESLint on TS/TSX files.
- Note: No test runner is configured yet in this repo.

## Coding Style & Naming Conventions
- **TypeScript**: `strict` mode; no unused locals/params; prefer explicit types; avoid `any`.
- **React**: Functional components + Hooks; follow `react-hooks` ESLint rules; components in PascalCase (`ComponentName.tsx`).
- **Files**: Hooks `useX.ts`, contexts `XContext.tsx`, services camelCase (e.g., `aiClient.ts`).
- **Formatting**: 2-space indent, single quotes, semicolons; keep imports sorted logically.
- **Styling**: Tailwind CSS utility-first; compose classes with `clsx` where helpful.

## Testing Guidelines
- Framework: not set up. If adding, prefer Vitest + React Testing Library.
- Naming: `*.test.ts` / `*.test.tsx` co-located or under `src/__tests__/`.
- Scope: cover critical flows (chat messaging, video UI states, consent workflows); mock network/RTC.
- Scripts: add `test` and `coverage` scripts when introducing tests; keep CI fast.

## Commit & Pull Request Guidelines
- **Commits**: Use Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `ci:`). Write imperative, concise messages.
- **PRs**: Clear description, linked issues, and screenshots/GIFs for UI changes. Small, focused diffs preferred.
- **Quality gates**: Ensure `npm run lint` and `npm run build` pass before requesting review.

## Security & Configuration Tips
- Never commit secrets or PHI. Do not embed provider keys client-side; if used for demos, gate via `VITE_*` envs and document risks.
- Follow privacy-by-default: avoid logging sensitive data in the browser.
- Keep dependencies ESM-compatible; `lucide-react` is excluded in `optimizeDeps`—preserve or adjust intentionally.

