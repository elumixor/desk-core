import { mount, unmount } from "svelte";
import type { PillLook } from "./kinds";
import Pill from "./Pill.svelte";

export {
  BALANCE_BLOCK,
  BALANCE_URL,
  type BalanceBlock,
  balanceBlock,
  balanceKind,
  blockLook,
  blockTime,
} from "./balance";
export { default as CalendarGlyph } from "./CalendarGlyph.svelte";
export {
  forgetPills,
  lookupPill,
  type PillAnswer,
  type PillKind,
  type PillLook,
  type PillStatus,
  pillKind,
  pillKinds,
  pillsIn,
  registerPillKind,
  resolvePill,
} from "./kinds";
export { STATUS_INK, type StatusShape, statusInk, statusShape } from "./status";
export { Pill };

/** A pill mounted into plain DOM (an editor's node view, a pass over rendered text); returns its unmount. */
export function mountPill(
  target: Element,
  props: { urn: string; label?: string; text?: string; look?: PillLook; class?: string },
) {
  const pill = mount(Pill, { target, props });
  return () => void unmount(pill);
}
