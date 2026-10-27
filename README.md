# @desk/core

What every desk app shares in the browser, as TypeScript source (no build step; apps bundle it):

- `startClerk(Clerk, publishableKey)` — Clerk loaded with its prebuilt components, which a production instance needs handed in.
- `signInUrl(next)` / `signOutUrl(next)` / `isDeskUrl(url)` — the central sign-in on people (`https://people.desk.atmagaming.com/sign-in?next=`), for apps on `*.desk.atmagaming.com`.
- `parseUrn` / `formatUrn` / `keepPage` / `peoplePerson` — `<app>:<kind>/<id>` names across the suite.
- `@desk/core/tokens.css` — the suite's look as CSS custom properties, light and dark, with a Tailwind 4 `@theme` block over them.
- `PALETTES` / `applyTheme(choice)` / `onSystemTheme(listener)` — the named palettes and choosing between them.

## Design tokens

```css
@import "tailwindcss";
@import "@desk/core/tokens.css";
```

The page follows the system's light or dark. `data-theme="light" | "dark"` on the root forces one; `data-palette="<id>"`
picks a named palette (`PALETTES` lists them; `applyTheme({ mode, light, dark })` sets both attributes). Defaults: Nord
Light and pai Dark.

- Colours: `--bg`, `--panel`, `--panel-2`, `--line`, `--line-2`, `--text`, `--dim`, `--accent`, `--accent-ink`, `--busy`,
  `--idle`, `--warn`, `--hot`, `--code-bg`, `--selection` (what a palette sets); `--canvas`, `--canvas-gradient`,
  `--surface`, `--surface-2`, `--surface-3`; the signals `--hand` (waits on the person), `--act` (an action), `--act-btn`,
  `--ok`, `--model`, `--effort`, `--mine-bg`, `--pill-bg`; ink at an opacity: `--ink`, `--ink-70`, `--ink-45`, `--ink-30`,
  `--ink-20`, `--ink-10`, `--ink-5` — draw secondary text and hairlines with these, never a new grey.
- Shape: `--r-xs` 4, `--r-sm` 6, `--r` 10, `--r-lg` 14, `--r-xl` 19, `--r-pill`; shadows `--soft-shadow`, `--card-shadow`,
  `--panel-edge` (a panel's hairline and lift), `--shadow`.
- Type: `--font-ui` (Inter), `--font-body` (SF Pro Rounded), `--mono`; steps `--meta`/`--meta-lh` 11/14, `--ui`/`--ui-lh`
  14/20, `--body`/`--body-lh` 15/22. Load Inter yourself (Google Fonts).
- Spacing `--space-1`…`--space-8` on a 4px grid, `--gutter` 50px; motion `--dur-fast|base|slow`, `--ease`, `--ease-spring`.
- Tailwind utilities: `bg-surface`, `text-ink-45`, `border-line`, `text-act`, `rounded-lg`, `shadow-soft`, `font-ui`,
  `text-body`, …

An app extends the system by redefining any of these on `:root` after the import, or adding its own beside them.

Install: `bun add github:elumixor/desk-core` (imported as `@desk/core`; never published to npm). The repo is public so Vercel builds can fetch it.
