# The organisation's read-only observer account (one for every project, living
# in polyforms-billing) is granted viewer roles here, so the scheduled routines
# read logs, metrics, scheduler state and Firestore without a personal login.
# Nothing it holds can change the project.
resource "google_project_iam_member" "observer" {
  for_each = var.observer_service_account == "" ? toset([]) : toset([
    "roles/logging.viewer",
    "roles/monitoring.viewer",
    "roles/cloudscheduler.viewer",
    "roles/cloudfunctions.viewer",
    "roles/run.viewer",
    "roles/datastore.viewer",
  ])

  project = google_project.this.project_id
  role    = each.value
  member  = "serviceAccount:${var.observer_service_account}"
}
