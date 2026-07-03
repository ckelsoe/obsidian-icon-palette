# Copilot Instructions — Icon Palette

## What this project is

Icon Palette is an **Obsidian plugin** (TypeScript) that lets users assign custom icons and colors to files, folders, tabs, tags, properties, bookmarks, and app/ribbon UI elements. It also includes a rule system that applies icons automatically based on configurable conditions.

The compiled output is a single `main.js` (CJS, root of repo) produced by esbuild. Obsidian loads `main.js`, `manifest.json`, and `styles.css` directly from the vault's plugin folder.

---

## Repository layout

```
src/
  IconPalettePlugin.ts      # Plugin entry point, all exported types, settings interface
  IconPaletteSettingTab.ts  # Settings UI (large file; 1-warning lint exemption)
  ColorUtils.ts             # Color conversion helpers (CSS vars, hex, RGB, HSL)
  Emojis.ts                 # Full emoji set (Map<string, string>)
  IconLibraries.ts          # Devicon / Simple Icons registration & search-index population
  Strings.ts                # English UI strings (default fallback for i18n)
  managers/
    IconManager.ts          # Abstract base class for all icon managers
    AppIconManager.ts       # App-frame button icons (help, settings, sidebar …)
    TabIconManager.ts       # Tab header icons
    FileIconManager.ts      # File-explorer icons
    BookmarkIconManager.ts  # Bookmark panel icons
    TagIconManager.ts       # Tag icons
    PropertyIconManager.ts  # Property (frontmatter) field icons
    EditorIconManager.ts    # In-editor title/heading icons
    RibbonIconManager.ts    # Left-ribbon button icons
    SuggestionIconManager.ts         # Quick-switcher suggestion icons
    SuggestionDialogIconManager.ts   # Move-file / other dialog suggestion icons
    MenuManager.ts          # Right-click context-menu "Change icon…" actions
    RuleManager.ts          # Rule evaluation, rulings cache, time-based trigger loop
  dialogs/
    IconPicker.ts           # Main icon/color picker modal
    RulePicker.ts           # Rule list modal
    RuleEditor.ts           # Per-rule editor modal
    RuleChecker.ts          # "Check matches" dialog
    UsageChecker.ts         # Find all items using a given icon
  components/
    ConditionSetting.ts     # Rule condition row component
    ConditionValueSuggest.ts
    IconButtonComponent.ts
    PathComponent.ts
    PathListComponent.ts
    RuleNameSuggest.ts
    RuleSetting.ts
  generated/
    IconLibraryData.ts      # AUTO-GENERATED — never edit by hand
i18n/                       # Translation JSON files (ar, de, en-GB, es, fr, id, ja, ru, uk, zh)
scripts/                    # Node utility scripts (icon generation, bundle-size check, etc.)
styles.css                  # Plugin stylesheet
manifest.json               # Obsidian plugin manifest
versions.json               # minAppVersion map per release
```

---

## Key types (src/IconPalettePlugin.ts)

| Type | Purpose |
|------|---------|
| `Icon` | `{ icon: string\|null; color: string\|null }` — the base icon object |
| `Item extends Icon` | Adds `id`, `name`, `category`, `iconDefault` |
| `Category` | `'app'\|'tab'\|'file'\|'folder'\|'group'\|'search'\|'graph'\|'url'\|'tag'\|'property'\|'ribbon'\|'rule'` |
| `IconLibraryFilter` | `'lucide'\|'devicon'\|'simple'\|'emoji'` |
| `RuleBase` | Raw (possibly partial) rule from settings storage |
| `RuleItem` (RuleManager) | Validated, fully-typed rule used at runtime |
| `ConditionItem` | `{ source, operator, value }` — single condition in a rule |
| `RuleTrigger` | `'icon'\|'color'\|'rename'\|'move'\|'tag'\|'property'\|'modify'\|'date'\|'time'` |

Settings are stored in `IconPaletteSettings` (see `DEFAULT_SETTINGS` in `IconPalettePlugin.ts`) and persisted via Obsidian's `loadData()`/`saveData()`.

---

## Icon sources

1. **Lucide** — built-in Obsidian icons, accessed via `getIconIds()` and `setIcon()`. IDs have the `lucide-` prefix.
2. **Devicon** — third-party library, IDs prefixed `devicon-`. Registered with Obsidian's `addIcon()`.
3. **Simple Icons** — third-party library, IDs prefixed `simple-`. Registered with Obsidian's `addIcon()`.
4. **Emoji** — plain Unicode emoji strings stored in `EMOJIS` (Map). Rendered as a `<div class="icon-palette-emoji">` element.

Third-party SVG data is compiled into `src/generated/IconLibraryData.ts` (zlib-compressed, base64-encoded) by `npm run generate:icons`. The data is decoded lazily at runtime via `src/IconLibraries.ts`. Only icons actually referenced in settings are registered on startup; the rest are registered lazily when the picker opens.

---

## Build & development commands

```bash
npm install             # install dependencies
npm run dev             # esbuild watch mode (dev build)
npm run build           # full production build: generate icons → typecheck → bundle → size check
npm run generate:icons  # regenerate src/generated/IconLibraryData.ts from npm packages
npm run typecheck       # tsc --noEmit --skipLibCheck
npm run lint            # eslint (obsidianmd rules) + submission pre-filter script
npm test                # jest (--passWithNoTests; currently no test files exist)
npm run version         # bump version in manifest.json and versions.json, git-adds both
```

Always run `npm run lint`, `npm run typecheck`, and `npm run build` before submitting a PR. The CI workflow runs all four checks (typecheck → lint → test → build) plus manifest validation, deprecated API detection, and an OSV security scan.

---

