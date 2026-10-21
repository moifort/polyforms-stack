# Workflow of a task

## The cycle

1. **Framing.** Understand the intent before coding. If two readings of the request lead to two
   different pieces of work, ask now, not at the end. For anything new, brainstorm first; the
   outcome is a design document.
2. **Design document** for anything beyond a few files or whose approach is not obvious:
   `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`, committed. A paid API call states its
   cost here, see [13-ai.md](13-ai.md).
3. **Plan**, then **implementation**, inline, to the final result, without checkpoints.
4. **Verification**, below.
5. **Review** before commit, see [03-code-review.md](03-code-review.md).
6. **Commit**, see [02-commits.md](02-commits.md).
7. **Screenshot** when a screen changed, below.

## What a plan contains

A plan never opens with a code block. It opens with a plain section:

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
| Backend | `{{TYPECHECK_COMMAND}}` (after `{{PREPARE_COMMAND}}` if routes changed), the three test families **separately** (see below), `{{LINT_COMMAND}}` |
| The API schema | `{{SCHEMA_CHECK_COMMAND}}`: a removal not preceded by a deprecation is refused, see [11-ops.md](11-ops.md#api-evolution) |
| The app | `{{APP_BUILD_COMMAND}}`; and after any on-screen text change, `{{STRINGS_CHECK_COMMAND}}` until it reports every string translated, see [08-copy.md](08-copy.md#localisation) |

The three test families run **separately** (`{{TEST_UNIT_COMMAND}}`, `{{TEST_INT_COMMAND}}`,
`{{TEST_FEAT_COMMAND}}`): a module mock declared in one test file serves every file of the same
run, so a single combined run passes while CI, which runs them apart, goes red.

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

## Skills and tooling

Before starting, look at what is installed and invoke what matches the task. Never cite, impose
or document a skill without checking it exists on the machine. The skills this package ships are
in `.claude/skills/` after `sync`; the ones that matter are `domain`, `graphql`, `ios-feature`,
`appstore`, `stack-upgrade`.
