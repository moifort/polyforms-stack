resource "google_service_account" "function" {
  project      = google_project.this.project_id
  account_id   = "{{APP_SLUG}}-runtime"
  display_name = "{{APP_NAME}} runtime"
}

resource "google_project_iam_member" "function_firestore" {
  project = google_project.this.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.function.email}"
}

# Deleting an account ends with deleting its Firebase Auth user, which needs
# Firebase Authentication admin rights: without them the wipe stops at its last
# step with "insufficient permission", every trace of data already gone.
resource "google_project_iam_member" "function_firebase_auth" {
  project = google_project.this.project_id
  role    = "roles/firebaseauth.admin"
  member  = "serviceAccount:${google_service_account.function.email}"
}

# Cloud Functions Gen 2 builds run in Cloud Build under the default Compute
# service account. In a fresh project that role binding is not granted by
# default, so the first deploy fails. Bound explicitly to make the bootstrap
# deterministic.
data "google_compute_default_service_account" "default" {
  project    = google_project.this.project_id
  depends_on = [google_project_service.apis]
}

resource "google_project_iam_member" "compute_default_builder" {
  project = google_project.this.project_id
  role    = "roles/cloudbuild.builds.builder"
  member  = "serviceAccount:${data.google_compute_default_service_account.default.email}"
}

resource "google_secret_manager_secret_iam_member" "function" {
  for_each  = google_secret_manager_secret.this
  project   = google_project.this.project_id
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.function.email}"
}

resource "google_storage_bucket" "source" {
  project                     = google_project.this.project_id
  name                        = "${google_project.this.project_id}-fn-source"
  location                    = local.bucket_location
  force_destroy               = true
  uniform_bucket_level_access = true

  depends_on = [google_project_service.apis]
}

data "archive_file" "source" {
  type        = "zip"
  source_dir  = "${path.root}/../.output/server"
  output_path = "${path.root}/../.output/server-source.zip"
}

resource "google_storage_bucket_object" "source" {
  name   = "source-${data.archive_file.source.output_md5}.zip"
  bucket = google_storage_bucket.source.name
  source = data.archive_file.source.output_path
}

resource "google_cloudfunctions2_function" "server" {
  provider = google-beta
  project  = google_project.this.project_id
  name     = "{{APP_SLUG}}-server"
  location = var.region

  build_config {
    runtime     = "nodejs22"
    entry_point = "server"

    source {
      storage_source {
        bucket = google_storage_bucket.source.name
        object = google_storage_bucket_object.source.name
      }
    }
  }

  service_config {
    # One whole CPU and several requests per instance: the app asks a screen's
    # queries at once, and they mostly wait on Firestore. The globals are
    # per-instance on purpose and the request cache lives on the event, so
    # nothing leaks between requests.
    available_memory                 = "512Mi"
    available_cpu                    = "1"
    max_instance_request_concurrency = 8
    # Mirrors `timeoutSeconds` in nitro.config.ts, which Terraform does not read:
    # raise both together.
    timeout_seconds    = 60
    max_instance_count = 100
    # Scale to zero on purpose: cold starts are accepted, never a warm instance.
    min_instance_count    = 0
    service_account_email = google_service_account.function.email

    environment_variables = {
      NITRO_FIREBASE_PROJECT_ID = google_project.this.project_id
    }

    dynamic "secret_environment_variables" {
      for_each = google_secret_manager_secret.this
      content {
        key        = "NITRO_${replace(upper(secret_environment_variables.key), "-", "_")}"
        project_id = google_project.this.project_id
        secret     = secret_environment_variables.value.secret_id
        version    = "latest"
      }
    }
  }

  depends_on = [
    google_project_iam_member.function_firestore,
    google_project_iam_member.compute_default_builder,
    google_secret_manager_secret_iam_member.function,
  ]
}

# Auth is enforced inside the function (server/middleware/auth.ts verifies the
# Firebase ID token), so the underlying Cloud Run service is publicly invokable.
resource "google_cloud_run_service_iam_member" "invoker" {
  project  = google_project.this.project_id
  location = var.region
  service  = google_cloudfunctions2_function.server.name
  role     = "roles/run.invoker"
  member   = "allUsers"

  depends_on = [google_org_policy_policy.allow_public_iam]
}

# Every deploy builds a container image into this repository, which Cloud
# Functions creates on its first deploy and never prunes. Any image is rebuilt
# from its commit, so only the running one and the one before are kept.
import {
  to = google_artifact_registry_repository.functions
  id = "projects/${var.project_id}/locations/${var.region}/repositories/gcf-artifacts"
}

resource "google_artifact_registry_repository" "functions" {
  project       = google_project.this.project_id
  location      = var.region
  repository_id = "gcf-artifacts"
  format        = "DOCKER"
  description   = "This repository is created and used by Cloud Functions for storing function docker images."

  cleanup_policy_dry_run = false

  cleanup_policies {
    id     = "delete-every-version"
    action = "DELETE"
    condition {
      tag_state = "ANY"
    }
  }

  cleanup_policies {
    id     = "keep-the-two-latest"
    action = "KEEP"
    most_recent_versions {
      keep_count = 2
    }
  }

  lifecycle {
    ignore_changes = [labels]
  }
}
