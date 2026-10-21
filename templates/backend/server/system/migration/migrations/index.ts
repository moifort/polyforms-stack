import type { Migration } from '~/system/migration/types'

// Forward-only, sequential, no rollback. Adding a new optional field or a new
// collection needs no migration; renaming, restructuring or removing stale data
// does. Each migration lives beside its .int.test.ts and is listed here in order.
export const migrations: Migration[] = []
