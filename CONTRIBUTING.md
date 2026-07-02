# Contributing

Thanks for your interest in Icon Palette.

## Build

```bash
npm install
npm run build
```

## Checks before a pull request

```bash
npm run lint      # eslint (obsidianmd ruleset) + submission pre-filter
npm run typecheck # tsc --noEmit
npm test          # jest
npm run build     # generates the icon library, bundles, checks size
```

Please keep pull requests focused and describe the user-facing change.
