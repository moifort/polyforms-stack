---
id: firestore-helpers
risk: review
stacks: [backend]
rule: rules/09-backend.md#storage
check: grep -q 'export const findDocuments' server/utils/firestore.ts && test -f server/utils/user-documents.ts
---

**What changes.** The patterns every repository wrote by hand are helpers of the template:
`findDocuments` and `findDocumentsPerRequest` (documents read by id: each id asked once, nothing
read for no id, the absent left out, memoized per document for the second), `readDocuments`
(aligned with the ids asked), `setInBatches` (400 writes a batch, absent fields dropped),
`deleteAllOwnedBy` (a user's documents, and any named beside, for the account deletion) and
`compositeId`. `server/utils/user-documents.ts` builds the two shapes most private documents take:
`oneDocumentPerUser` (id = the user: a connection, an entitlement) and `oneDocumentPerUserAndKey`
(id = the user and a key: a rating, a heart, a dismissal), the repository keeping its own
collection and its exported names.

**How to fix**, from `node_modules/@moifort/stack/templates/backend/server/utils/`:

1. Copy `user-documents.ts` and `firestore.int.test.ts`; merge the new functions of
   `firestore.ts` into the project's (they need `memoizedManyPerRequest` from
   `server/system/request-cache.ts`, see the 0.2.0 migration `request-cache-scopes`).
2. In `server/domain/*/infrastructure/*repository.ts`, replace:
   - `db().getAll(...)` followed by a cast of each snapshot and a filter on the absent: with
     `findDocuments(collection(), ids)`; inside `memoizedManyPerRequest`: with
     `findDocumentsPerRequest(collection(), ids, cacheKeyOf)`;
   - a query on `userId` followed by `deleteInBatches`: with `deleteAllOwnedBy(collection(), userId)`
     (a document keyed by the user goes in its third argument);
   - a batch filled in a loop, or sliced by hand: with `setInBatches`;
   - two repositories that differ only by their collection: with one implementation (a factory
     of `user-documents.ts`, or a local one taking the collection), each repository exporting
     the names it had. The collection stays opened as `db().collection('name')` in the repository
     file, where an account deletion test may read it.
3. Run the three test families: the read budgets must not change.

**Does not apply** to a project generated from 0.7.0 or later.
