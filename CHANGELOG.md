# Changelog

## Unreleased

Initial Icon Palette release, based on a clean fork of the MIT-0 licensed
[Iconic](https://github.com/gfxholo/iconic) and [Better Icons](https://github.com/christianlempa/obsidian-iconic).

- Set custom icons and colors on files, folders, tabs, tags, properties, bookmarks, and ribbon commands.
- Icon libraries: Lucide, emoji, Simple Icons, and Devicon.
- Rulebook to apply icons automatically by name, extension, path, tags, properties, or date.
- Select multiple files, bookmarks, or properties to apply an icon at once.
- Reapply recently used icon and color combinations from a Recent row in the picker, and pin favorites to a Pinned row (secondary-click or long-press to pin and unpin).
- Icon picker results wrap across two rows and scroll vertically instead of a single horizontal strip.

### Fixed

- Rulebook "is before now" / "is after now" datetime conditions never matched, because the operators received an empty value instead of the current time.
- Rulebook "none contain" / "none start with" / "none end with" conditions were case-sensitive, so an uppercase value never matched a tag; they now match case-insensitively like the "any" and "all" operators.
- Renaming or deleting a folder now re-keys or removes the custom icons of its descendants, instead of orphaning or leaking them in settings.
