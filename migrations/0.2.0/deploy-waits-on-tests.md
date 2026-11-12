---
id: deploy-waits-on-tests
risk: review
stacks: [backend]
rule: rules/12-ci.md#rules
check: grep -q 'workflow_call' .github/workflows/test-unit.yml && grep -q 'needs: \[unit, int, feat\]' .github/workflows/deploy.yml
---

**What changes.** Deploy used to start on the same push as the tests, so a red integration
suite could still reach production. Deploy now calls the three test workflows and waits for them.

**How to fix.**

1. In `.github/workflows/test-unit.yml`, `test-int.yml`, `test-feat.yml`: replace the `push:`
   trigger (and its `paths-ignore`) with `workflow_call:`; keep `pull_request:`. Replace
   `concurrency.group: ${{ github.workflow_ref }}` with a hand-written name per file
   (`tests-unit-${{ github.ref }}`, `tests-int-…`, `tests-feat-…`).
2. In `.github/workflows/deploy.yml`: delete the workflow-level `concurrency:` block; add three
   jobs before `deploy` (`unit`, `int`, `feat`), each `uses: ./.github/workflows/test-<family>.yml`
   (with `if: github.event_name != 'pull_request'` when the project deploys staging from pull
   requests); give `deploy` `needs: [unit, int, feat]` and move the `concurrency:` block (same
   group, `cancel-in-progress: false`) into the `deploy` job. With staging, the job's `if` becomes
   `always() && !contains(needs.*.result, 'failure') && !contains(needs.*.result, 'cancelled') && (<previous condition>)`.
3. Copy the result from `node_modules/@moifort/stack/templates/backend/.github/workflows/` and
   diff against it.

**Does not apply** when the project has no backend tests workflows.
