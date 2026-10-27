/**
 * One place to sign in for the whole suite: people's `/sign-in?next=`. Clerk's production instance sits on
 * desk.atmagaming.com, so a session made there is every app's session; an app only sends the browser over and back.
 */

export const DESK_DOMAIN = "desk.atmagaming.com";
export const PEOPLE_URL = `https://people.${DESK_DOMAIN}`;

/** Whether `url` is a place in the suite a sign-in may return to (https, the suite's domain or a subdomain of it). */
export function isDeskUrl(url: string) {
  const parsed = URL.parse(url);
  return Boolean(
    parsed &&
      parsed.protocol === "https:" &&
      (parsed.hostname === DESK_DOMAIN || parsed.hostname.endsWith(`.${DESK_DOMAIN}`)),
  );
}

/** Whether this page is served from the suite's own domain, where the central sign-in works. */
export const onDeskDomain = (hostname = location.hostname) =>
  hostname === DESK_DOMAIN || hostname.endsWith(`.${DESK_DOMAIN}`);

/** people's sign-in page, returning to `next` (default: here). */
export const signInUrl = (next = location.href) => `${PEOPLE_URL}/sign-in?next=${encodeURIComponent(next)}`;

/** people's sign-out, returning to `next`. */
export const signOutUrl = (next = location.origin) => `${PEOPLE_URL}/sign-out?next=${encodeURIComponent(next)}`;
