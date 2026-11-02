/**
 * References in plain text: `[Label](<urn>)`, a Markdown link whose target is a URN. The label is what the text said
 * when the reference was made, so it reads without the app; an app shows the record's current name when it knows it.
 * Text with references stays text: stored in any column, read by a model, pasted into Markdown.
 */

export interface Ref {
  readonly urn: string;
  readonly label: string;
}

export type RefSegment =
  | { readonly text: string; readonly ref?: undefined }
  | { readonly text?: undefined; readonly ref: Ref };

const REF = /\[([^\]\n]*)\]\(([a-z][a-z0-9-]*:[a-z][a-z0-9-]*\/[^)\s]+)\)/g;

const escapeLabel = (label: string) => label.replace(/[[\]\n]/g, " ").trim();

export const formatRef = ({ urn, label }: Ref) => `[${escapeLabel(label)}](${urn})`;

/** The text cut into plain runs and references, in order; adjacent plain text is one run. */
export function parseRefs(text: string): RefSegment[] {
  const out: RefSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(REF)) {
    const [whole, label = "", urn = ""] = match;
    if (match.index > last) out.push({ text: text.slice(last, match.index) });
    out.push({ ref: { urn, label } });
    last = match.index + whole.length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

/** Every reference the text makes, in order, repeats included. */
export const refsIn = (text: string): Ref[] => parseRefs(text).flatMap((s) => (s.ref ? [s.ref] : []));

/** The text as it reads, each reference by its label. */
export const plainText = (text: string) =>
  parseRefs(text)
    .map((s) => s.text ?? s.ref.label)
    .join("");
