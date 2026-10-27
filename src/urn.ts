/**
 * Names for things across the suite, so one app can point at another's record without knowing its database:
 * `kip:page/<id>`, `ppl:person/<id>`, and whatever else an app mints as `<app>:<kind>/<id>`.
 */

const URN = /^([a-z][a-z0-9-]*):([a-z][a-z0-9-]*)\/(.+)$/;

export interface Urn {
  readonly app: string;
  readonly kind: string;
  readonly id: string;
}

export const parseUrn = (urn: string): Urn | null => {
  const match = URN.exec(urn);
  return match ? { app: match[1], kind: match[2], id: match[3] } : null;
};

export const formatUrn = ({ app, kind, id }: Urn) => `${app}:${kind}/${id}`;

export const kipPage = (id: string) => formatUrn({ app: "kip", kind: "page", id });
export const pplPerson = (id: string) => formatUrn({ app: "ppl", kind: "person", id });
