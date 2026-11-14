<script lang="ts" module>
  /** The marks one press away. */
  export const QUICK_REACTIONS: readonly string[] = ["👍", "❤️", "😂", "👀", "✅", "🙏"];
</script>

<script lang="ts">
  import Icon from "../chat/Icon.svelte";
  import EmojiPicker from "./EmojiPicker.svelte";

  /**
   * Quick reactions in a row and a button for the rest, which opens the picker in the row's place (Escape there goes
   * back to the row). A press gives `onpick` the emoji; `mine` are the ones the person has put there already, lit, so
   * the host can take one off on a second press. Bare, for a host's menu or floating surface.
   */
  let {
    onpick,
    mine = [],
    quick = QUICK_REACTIONS,
  }: { onpick: (emoji: string) => void; mine?: readonly string[]; quick?: readonly string[] } = $props();

  let picking = $state(false);
</script>

{#if picking}
  <div class="reaction-picker"><EmojiPicker {onpick} onclose={() => (picking = false)} /></div>
{:else}
  <div class="reaction-bar" role="toolbar" aria-label="React">
    {#each quick as emoji (emoji)}
      <button type="button" class="quick" class:mine={mine.includes(emoji)} aria-pressed={mine.includes(emoji)} aria-label="React {emoji}" onclick={() => onpick(emoji)}>{emoji}</button>
    {/each}
    <button type="button" class="more" title="More reactions" aria-label="More reactions" onclick={() => (picking = true)}><Icon name="smilePlus" size={17} /></button>
  </div>
{/if}

<style>
  .reaction-bar {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .reaction-picker {
    width: min(340px, calc(100vw - 32px));
  }

  .quick,
  .more {
    display: grid;
    width: 32px;
    height: 32px;
    padding: 0;
    place-items: center;
    border: 0;
    border-radius: var(--r-pill);
    background: none;
    cursor: pointer;
    transition:
      background-color var(--dur-fast) var(--ease),
      color var(--dur-fast) var(--ease);
  }

  .quick {
    font-size: 20px;
    line-height: 1;
  }

  .quick.mine {
    background: var(--accent-soft);
    box-shadow: inset 0 0 0 1px var(--accent);
  }

  .more {
    color: var(--ink-45);
  }

  @media (hover: hover) {
    .quick:not(.mine):hover,
    .more:hover {
      background: var(--ink-5);
    }

    .more:hover {
      color: var(--ink);
    }
  }
</style>
