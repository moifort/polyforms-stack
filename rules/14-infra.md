# Infrastructure

Terraform in `infra/`, one GCP project per app named `<app>-polyforms`, region `europe-west3`,
Firestore `eur3`. Templates in `templates/infra/`.

| File | What it provisions |
|---|---|
| `project.tf`, `versions.tf`, `state.tf`, `backend.tf` | The project, the providers, the remote state bucket |
| `firebase.tf`, `auth.tf` | The Firebase app, Sign in with Apple |
| `firestore.tf` | The database with delete protection and point-in-time recovery, the indexes |
| `function.tf` | The Cloud Function gen 2 (Node 22) serving the Nitro build, scale to zero |
| `secrets.tf`, `variables.tf` | Secret Manager entries fed by Terraform variables from GitHub secrets |
| `cicd.tf` | Workload Identity Federation for the GitHub workflows |
| `scheduler.tf` | Cloud Scheduler jobs calling the backend's scheduled routes |
| `storage.tf` | Buckets for uploads, signed URLs |
| `ios.tf` | Resources the app needs (APNs key, bundle configuration) |
| `observer.tf` | A read-only service account for unattended production reads |
| `outputs.tf` | What the workflows and the app read back |

## Rules

- `scripts/bootstrap.sh` creates the project, the state bucket and the first apply, once, from
  the person's machine; `scripts/teardown.sh` destroys it. Everything after that is the Deploy
  workflow ([11-ops.md](11-ops.md)).
- The Terraform state is remote and never committed. `terraform.tfvars` is gitignored, with its
  `.example`.
- Secrets reach the function through Secret Manager only; the workflow never writes a key into
  an environment file.
- The observer service account reads logs, metrics, scheduler, functions, Firestore and billing,
  and nothing else: writes answer permission denied, checked. It lives in its own `gcloud`
  configuration (`CLOUDSDK_CONFIG`) so the person's account is untouched and routines do not
  depend on their login, which expires.
- The billing export lives in one BigQuery dataset shared by every project; each project's runtime
  and observer accounts get `dataViewer` on it through SQL `GRANT`, the IAM binding command being
  allowlisted.
- Analytics: the Firebase project is linked to a GA4 property at creation, or sessions go
  nowhere; the property id is a repository variable.
- Never a warm instance, see [11-ops.md](11-ops.md#scale-to-zero).
- APNs keys and Sign in with Apple keys live in `infra/`, gitignored; they are not the store API
  key.
