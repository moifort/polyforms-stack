---
id: derived-data-reuse
risk: safe
stacks: [ios]
rule: rules/15-tooling.md#derived-data-and-disk
check: "! grep -rEn 'derivedDataPath.{0,3}/tmp' scripts package.json"
---

**What changes.** A fresh derived data path per build costs about 6 GB and a full rebuild each
time; it once filled the disk.

**How to fix.** In the project's scripts (`scripts/*.sh`, `scripts/*.ts`, `package.json`), any
`-derivedDataPath` under `/tmp` or carrying a date, a session or a task name becomes either no
`-derivedDataPath` at all or one fixed path inside the checkout (`build/derived`, as the template's
`ios:build`), plus `-clonedSourcePackagesDirPath` at the main derived data's `SourcePackages`
when it is a worktree.
