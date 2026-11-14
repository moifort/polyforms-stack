---
id: composite-ids
risk: review
stacks: [backend]
rule: rules/09-backend.md#storage
check: grep -q 'export const compositeId' server/utils/firestore.ts && ! grep -rhE '\$\{[A-Za-z.]+\}(--|_)\$\{' server/domain --include=repository.ts | grep -vq legacy
---

**What changes.** A document id made of several parts (a user and what they hold, a resource and
its language) is built by `compositeId`, which joins the parts with `~`. A project that joined
some with `--` or `_` moves them, with the documents already stored.

**How to fix.**

1. List the ids built by hand in the repositories (a template string joining two values).
   Check that no part can hold a `~`: generated ids, hashes and months cannot, `slugify` folds
   every character but a-z, 0-9 and `-`. Ids sent to the app as GraphQL values are part of the
   schema: leave those for now, installed builds send them back.
2. Build each with `compositeId(...)`. Keep the old form beside it as `legacyIdOf` (the option
   of `oneDocumentPerUserAndKey`) or a `legacy…Id` function, read where the new id holds
   nothing, and removed with it: migrations run after the deploy, and in between a document
   unread is lost to the user (a quota read as fresh hands out free calls, a cache miss pays a
   call again). A list read by a `userId` query already finds both; keep one per key, the one
   under the new id.
3. Write the data migration ([11-ops.md](../../rules/11-ops.md#migrations)): for each
   collection, read every document, rebuild its id from its fields, and move each one whose id
   differs in a transaction of its own (read both ids, write the new one, delete the old). When
   both exist, the new one stands, built from the old by the fallback; a counter keeps the
   higher of the two. Idempotent, with its `.int.test.ts`. State its cost in the commit: about
   three reads and two writes per document moved.
4. Once the migration has run in production, remove the legacy ids and the fallback reads in a
   commit of their own.

**Does not apply** when every composite id already uses `~`.
