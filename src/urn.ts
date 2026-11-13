/**
 * Links between the suite's apps: one app points at another's record by its absolute https URL, never a URN.
 * `keepPageUrl` / `peoplePersonUrl` / … build them; `parseLink` reads one back to `{ app, kind, id }`, and still
 * reads a legacy `<app>:<kind>/<id>` URN (`keep:page/<id>`) so old text keeps resolving.
 */

import { DESK_DOMAIN } from "./sign-in";

const URN = /^([a-z][a-z0-9-]*):([a-z][a-z0-9-]*)\/(.+)$/;

export interface Urn {
  readonly app: string;
  readonly kind: string;
  readonly id: string;
}

/** A legacy `<app>:<kind>/<id>` URN; prefer `parseLink`, which reads URLs too. */
export const parseUrn = (urn: string): Urn | null => {
  const [, app, kind, id] = URN.exec(urn) ?? [];
  return app && kind && id ? { app, kind, id } : null;
};

export const formatUrn = ({ app, kind, id }: Urn) => `${app}:${kind}/${id}`;

/** An app's origin: `https://<app>.desk.atmagaming.com`. */
export const appUrl = (app: string) => `https://${app}.${DESK_DOMAIN}`;

export const keepPageUrl = (id: string) => `${appUrl("keep")}/p/${encodeURIComponent(id)}`;
export const peoplePersonUrl = (id: string) => `${appUrl("people")}/p/${encodeURIComponent(id)}`;
export const peopleGroupUrl = (id: string) => `${appUrl("people")}/g/${encodeURIComponent(id)}`;
export const paiThreadUrl = (id: string) => `${appUrl("pai")}/#/thread/${encodeURIComponent(id)}`;
export const devSessionUrl = (id: string) => `${appUrl("dev")}/?session=${encodeURIComponent(id)}`;

const BUILDERS: Record<string, (id: string) => string> = {
  "keep:page": keepPageUrl,
  "people:person": peoplePersonUrl,
  "people:group": peopleGroupUrl,
  "pai:thread": paiThreadUrl,
  "dev:session": devSessionUrl,
};

/** The https link to a record; a kind with no page of its own stays a URN. */
export const linkTo = (ref: Urn) => BUILDERS[`${ref.app}:${ref.kind}`]?.(ref.id) ?? formatUrn(ref);

const PATH_KINDS: Record<string, Record<string, string>> = { keep: { p: "page" }, people: { p: "person", g: "group" } };

/** What a link points at: a desk https URL (the forms above) or a legacy URN; null for anything else. */
export function parseLink(link: string): Urn | null {
  const url = URL.parse(link.trim());
  if (!url) return null;
  if (url.protocol !== "https:") return parseUrn(link.trim());
  const app = url.hostname.endsWith(`.${DESK_DOMAIN}`) ? url.hostname.slice(0, -DESK_DOMAIN.length - 1) : "";
  if (!app || app.includes(".")) return null;
  const decode = (id: string | undefined) => (id ? { app, id: decodeURIComponent(id) } : null);
  if (app === "pai") {
    const id = decode(/^#\/thread\/([^/?#]+)/.exec(url.hash)?.[1]);
    return id && { ...id, kind: "thread" };
  }
  if (app === "dev") {
    const id = decode(url.searchParams.get("session") ?? undefined);
    return id && { ...id, kind: "session" };
  }
  const [, short, raw] = /^\/([a-z]+)\/([^/]+)\/?$/.exec(url.pathname) ?? [];
  const kind = short && PATH_KINDS[app]?.[short];
  const id = decode(raw);
  return kind && id ? { ...id, kind } : null;
}
