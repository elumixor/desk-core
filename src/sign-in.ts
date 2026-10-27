/**
 * One place to sign in for the whole suite: ppl's `/sign-in?next=`. Clerk's production instance sits on
 * dsk.atmagaming.com, so a session made there is every app's session; an app only sends the browser over and back.
 */

export const DSK_DOMAIN = "dsk.atmagaming.com";
export const PPL_URL = `https://ppl.${DSK_DOMAIN}`;

/** Whether `url` is a place in the suite a sign-in may return to (https, the suite's domain or a subdomain of it). */
export function isDskUrl(url: string) {
  const parsed = URL.parse(url);
  return Boolean(
    parsed &&
      parsed.protocol === "https:" &&
      (parsed.hostname === DSK_DOMAIN || parsed.hostname.endsWith(`.${DSK_DOMAIN}`)),
  );
}

/** Whether this page is served from the suite's own domain, where the central sign-in works. */
export const onDskDomain = (hostname = location.hostname) =>
  hostname === DSK_DOMAIN || hostname.endsWith(`.${DSK_DOMAIN}`);

/** ppl's sign-in page, returning to `next` (default: here). */
export const signInUrl = (next = location.href) => `${PPL_URL}/sign-in?next=${encodeURIComponent(next)}`;

/** ppl's sign-out, returning to `next`. */
export const signOutUrl = (next = location.origin) => `${PPL_URL}/sign-out?next=${encodeURIComponent(next)}`;
