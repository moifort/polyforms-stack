# Changelog

## Two files in lockstep

`CHANGELOG.md` in `{{SOURCE_LANGUAGE}}` is the source of truth; one translation per served
language (`CHANGELOG.<lang>.md`), kept in lockstep. Newest first. Each version carries the store
version and its release date: `## 1.0 (2026.10.01)`.

Under a version, at most three subsections, only those with content: new, fixes, performance. If
the parser serving the content ignores them, the app shows a flat list, and that is fine.

## Written at release time, never before

A feature, a fix or a push leaves both files untouched: no `## Unreleased` section, not even as a
placeholder. The entries are written when a store release is cut, from the commits since the
previous one, under that release's version and date.

## What to write

Only what matters to the person using the product, in their words: the visible effect, nothing
else.

- A fix is one short sentence saying what now works. No cause, no frequency ("one time in
  three"), no model, call, search or API named. The technical story is in the commit message.
- A renamed label, a moved subtitle, a removed counter have no impact: they are not logged.
- Never the app's name in an entry. Never a line about which languages the app is available in.
- The tone of [08-copy.md](08-copy.md) applies in every language.

## Approval

The `{{REVIEW_LANGUAGE}}` entry is shown in the conversation and approved before the commit and
the tag. See [05-release.md](05-release.md).
