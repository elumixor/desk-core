# @desk/core

What every desk app shares in the browser, as TypeScript source (no build step; apps bundle it):

- `startClerk(Clerk, publishableKey)` — Clerk loaded with its prebuilt components, which a production instance needs handed in.
- `signInUrl(next)` / `signOutUrl(next)` / `isDeskUrl(url)` — the central sign-in on people (`https://people.desk.atmagaming.com/sign-in?next=`), for apps on `*.desk.atmagaming.com`.
- `parseUrn` / `formatUrn` / `keepPage` / `peoplePerson` — `<app>:<kind>/<id>` names across the suite.

Install: `bun add github:elumixor/desk-core` (imported as `@desk/core`; never published to npm). The repo is public so Vercel builds can fetch it.
