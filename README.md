# @desk/core

What every desk app shares in the browser, as TypeScript source (no build step; apps bundle it):

- `startClerk(Clerk, publishableKey)` — Clerk loaded with its prebuilt components, which a production instance needs handed in.
- `signInUrl(next)` / `signOutUrl(next)` / `isDeskUrl(url)` — the central sign-in on people (`https://people.desk.atmagaming.com/sign-in?next=`), for apps on `*.desk.atmagaming.com`.
- `keepPageUrl` / `peoplePersonUrl` / `peopleGroupUrl` / `paiThreadUrl` / `devSessionUrl` / `linkTo` build absolute https links between apps; `parseLink` reads one (or a legacy `<app>:<kind>/<id>` URN) back.
- `@desk/core/tokens.css` — the suite's look as CSS custom properties, light and dark, with a Tailwind 4 `@theme` block over them.
- `PALETTES` / `applyTheme(choice)` / `onSystemTheme(listener)` — the named palettes and choosing between them.
- `menuKey(event)` / `latinKey(event)` / `isPaletteShortcut(event)` — list keys as every desk list reads them: Ctrl+J /
  Ctrl+K are Down / Up, on any keyboard layout.
- `fuzzyMatch` / `fuzzyFilter` — finding things by name as the person types, with the characters that matched.
- `formatRef` / `parseRefs` / `refsIn` / `plainText` — references in plain text: `[Label](<link>)`.
- `@desk/core/palette` — `<CommandPalette>`, the suite's ⌘K, and `<ItemList>`, the grouped rows it and every menu draw.
- `@desk/core/mention` — `<MentionField>`, text that edits in place where `@` points at a record, and `<RefText>`, the same
  text read-only with its references as pills.
- `@desk/core/pill` — `<Pill urn>`, a record named in text drawn the same in every app, and the kind registry
  (`registerPillKind`) that tells it what each URN is; `balanceKind` for Balance calendar blocks.
- `@desk/core/inbox` — `<InboxList>`, what an app tells its person about: rows under headings, unread ones marked,
  "Mark all read" and optional filters.
- `@desk/core/settings` — `<SettingsDialog>`, the suite's settings (Svelte 5): ⌘⇧, opens it, a searchable rail of
  sections on the left, every section in one scroll on the right.

## Run it locally

```sh
bun install
bun run dev        # devkit: the tests in watch mode
```

## Settings dialog

```svelte
<script lang="ts">
  import { SettingsDialog, type SettingsSection } from "@desk/core/settings";
  import { Palette, Users } from "lucide-svelte";

  const sections: SettingsSection[] = [
    { id: "members", label: "Members", icon: Users, keywords: "invite people role" },
    { id: "appearance", label: "Appearance", icon: Palette, keywords: "theme dark light" },
  ];
  let open = $state(false);
</script>

<SettingsDialog {sections} bind:open>
  {#snippet section(entry)}
    {#if entry.id === "members"}<Members />{:else}<Appearance />{/if}
  {/snippet}
</SettingsDialog>
```

Render it once near the app's root: it listens for ⌘⇧, itself (`shortcut={false}` to opt out) and closes on Escape.
`bind:active` is the section in view, so a menu can open it onto one (`active = "members"; open = true`). Search
matches a section's `label` and `keywords`; each section draws its own heading. It is styled with the tokens below, so
the app needs `tokens.css` and nothing more.

## ⌘K palette

```svelte
<script lang="ts">
  import { CommandPalette, type PaletteItem } from "@desk/core/palette";
  const items: PaletteItem[] = [
    { key: "go:home", group: "Go to", label: "Home", icon: House, run: () => goto("/") },
    { key: "c:1", group: "Categories", label: "Groceries", quiet: true, run: () => goto("/c/1") },
  ];
</script>

<CommandPalette {items} search={(query, signal) => api.search(query, { signal })} />
```

It listens for ⌘K itself (`shortcut={false}` to opt out; `bind:open` to open it from a button). With nothing typed it
lists the rows that are not `quiet`; typing filters every row by label and `keywords`, best first, groups kept together,
and adds what `search` returns. Up / Down or Ctrl+J / Ctrl+K move, Enter runs, Escape closes.

## References and `@`

A reference is a Markdown link to the record's https URL, `[Groceries](https://keep.desk.atmagaming.com/p/<id>)` (a legacy URN still parses), so text that holds them stays text.

```svelte
<MentionField value={note} label="Note" source={(query) => filterItems(records, query, 8)} resolve={look} onsave={save} />
<RefText text={note} resolve={look} />
```

