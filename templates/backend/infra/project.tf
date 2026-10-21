resource "google_project" "this" {
  name            = var.project_name
  project_id      = var.project_id
  org_id          = var.org_id
  folder_id       = var.folder_id
  billing_account = var.billing_account_id

  labels = {
    app = "{{APP_SLUG}}"
  }
}

resource "google_project_service" "apis" {
  for_each = toset([
    "firebase.googleapis.com",
    "firestore.googleapis.com",
    "identitytoolkit.googleapis.com",
    "cloudfunctions.googleapis.com",
    "cloudbuild.googleapis.com",
    "compute.googleapis.com",
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "eventarc.googleapis.com",
    "storage.googleapis.com",
    "secretmanager.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "serviceusage.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "firebaserules.googleapis.com",
    "orgpolicy.googleapis.com",
    "cloudscheduler.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
  ])

  project            = google_project.this.project_id
  service            = each.value
  disable_on_destroy = false
}

# Many GCP organizations enforce iam.allowedPolicyMemberDomains, which blocks
# IAM bindings to allUsers. The Cloud Run service must be publicly invokable
# because auth is enforced inside the function (Firebase ID token verification).
# The constraint is overridden at the project scope, never org-wide.
resource "google_org_policy_policy" "allow_public_iam" {
  parent = "projects/${google_project.this.project_id}"
  name   = "projects/${google_project.this.project_id}/policies/iam.allowedPolicyMemberDomains"

  spec {
    rules {
      allow_all = "TRUE"
    }
  }

  depends_on = [google_project_service.apis]
}

# Org policy changes take about a minute to propagate before downstream IAM
# bindings succeed. Without this gate the first apply fails and needs a rerun.
resource "time_sleep" "wait_for_org_policy" {
  depends_on      = [google_org_policy_policy.allow_public_iam]
  create_duration = "90s"
}
