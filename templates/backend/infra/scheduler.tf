# One Cloud Scheduler job per scheduled route of the backend. A route called
# here is idempotent (a retry neither pays twice nor notifies twice), answers
# quickly, does its work in bounded batches, and is gated by the admin token,
# exactly like the migration step of the Deploy workflow.
#
# resource "google_cloud_scheduler_job" "example" {
#   project   = google_project.this.project_id
#   region    = var.region
#   name      = "example"
#   schedule  = "0 6 * * *"
#   time_zone = "Europe/Paris"
#
#   attempt_deadline = "60s"
#
#   retry_config {
#     retry_count = 1
#   }
#
#   http_target {
#     http_method = "POST"
#     uri         = "${google_cloudfunctions2_function.server.service_config[0].uri}/admin/example"
#     headers = {
#       Authorization = "Bearer ${local.admin_token_value}"
#     }
#   }
#
#   depends_on = [google_project_service.apis]
# }
