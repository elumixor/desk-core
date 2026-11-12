<script lang="ts">
  /** A calendar, drawn like the lucide icons the apps use, so core needs no icon package. */
  let { size = 16, strokeWidth = 2 }: { size?: number | string; strokeWidth?: number } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M8 2v4M16 2v4" />
  <rect width="18" height="18" x="3" y="4" rx="2" />
  <path d="M3 10h18" />
</svg>
