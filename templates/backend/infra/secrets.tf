resource "random_password" "admin_token" {
  count   = var.admin_token == null ? 1 : 0
  length  = 48
  special = false
}

locals {
  admin_token_value = var.admin_token != null ? var.admin_token : random_password.admin_token[0].result

  # Every secret the function reads, by Secret Manager id. The id becomes the
  # NITRO_* variable name (function.tf). Generated material uses `random_bytes`,
  # never `random_id`: the latter makes the value its own id, which Terraform
  # prints into the build log of a public repository.
  secret_values = {
    admin-token = local.admin_token_value
    sentry-dsn  = var.sentry_dsn
  }

  # Secret Manager rejects empty payloads, so optional secrets are skipped when
  # blank. Iterating a map of sensitive values would propagate sensitivity into
  # for_each keys, which Terraform forbids, hence nonsensitive().
  secret_ids = toset(compact([
    "admin-token",
    nonsensitive(var.sentry_dsn) != "" ? "sentry-dsn" : "",
  ]))
}

resource "google_secret_manager_secret" "this" {
  for_each  = local.secret_ids
  project   = google_project.this.project_id
  secret_id = each.value

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "this" {
  for_each    = local.secret_ids
  secret      = google_secret_manager_secret.this[each.value].id
  secret_data = local.secret_values[each.value]
}
