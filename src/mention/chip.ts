import { type Component, mount, unmount } from "svelte";
import type { Ref } from "../refs";
import type { RefLook } from "./types";

/**
 * A reference drawn as a pill: the record's icon and its name. Built as plain DOM, since it lives inside an editable
 * field the browser owns; `destroy` unmounts the icon when the field redraws.
 */
export function chip(ref: Ref, look: RefLook | undefined, editable: boolean) {
  const el = document.createElement(look?.href && !editable ? "a" : "span");
  el.className = "desk-ref";
  el.dataset.urn = ref.urn;
  el.dataset.label = ref.label;
  if (editable) el.contentEditable = "false";
  if (look?.href) {
    if (el instanceof HTMLAnchorElement) el.href = look.href;
    el.dataset.href = look.href;
  }
  let mounted: Record<string, unknown> | null = null;
  if (typeof look?.icon === "string") {
    const img = document.createElement("img");
    img.src = look.icon;
    img.alt = "";
    el.append(img);
  } else if (look?.icon) {
    const holder = document.createElement("span");
    holder.className = "desk-ref-icon";
    if (look.tint) holder.style.color = look.tint;
    el.append(holder);
    mounted = mount(look.icon as Component<{ size?: number }>, { target: holder, props: { size: 13 } });
  }
  const name = document.createElement("span");
  name.textContent = look?.label || ref.label || ref.urn;
  el.append(name);
  return { el, destroy: () => mounted && void unmount(mounted) };
}
