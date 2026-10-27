/**
 * The palettes `tokens.css` defines, and choosing between them. A choice is a mode (follow the system, or force
 * light or dark) plus one light and one dark palette; applying it writes `data-theme` (the mode in effect) and
 * `data-palette` (the palette, unless it is the default for that mode) on the root.
 */
export type ThemeMode = "system" | "light" | "dark";
export type ThemeKind = "light" | "dark";

export interface Palette {
  readonly id: string;
  readonly name: string;
  readonly kind: ThemeKind;
  /** Five colours to draw a swatch with: canvas, surface, line, ink, accent. */
  readonly swatch: readonly [string, string, string, string, string];
}

export interface ThemeChoice {
  readonly mode: ThemeMode;
  readonly light: string;
  readonly dark: string;
}

/** The palette each mode uses without a `data-palette`: what `tokens.css` puts on `:root`. */
export const DEFAULT_THEME: ThemeChoice = { mode: "system", light: "nord-light", dark: "pai-dark" };

export const PALETTES: readonly Palette[] = [
  { id: "pai-dark", name: "pai Dark", kind: "dark", swatch: ["#0b0d12", "#11141b", "#1f2430", "#d6dae2", "#8b9cff"] },
  { id: "one-dark", name: "One Dark", kind: "dark", swatch: ["#21252b", "#282c34", "#3e4451", "#abb2bf", "#61afef"] },
  { id: "dracula", name: "Dracula", kind: "dark", swatch: ["#21222c", "#282a36", "#3b3d4d", "#f8f8f2", "#bd93f9"] },
  { id: "nord", name: "Nord", kind: "dark", swatch: ["#242933", "#2e3440", "#3b4252", "#d8dee9", "#88c0d0"] },
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    kind: "dark",
    swatch: ["#16161e", "#1a1b26", "#292e42", "#c0caf5", "#7aa2f7"],
  },
  {
    id: "catppuccin-mocha",
    name: "Catppuccin Mocha",
    kind: "dark",
    swatch: ["#181825", "#1e1e2e", "#313244", "#cdd6f4", "#cba6f7"],
  },
  {
    id: "gruvbox-dark",
    name: "Gruvbox Dark",
    kind: "dark",
    swatch: ["#1d2021", "#282828", "#3c3836", "#ebdbb2", "#fabd2f"],
  },
  {
    id: "nord-light",
    name: "Nord Light",
    kind: "light",
    swatch: ["#e5e9f0", "#f8f9fb", "#d8dee9", "#2e3440", "#5e81ac"],
  },
  {
    id: "pai-light",
    name: "pai Light",
    kind: "light",
    swatch: ["#ebe6e1", "#ffffff", "#dfdad5", "#000000", "#cb5800"],
  },
  {
    id: "github-light",
    name: "GitHub Light",
    kind: "light",
    swatch: ["#f6f8fa", "#ffffff", "#d0d7de", "#1f2328", "#0969da"],
  },
  {
    id: "solarized-light",
    name: "Solarized Light",
    kind: "light",
    swatch: ["#eee8d5", "#fdf6e3", "#e3dcc6", "#586e75", "#268bd2"],
  },
  {
    id: "catppuccin-latte",
    name: "Catppuccin Latte",
    kind: "light",
    swatch: ["#e6e9ef", "#eff1f5", "#ccd0da", "#4c4f69", "#8839ef"],
  },
];

export const paletteById = (id: string) => PALETTES.find((p) => p.id === id);

const prefersDark = () => typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;

/** The mode a choice comes to right now. */
export const themeKind = (choice: ThemeChoice): ThemeKind =>
  choice.mode === "system" ? (prefersDark() ? "dark" : "light") : choice.mode;

/** The palette a choice shows right now, falling back to the mode's default when the id is unknown. */
export function activePalette(choice: ThemeChoice): Palette {
  const kind = themeKind(choice);
  const wanted = paletteById(kind === "dark" ? choice.dark : choice.light);
  if (wanted?.kind === kind) return wanted;
  const fallback = PALETTES.find((p) => p.id === DEFAULT_THEME[kind]);
  if (!fallback) throw new Error(`no default ${kind} palette`);
  return fallback;
}

/** Puts a choice on the root element; returns the palette now showing. */
export function applyTheme(choice: ThemeChoice, root: HTMLElement = document.documentElement): Palette {
  const palette = activePalette(choice);
  root.dataset.theme = palette.kind;
  if (palette.id === DEFAULT_THEME[palette.kind]) delete root.dataset.palette;
  else root.dataset.palette = palette.id;
  return palette;
}

/** Calls back whenever the system's light or dark changes; returns a way to stop. */
export function onSystemTheme(listener: () => void): () => void {
  if (typeof matchMedia !== "function") return () => {};
  const media = matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
