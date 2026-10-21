# Commits

## Format

Conventional commits: `type(scope): subject`, English, lowercase, imperative, no trailing period.
Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `ci`. The scope is the business
domain deduced from the paths touched, never an invented taxonomy; a cross-cutting change takes
`deps`, `ci`, `config`. A commit needing two scopes is probably two commits.

The body explains the why when it is not obvious, and states the cost of a paid API call. It never
paraphrases the diff. Every commit ends with the `Co-Authored-By` trailer.

## Never ask

Neither the message nor the split is submitted for approval. Decide, write, commit.

## Granularity

One finished task, one commit, as soon as its verification passes. Group coherently; never bundle
unrelated tasks, so that a rollback is a clean revert. Stage explicit paths only: never `git add
-A`, `git add .` or `commit -a`.

## Amend

Prefer a new commit to an amend, even when an earlier message has become inaccurate: an extra
commit costs nothing, a clobbered one costs someone else's work. When an amend is warranted,
re-read `git log -1` in the same command as the amend, never from a HEAD observed earlier.

## Branch

Work lands on `{{MAIN_BRANCH}}`. No feature branch, no pull request, unless asked.

## Several sessions on one project

When several Claude sessions work on the same project at once, **each session works in its own git
worktree** and merges into `{{MAIN_BRANCH}}` when its task is done. A fresh worktree lacks the
gitignored files the build needs (app secrets, Firebase plist, package resolution, generated API
client): copy them from the main checkout first, see [15-tooling.md](15-tooling.md).

Fallback rules when two sessions share a checkout anyway:

- commit with an explicit pathspec (`git commit -- <files>`), and before that, check `git diff`
  of every file outside your own folders: a file carrying someone else's changes is never staged
  into the shared index;
- never split the hunks of a generated file (an exported schema): a zero-context patch applies at
  the wrong place silently. Parse the staged blob before committing, or regenerate it whole;
- after committing, once other sessions have committed on top, grep `{{MAIN_BRANCH}}` for your
  change before reporting it done: a stale copy of a file committed by another session can undo
  it.

## Push

Never on your own initiative. Commits accumulate locally until the person says "push"; then the
checklist of [04-push.md](04-push.md) applies. The one exception: a scheduled routine the person
has explicitly authorised to push (see [16-routines.md](16-routines.md)) pushes its own fixes and
watches CI like any push.
