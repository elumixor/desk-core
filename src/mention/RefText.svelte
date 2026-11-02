<script lang="ts">
  import { parseRefs } from "../refs";
  import type { RefResolver } from "./types";
  import { chip } from "./chip";
  import "./refs.css";

  /** Text with its references drawn as pills, read-only; a pill with a place to go is a link. */
  let { text, resolve, class: klass = "" }: { text: string | null | undefined; resolve?: RefResolver; class?: string } = $props();

  function draw(node: HTMLElement, [value, look]: [string, RefResolver | undefined]) {
    let destroyers: (() => void)[] = [];
    const render = (next: string, lookup: RefResolver | undefined) => {
      for (const destroy of destroyers) destroy();
      destroyers = [];
      node.replaceChildren();
      for (const segment of parseRefs(next)) {
        if (segment.text !== undefined) node.append(segment.text);
        else {
          const made = chip(segment.ref, lookup?.(segment.ref.urn), false);
          destroyers.push(made.destroy);
          node.append(made.el);
        }
      }
    };
    render(value, look);
    return {
      update: ([next, lookup]: [string, RefResolver | undefined]) => render(next, lookup),
      destroy: () => destroyers.forEach((destroy) => destroy()),
    };
  }
</script>

<span class="desk-mention {klass}" use:draw={[text ?? "", resolve]}></span>