`source` answers what `@query` should offer (`MentionItem`s: list rows with a `urn`); `resolve(urn)` gives a pill its
current name, icon and `href`, falling back to the label the text holds. The field saves on blur or Enter (`multiline`
keeps Enter for lines), Escape puts it back; in the menu Up / Down or Ctrl+J / Ctrl+K move, Enter or Tab picks.

## Pills

A pill is a record named in text: a round wash of the text colour, the record's mark (with a link arrow when it lives
in another app), its title clipped to fit, muted meta and a status circle. What it shows comes from the kind registered
for its URN, so adding a kind is one call and no change to the component:

```ts
import { balanceKind, registerPillKind } from "@desk/core/pill";

registerPillKind({
  name: "git:commit",
  pattern: /^git:\S+@[0-9a-f]{7,40}$/,
  icon: GitCommitHorizontal,
  external: true,
  resolve: async (urn) => ({ title: "Fix login", meta: "pai", href: "https://github.com/…" }),
});
registerPillKind(balanceKind((id) => api.balanceBlock(id)));
```

```svelte
<Pill urn="balance:block/7k6g0oetko6g28n8g6iu5vndks" label="Exam" />
```

A kind has a `pattern` (tested against the whole reference), `resolve(urn)` (a `PillLook`: `title`, `meta`, `color`,
`status`, `icon`, `href`, `hint`, `done`, `external`, `data`: the record, for `open`/`attach`; `null` = not
found), `icon` and `tint`, `external`, and what a press does:
`href` or `open`. `attach(urn, look)` adds behaviour once resolved (a hover preview, what a copy gives). A sync
resolver is read reactively; an async one is asked once a minute per URN across the page (`fresh`). `label` is shown
until the record answers, and when its look has no title; `text` instead keeps the reference as plain text until it is found. `mountPill(el, props)`
puts one into plain DOM (an editor's node view, a pass over rendered text); `pillsIn(text)` finds what the registered
kinds claim.

`balanceKind(read)` is `balance:block/<id>`: the block's title, its time (`blockTime`: "Fri 20 Nov · 11:30–12:15"),
its sphere's colour on a calendar mark; a press opens it in Balance. Balance sits behind its own sign-in, so `read` is
the app's server asking Balance's MCP `get_event` with a Balance MCP key.

Restyle with `--pill-max` (the widest a pill gets) and `--pill-halo` (the ring behind the link arrow; `--surface`).

## Inbox

The app keeps the notifications and what opening one does; the list draws them the same in every app.

```svelte
<InboxList {groups} unread={count} filters={[{ value: "relevant", label: "Relevant" }, { value: "all", label: "All" }]} bind:filter onopen={open} onreadall={readAll}>
  {#snippet lead(item)}<Avatar name={item.actor} />{/snippet}
</InboxList>
```

`groups` are `{key, title?, items}`; an item is `{id, title, text?, meta?, unread, quiet?}` (quiet rows are drawn dimmer:
kept for the record, nothing to act on). `lead` draws a row's avatar or icon, `heading` a group's icon, `aside` something
at a row's end.

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
  `--ink-20`, `--ink-10`, `--ink-5` — draw secondary text and hairlines with these, never a new grey; `--accent-soft`
  (an accent wash); tags `--tag-gray|brown|orange|yellow|green|blue|purple|pink|red` on `--tag-ink`, each a hue mixed
  into the surface at `--tag-mix`.
- Shape: `--r-xs` 4, `--r-sm` 6, `--r` 10, `--r-lg` 14, `--r-xl` 19, `--r-pill`; shadows `--soft-shadow`, `--card-shadow`,
  `--panel-edge` (a panel's hairline and lift), `--float-shadow` (menus, popovers, a peek), `--shadow`.
- Type: `--font-ui` (Inter), `--font-body` (SF Pro Rounded), `--mono`; steps `--meta`/`--meta-lh` 11/14, `--ui`/`--ui-lh`
  14/20, `--body`/`--body-lh` 15/22. Load Inter yourself (Google Fonts).
- Spacing `--space-1`…`--space-8` on a 4px grid, `--gutter` 50px; motion `--dur-fast|base|slow`, `--ease`, `--ease-spring`.
- Tailwind utilities: `bg-surface`, `text-ink-45`, `border-line`, `text-act`, `bg-tag-blue`, `rounded-lg`,
  `shadow-soft`, `shadow-float`, `font-ui`, `text-body`, …

An app extends the system by redefining any of these on `:root` after the import, or adding its own beside them.

Install: `bun add github:elumixor/desk-core` (imported as `@desk/core`; never published to npm). The repo is public so Vercel builds can fetch it.
