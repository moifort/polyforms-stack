---
id: orchestrator-models
risk: review
stacks: [any]
rule: rules/18-design.md#comments-on-the-board
---

**What changes.** Rule 8 of the board comments: the orchestrating session runs on the most
capable model and never codes, builds or captures. Its children run on the mid-tier model by
default, raised for a hard ticket only. One ticket at a time per child. The parent checks tickets
with the cheapest proof first, to keep its own context small.

**How to fix.** Only a project that keeps a board with reserve sessions is concerned.

1. Add the rule to the project's own copy of the board rules (`CLAUDE.md` workflow, `docs/board.md`).
2. Set the orchestrating session to the most capable model in the app's model menu: a session
   cannot change its own model.
3. From the orchestrator, set each reserve to the mid-tier model (`set_session_model`).

**Check.** `grep -c "never codes" CLAUDE.md docs/board.md` answers 1 or more per file, and
`get_session` on each reserve reports the mid-tier model id.
