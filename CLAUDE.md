# @desk/core

Browser code every desk app shares (Clerk loader, central sign-in on people, cross-app https links, references, ⌘K palette, `@` field, record pill and its kind registry, settings dialog, inbox list, emoji picker), consumed as source via `github:elumixor/desk-core`; never published to npm. Keep it dependency-free apart from the Clerk and Svelte peers and Emojibase (`src/emoji/`, its data loaded lazily). Shared Svelte UI: `src/<name>/`, scoped styles on the tokens (Tailwind skips node_modules).
