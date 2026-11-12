---
id: flat-collections
risk: review
stacks: [backend]
rule: rules/09-backend.md#storage
check: bun scripts/check-rules.ts flat-collections
---

**What changes.** `bun run rules:check` refuses a subcollection under `server/` (tests
excepted): `.doc(...).collection(...)`, `collectionGroup(`, `listCollections(`, or a
collection path with a slash.

**How to fix.** Each subcollection becomes a top-level collection whose documents name their
owner in a `userId` field (and the parent's id when it is not the user), every query filtering on
`userId`. Moving existing documents is a data migration
([11-ops.md](../../rules/11-ops.md#migrations)) with its `.int.test.ts`, in its own commit;
the account deletion deletes the new collection's documents. Add the indexes the new queries need.

**Does not apply** when the check passes already, which is the case of a project built from the
template.
