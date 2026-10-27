import type { Clerk } from "@clerk/clerk-js";

type ClerkUiConstructor = NonNullable<NonNullable<NonNullable<Parameters<Clerk["load"]>[0]>["ui"]>["ClerkUI"]>;

export class ClerkLoadError extends Error {
  constructor(what: string) {
    super(`Sign-in could not load ${what}. Check your connection and reload.`);
    this.name = "ClerkLoadError";
  }
}

/** The Frontend API host a publishable key names: `pk_live_<base64 of "clerk.desk.atmagaming.com$">`. */
export const frontendApi = (publishableKey: string) => atob(publishableKey.split("_")[2] ?? "").slice(0, -1);

/**
 * Clerk's prebuilt components ship as a separate bundle served by the instance's Frontend API. A development
 * instance injects it on its own; a production one only mounts components when it is handed the constructor.
 */
export function loadClerkUi(publishableKey: string) {
  return new Promise<ClerkUiConstructor>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://${frontendApi(publishableKey)}/npm/@clerk/ui@1/dist/ui.browser.js`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () =>
      resolve((window as unknown as { __internal_ClerkUICtor: ClerkUiConstructor }).__internal_ClerkUICtor);
    script.onerror = () => reject(new ClerkLoadError("its components"));
    document.head.appendChild(script);
  });
}

/** A loaded Clerk with its components, or the reason it could not load within `timeoutMs`. */
export async function startClerk(ClerkClass: typeof Clerk, publishableKey: string, timeoutMs = 15_000) {
  const clerk = new ClerkClass(publishableKey);
  // Where Clerk's own scripts and its test helpers look for the instance.
  (window as unknown as { Clerk: Clerk }).Clerk = clerk;
  await Promise.race([
    loadClerkUi(publishableKey).then((ClerkUI) => clerk.load({ ui: { ClerkUI } })),
    new Promise((_, reject) => setTimeout(() => reject(new ClerkLoadError("in time")), timeoutMs)),
  ]);
  return clerk;
}
