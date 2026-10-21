# Workflow of a task

## The cycle

1. **Framing.** Understand the intent before coding. If two readings of the request lead to two
   different pieces of work, ask now, not at the end.
2. **No spec, no plan mode by default.** A design document
   (`docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`) or a written plan is produced only when
   the person asks for one. Without that, the plain explanation below is given in the conversation
   and the work starts. A paid API call states its cost either way, see [13-ai.md](13-ai.md).
3. **Implementation**, inline, to the final result, without checkpoints.
4. **Verification**, below.
5. **Review** before commit, see [03-code-review.md](03-code-review.md).
6. **Commit**, see [02-commits.md](02-commits.md).
7. **Screenshot** when a screen changed, below.

## What an explanation or a plan contains

Before the work, in the conversation (or in the plan when one was asked), a plain section:

- the domains touched: created, modified, removed;
- how it works today, what it gives afterwards, ideally a table of before and after;
- the mechanisms at play, without jargon;
- what does not move;
- why the tasks are in this order.

Code blocks serve execution, the explanation serves the decision. Each task ends with a testable
deliverable and its verification command with the expected output.

## Verification before a commit

A claim of success without the command output behind it has no value. Before every commit:

| What was touched | What runs |
|---|---|
| Backend | `bun run typecheck` (after `bun run prepare` if routes changed), the three test families **separately** (see below), `bun run lint` |
| The API schema | `bun run schema:check`: a removal not preceded by a deprecation is refused, see [11-ops.md](11-ops.md#api-evolution) |
| The app | `bun run ios:build`; and after any on-screen text change, `bun run ios:strings` until it reports every string translated, see [08-copy.md](08-copy.md#localisation) |

The three test families run **separately** (`bun run test:unit`, `bun run test:int`,
`bun run test:feat`): a module mock declared in one test file serves every file of the same
run, so a single combined run passes while CI, which runs them apart, goes red.

## Mockups before a complex screen

A new feature with screens and real complexity (a new flow, several states, a layout nobody has
seen) starts with mockups, before any real code: quick throwaway renderings of the screens built
from fixtures (a preview or a harness screenshot, or a drawn mock when that is faster), sent for a
fast approval of the layout and the flow. Only once the mockups are approved does the real
implementation start. A small change to an existing screen skips this and goes straight to the
screenshot below.

## Screenshot after every UI change

Every request that changes a screen ends with a screenshot of the result, sent to the person,
followed by a wait for their approval. Without exception, and whatever the state of the simulator:

- "the simulator stops at sign-in" is never a reason to skip it. Feed the page its preview
  fixtures through a temporary launch argument in the app entry point, build into a derived data
  path unique to the session, install and launch, capture, then revert the harness before the
  commit. The fixtures and previews stay.
- Before sending, check the design conventions of [10-ios.md](10-ios.md#design-conventions).
- Committing before approval is fine. Installing on the person's device before approval is not.
- The next task does not start until the screenshot is approved.

## Ideas and decisions

- **Ideas** that come up and are not built now go into the project's `docs/ideas.md`, one line
  each with the date, so nothing said in passing is lost. Claude adds to it without being asked.
- **Architecture choices** get an ADR (architecture decision record) in `docs/adr/`, numbered
  (`0007-flat-collections.md`): context, decision, alternatives rejected, consequences. Written
  when the choice is made, proposed to the person before the code that depends on it.

(Shape to refine later; the rule is that both exist in every project.)

## Skills and tooling

Before starting, look at what is installed and invoke what matches the task. Never cite, impose
or document a skill without checking it exists on the machine. The skills this package ships are
in `.claude/skills/` after `sync`; the ones that matter are `domain`, `graphql`, `ios-feature`,
`appstore`, `stack-upgrade`.