## TypeScript conventions

- **Strict mode**: `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`, `noImplicitReturns` are all enabled. Avoid non-null assertions (`!`) unless the value is provably non-null at that point.
- **Module resolution**: `node16`. Import paths for local `.ts` files must use the `.js` extension (e.g., `import Foo from 'src/Foo.js'`). The `paths` alias maps bare `src/` paths to the repo root.
- **Target**: `es2021`.
- All public and protected class members should have JSDoc comments where the meaning is not obvious from the name.

---

## ESLint notes

- Uses `eslint-plugin-obsidianmd` recommended rules (`eslint.config.mts`).
- `--max-warnings 0` everywhere **except** `IconPaletteSettingTab.ts` which gets `--max-warnings 1`.
- The `scripts/` directory, config files (`esbuild.config.mjs`, `jest.config.cjs`, etc.), and `main.js` are ignored by ESLint.

---

## IconManager pattern

All icon managers extend `src/managers/IconManager.ts`. Key points:

- The constructor receives the `IconPalettePlugin` instance.
- Override `refreshIcons(unloading?: boolean)` to re-render all icons controlled by this manager.
- Use the protected helpers `setEventListener` / `stopEventListener` and `setMutationObserver` / `stopMutationObserver` instead of raw `addEventListener`/`MutationObserver` — these are automatically cleaned up via `unload()`.
- Call `refreshIcon(item, iconEl, onClick?)` to render a single icon into a DOM element. This handles Lucide icons, library icons, emojis, the collapse-icon fallback, and color application.
- On plugin unload, `IconManager.unload()` removes all event listeners and mutation observers registered through the helpers.

---

## Rule system

`RuleManager` evaluates file and folder rules against every file/folder in the vault. Rules are stored in `settings.fileRules` / `settings.folderRules` as `RuleBase[]` and normalized to `RuleItem[]` at runtime.

- Each rule has an ordered list of `ConditionItem` objects.
- Conditions use a `source` (e.g., filename, path, frontmatter property, tag, modification date) and an `operator`/`value` pair.
- The rule's `match` field is `'all'`, `'any'`, or `'none'`.
- `RuleManager.triggerRulings(category, trigger)` re-evaluates all rules for a category when a given trigger fires (file rename, move, tag change, etc.).
- A self-looping `setTimeout` fires every minute to handle `'time'` triggers; midnight resets handle `'date'` triggers.
- Rulings are cached in `fileRulings` / `folderRulings` maps (path → winning `RuleItem`).

---

## Color system

Colors may be:
- A named Obsidian palette color (`'red'`, `'blue'`, etc.) — resolved to a CSS variable via `ColorUtils.toRgb()`.
- A CSS named color (e.g., `'cornflowerblue'`) — resolved from `CSS_COLORS` map.
- Any valid CSS color value (hex, rgb, hsl, etc.) — passed through `CSS.supports()`.
- `null` — no color override (icon renders at default theme color).

`ColorUtils.toRgb()` always returns an `rgb()`/`rgba()` string. `toHslArray()` and `toRgbObject()` are available for computations (e.g., emoji color filter).

---

## Obsidian API conventions

- Never use these deprecated APIs (CI will fail):
  - `workspace.activeLeaf` → use `getActiveViewOfType()` or `getLeaf()`
  - `MarkdownRenderer.renderMarkdown()` → use `MarkdownRenderer.render()`
  - `getLeaf(true|false)` → use `getLeaf('tab')` or `getLeaf('split')`
  - `.noticeEl` → use `.messageEl`
- Obsidian internals accessed through cast interfaces (e.g., `AppWithInternalPlugins`, `WorkspaceWithRibbon`) to avoid `any` — add new interface extensions in `IconPalettePlugin.ts` when needed.
- `isDesktopOnly` is `false`; mobile-specific code paths are guarded with `Platform.isMobile` / `Platform.isDesktop`.

---

## i18n

`src/Strings.ts` holds English default strings. Translation keys map to objects in the `i18n/*.json` files (same shape as `Strings`). The plugin loads the correct locale via `getLanguage()` at startup. When adding new UI strings, add them to `Strings.ts` first, then update the JSON files.

---

## Generated file

`src/generated/IconLibraryData.ts` exports a single large base64 constant (`COMPRESSED_ICON_LIBRARY_DATA`). Do **not** edit it manually. Regenerate it with `npm run generate:icons` whenever `@iconify-json/devicon` or `@iconify-json/simple-icons` are updated.

---

## Release process

1. Run `npm run version` to bump `manifest.json` and `versions.json`, then commit.
2. Push a git tag (e.g., `1.2.3`). The `release.yml` workflow builds, attests artifacts, creates a GitHub release, and runs a VirusTotal scan.
3. Tags containing `-beta`, `-rc`, or `-alpha` are published as pre-releases.

---

## Common errors & workarounds

- **"Cannot find module 'src/…'"** during `tsc`: Make sure the import uses the `.js` extension and that `tsconfig.json`'s `paths` alias is intact.
- **`IconLibraryData.ts` is out of date**: Run `npm run generate:icons` to regenerate it.
- **ESLint `obsidianmd` rule failures**: The `eslint-plugin-obsidianmd` enforces Obsidian plugin submission guidelines. Check the rule description in the error message; the most common violations involve use of `innerHTML` and direct DOM manipulation patterns.
- **Bundle too large**: `scripts/check-bundle-size.mjs` warns if `main.js` exceeds 5 MB. Avoid importing large dependencies that aren't tree-shaken.
- **`noUncheckedIndexedAccess` errors**: Array/map indexing returns `T | undefined`. Use optional chaining (`arr[i]?.prop`) or explicit undefined checks.
