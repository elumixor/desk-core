<script lang="ts">
  /** A label with the characters a search matched drawn in the accent, run by run. */
  let { text, matches = [] }: { text: string; matches?: readonly number[] } = $props();

  const runs = $derived.by(() => {
    const hit = new Set(matches);
    const out: { text: string; hit: boolean }[] = [];
    for (const [index, char] of [...text].entries()) {
      const last = out.at(-1);
      if (last && last.hit === hit.has(index)) last.text += char;
      else out.push({ text: char, hit: hit.has(index) });
    }
    return out;
  });
</script>

{#each runs as run, index (index)}{#if run.hit}<mark class="desk-hit">{run.text}</mark>{:else}{run.text}{/if}{/each}

<style>
  .desk-hit {
    background: none;
    color: var(--accent);
    font-weight: 600;
  }
</style>
