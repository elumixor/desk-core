<script lang="ts">
  import { tick } from "svelte";
  import { menuKey } from "../keys";
  import ItemList from "../palette/ItemList.svelte";
  import { formatRef, parseRefs } from "../refs";
  import { chip } from "./chip";
  import type { MentionItem, MentionSource, RefResolver } from "./types";
  import "./refs.css";

  /**
   * Text that edits in place and can point at things: `@` opens a menu of the app's records (`source`), and the one
   * picked goes in as a pill. Saved as plain text with Markdown-link references (`[Name](https link)`), on blur or Enter;
   * Escape puts it back. Up / Down or Ctrl+J / Ctrl+K move in the menu, Enter or Tab picks, Escape closes it.
   * `multiline` keeps Enter for new lines (Shift+Enter in one line is never a line).
   */
  let {
    value,
    source,
    resolve,
    onsave,
    onopen,
    ondone,
    placeholder = "",
    label,
    multiline = false,
    autofocus = false,
    class: klass = "",
  }: {
    value: string | null | undefined;
    source: MentionSource;
    resolve?: RefResolver;
    onsave: (text: string) => unknown;
    /** A pill clicked while the field is not being edited; by default its `href` opens. */
    onopen?: (urn: string, href: string | undefined) => void;
    /** Editing ended (blur, Enter, Escape), saved or not. */
    ondone?: () => void;
    placeholder?: string;
    label: string;
    multiline?: boolean;
    autofocus?: boolean;
    class?: string;
  } = $props();

  const QUERY = /(?:^|[\s([{"'])@([^\s@][^@\n]{0,40})?$/;

  let root = $state<HTMLDivElement>();
  let focused = $state(false);
  let empty = $state(true);
  let destroyers: (() => void)[] = [];

  let menu = $state<{ query: string; x: number; y: number } | null>(null);
  let options = $state<readonly MentionItem[]>([]);
  let selected = $state(0);
  let loading = $state(false);

  function render(text: string) {
    if (!root) return;
    for (const destroy of destroyers) destroy();
    destroyers = [];
    root.replaceChildren();
    for (const segment of parseRefs(text)) {
      if (segment.text !== undefined) appendText(root, segment.text);
      else {
        const made = chip(segment.ref, resolve?.(segment.ref.urn), true);
        destroyers.push(made.destroy);
        root.append(made.el);
      }
    }
    empty = !text;
  }

  function appendText(parent: Node, text: string) {
    text.split("\n").forEach((line, index) => {
      if (index) parent.appendChild(document.createElement("br"));
      if (line) parent.appendChild(document.createTextNode(line));
    });
  }

  /** The field's contents back as text with references. */
  function serialize(node: Node): string {
    let out = "";
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) out += (child.nodeValue ?? "").replace(/ /g, " ").replace(/​/g, "");
      else if (child instanceof HTMLElement) {
        if (child.dataset.urn) out += formatRef({ urn: child.dataset.urn, label: child.dataset.label ?? "" });
        else if (child.tagName === "BR") out += "\n";
        else if (child.tagName === "DIV" || child.tagName === "P") out += `${out && !out.endsWith("\n") ? "\n" : ""}${serialize(child)}`;
        else out += serialize(child);
      }
    }
    return out;
  }

  const current = () => (root ? serialize(root).replace(/[ \t]+\n/g, "\n").trim() : "");

  // The field redraws from `value` whenever it is not being edited, so a save elsewhere or a rename shows.
  $effect(() => {
    const text = value ?? "";
    void resolve;
    if (!focused) render(text);
  });

  // Focused on mount with the caret at the end, as a field opened to be typed in.
  $effect(() => {
    if (!autofocus || !root) return;
    void tick().then(() => {
      if (!root) return;
      root.focus();
      const caret = document.createRange();
      caret.selectNodeContents(root);
      caret.collapse(false);
      getSelection()?.removeAllRanges();
      getSelection()?.addRange(caret);
    });
  });

  $effect(() => {
    const query = menu?.query;
    if (query === undefined) return;
    let live = true;
    loading = true;
    Promise.resolve(source(query)).then(
      (result) => {
        if (!live) return;
        options = result;
        selected = 0;
        loading = false;
        // A space after a word nothing answers to means the `@` was just an at.
        if (!result.length && /\s$/.test(query)) menu = null;
      },
      () => {
        if (live) loading = false;
      },
    );
    return () => {
      live = false;
    };
  });

  /** The `@` and what follows it up to the caret, when the caret is in plain text right after one. */
  function typedQuery() {
    const selection = getSelection();
    const node = selection?.anchorNode;
    if (!selection?.isCollapsed || !node || node.nodeType !== Node.TEXT_NODE || !root?.contains(node)) return null;
    const before = (node.nodeValue ?? "").slice(0, selection.anchorOffset);
    const match = QUERY.exec(before);
    if (!match) return null;
    const query = match[1] ?? "";
    return { node: node as Text, start: selection.anchorOffset - query.length - 1, end: selection.anchorOffset, query };
  }

  function oninput() {
    empty = !root?.textContent && !root?.querySelector("[data-urn]");
    const typed = typedQuery();
    if (!typed) return void (menu = null);
    const range = document.createRange();
    range.setStart(typed.node, typed.start);
    range.setEnd(typed.node, typed.start + 1);
    const rect = range.getBoundingClientRect();
    menu = { query: typed.query, x: rect.left, y: rect.bottom + 4 };
  }

  function pick(item: MentionItem | undefined) {
    const typed = typedQuery();
    menu = null;
    if (!item || !typed || !root) return;
    const range = document.createRange();
    range.setStart(typed.node, typed.start);
    range.setEnd(typed.node, typed.end);
    range.deleteContents();
    const made = chip({ urn: item.urn, label: item.label }, resolve?.(item.urn) ?? { icon: item.icon, tint: item.tint }, true);
    destroyers.push(made.destroy);
    const space = document.createTextNode(" ");
    range.insertNode(space);
    range.insertNode(made.el);
    const selection = getSelection();
    const caret = document.createRange();
    caret.setStart(space, 1);
    selection?.removeAllRanges();
    selection?.addRange(caret);
    empty = false;
  }

  function onkeydown(event: KeyboardEvent) {
    if (menu) {
      const key = menuKey(event);
      if (key === "ArrowDown") selected = Math.min(options.length - 1, selected + 1);
      else if (key === "ArrowUp") selected = Math.max(0, selected - 1);
      else if ((key === "Enter" || key === "Tab") && options.length) pick(options[selected]);
      else if (key === "Escape") menu = null;
      else return;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      render(value ?? "");
      root?.blur();
    } else if (event.key === "Enter" && !event.isComposing) {
      event.preventDefault();
      if (multiline && !event.metaKey && !event.ctrlKey) document.execCommand("insertLineBreak");
      else root?.blur();
    }
  }

  /** Pasted text goes in as text, references in it as pills. */
  function onpaste(event: ClipboardEvent) {
    const text = event.clipboardData?.getData("text/plain");
    if (text === undefined) return;
    event.preventDefault();
    const selection = getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (!range || !root?.contains(range.startContainer)) return;
    range.deleteContents();
    const fragment = document.createDocumentFragment();
    for (const segment of parseRefs(multiline ? text : text.replace(/\s*\n\s*/g, " "))) {
      if (segment.text !== undefined) appendText(fragment, segment.text);
      else {
        const made = chip(segment.ref, resolve?.(segment.ref.urn), true);
        destroyers.push(made.destroy);
        fragment.append(made.el);
      }
    }
    const last = fragment.lastChild;
    range.insertNode(fragment);
    if (last) {
      const caret = document.createRange();
      caret.setStartAfter(last);
      selection?.removeAllRanges();
      selection?.addRange(caret);
    }
    oninput();
  }

  function onclick(event: MouseEvent) {
    const pill = (event.target as HTMLElement).closest<HTMLElement>("[data-urn]");
    if (!pill || (focused && !event.metaKey && !event.ctrlKey)) return;
    event.preventDefault();
    if (onopen) onopen(pill.dataset.urn ?? "", pill.dataset.href);
    else if (pill.dataset.href) location.assign(pill.dataset.href);
  }

  function onfocus() {
    focused = true;
  }

  function onblur() {
    focused = false;
    menu = null;
    const next = current();
    if (next !== (value ?? "").trim()) void onsave(next);
    render(next);
    ondone?.();
  }

  $effect(() => () => destroyers.forEach((destroy) => destroy()));
</script>

<div class="desk-mention-field {klass}" class:multiline>
  <div
    bind:this={root}
    class="input"
    contenteditable="true"
    role="textbox"
    tabindex="0"
    aria-label={label}
    aria-multiline={multiline}
    aria-autocomplete="list"
    data-placeholder={placeholder}
    class:empty
    spellcheck="false"
    {oninput}
    {onkeydown}
    {onpaste}
    {onclick}
    {onfocus}
    {onblur}
  ></div>
  {#if menu}
    <div class="desk-mention-menu" style:left="{Math.min(menu.x, innerWidth - 300)}px" style:top="{menu.y}px">
      <ItemList items={options} bind:selected onpick={pick} {loading} dense empty="Nothing to mention" />
    </div>
  {/if}
</div>

<style>
  .desk-mention-field {
    position: relative;
    min-width: 0;
  }

  .input {
    min-height: 1.5em;
    outline: none;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    cursor: text;
  }

  .desk-mention-field:not(.multiline) .input {
    white-space: nowrap;
    overflow: hidden;
  }

  .desk-mention-field:not(.multiline) .input:focus {
    white-space: pre-wrap;
  }

  .input.empty::before {
    content: attr(data-placeholder);
    color: var(--ink-30);
    pointer-events: none;
  }

  .desk-mention-menu {
    position: fixed;
    z-index: 120;
    width: 288px;
    max-height: min(22rem, 60dvh);
    overflow-y: auto;
    padding: 4px;
    border-radius: var(--r);
    background: var(--surface);
    box-shadow: var(--float-shadow);
    color: var(--ink);
    font-size: var(--ui);
    text-align: left;
    white-space: normal;
  }
</style>
