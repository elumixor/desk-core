# @dsk/core

What every dsk app shares in the browser, as TypeScript source (no build step; apps bundle it):

- `startClerk(Clerk, publishableKey)` — Clerk loaded with its prebuilt components, which a production instance needs handed in.
- `signInUrl(next)` / `signOutUrl(next)` / `isDskUrl(url)` — the central sign-in on ppl (`https://ppl.dsk.atmagaming.com/sign-in?next=`), for apps on `*.dsk.atmagaming.com`.
- `parseUrn` / `formatUrn` / `kipPage` / `pplPerson` — `<app>:<kind>/<id>` names across the suite.

Install: `bun add github:elumixor/dsk-core` (imported as `@dsk/core`; the `@dsk` npm scope belongs to someone else, so this is never published). The repo is public so Vercel builds can fetch it.
