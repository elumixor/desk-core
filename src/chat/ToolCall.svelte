<script lang="ts">
  import { chatHost, type TranscriptTool } from "./host";
  import Icon from "./Icon.svelte";
  import { CUT, editedLines, inputText, resultSize, toolArgument, toolLabel } from "./model";

  /** One call in a turn: icon, what was done, on what, how much came back; opened, its input and output in full. */
  let { tool, session }: { tool: TranscriptTool; session?: string } = $props();

  const label = $derived(toolLabel(tool.name));
  const argument = $derived(toolArgument(tool));
  const done = $derived(tool.result !== undefined);
  const preview = $derived((tool.result ?? "").trim());
  let open = $state(false);
  let loading = $state(false);
  let fullInput = $state("");
  let fullOutput = $state<string | undefined>();
  let fetched = false;
  let diff = $state<{ kind: "add" | "del"; text: string }[]>([]);

  async function toggle() {
    open = !open;
    if (!open || fetched || !done || !tool.id || !session) return;
    fetched = true;
    loading = true;
    const call = await chatHost().toolCall(session, tool.id).catch(() => undefined);
    loading = false;
    if (!call) return;
    diff = editedLines(call.name, call.input);
    const text = diff.length ? "" : inputText(call.name, call.input).trim();
    if (text && text !== argument) fullInput = text;
    if (call.result !== undefined) fullOutput = call.result.trim() || "no output";
  }
</script>

<div class="tool-call" class:live={!done} class:open class:loading>
  <button class="tool-call-head" aria-expanded={open} disabled={!done || (!preview && !(tool.id && session))} onclick={toggle}>
    <Icon name={label.icon} size={12} />
    <span class="tool-call-what">{#if label.server}<span class="tool-call-server">{label.server} · </span>{/if}{label.action}</span>
    {#if argument}<span class="tool-call-arg">{argument}</span>{/if}
    <span class="tool-call-size">{done ? resultSize(preview) : "running"}</span>
  </button>
  {#if open && diff.length}<code class="tool-diff">{#each diff as line, i (i)}<span class={line.kind}>{line.kind === "add" ? "+" : "-"} {line.text}</span>{/each}</code>{/if}
  <pre class="tool-call-in">{fullInput}</pre>
  <pre class="tool-call-out">{fullOutput ?? (preview.replace(CUT, "\n…") || "no output")}</pre>
</div>
