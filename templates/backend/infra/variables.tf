variable "project_id" {
  description = "Globally unique GCP project id ({{APP_SLUG}}-polyforms)"
  type        = string
}

variable "project_name" {
  description = "Human-readable project name shown in the GCP console"
  type        = string
  default     = "{{APP_NAME}}"
}

variable "org_id" {
  description = "GCP organization id (mutually exclusive with folder_id)"
  type        = string
  default     = null
}

variable "folder_id" {
  description = "GCP folder id (mutually exclusive with org_id)"
  type        = string
  default     = null
}

variable "billing_account_id" {
  description = "GCP billing account id (AAAA-BBBB-CCCC-DDDD)"
  type        = string
}

variable "region" {
  description = "Region for the Cloud Function (Gen 2)"
  type        = string
  default     = "europe-west3"
}

variable "firestore_location" {
  description = "Firestore multi-region or region (eur3, europe-west3)"
  type        = string
  default     = "eur3"
}

variable "github_repo" {
  description = "GitHub repository (owner/name) allowed to deploy via Workload Identity Federation"
  type        = string
  default     = "{{GITHUB_REPO}}"
}

variable "observer_service_account" {
  description = "Email of the organisation's read-only observer account (lives in polyforms-billing). Blank grants nothing."
  type        = string
  default     = ""
}

variable "quota_project_id" {
  description = <<-EOT
    Project the provider attributes API quota to (user_project_override).

    Defaults to the project being created, which is right in steady state and
    impossible on the very first apply: the billing pre-flight calls
    cloudbilling.googleapis.com against a project that does not exist yet.
    Point this at an existing project for the bootstrap run, then drop it.
  EOT
  type        = string
  default     = ""
}

# Apple Sign-In. All blank leaves the provider unconfigured (auth.tf).
variable "apple_team_id" {
  description = "Apple Developer Team ID (10 characters)"
  type        = string
  default     = ""
}

variable "apple_services_id" {
  description = "Apple Sign-In Services ID (the OAuth client_id)"
  type        = string
  default     = ""
}

variable "apple_key_id" {
  description = "Apple private key ID (10 characters, matches the .p8 filename)"
  type        = string
  default     = ""
}

variable "apple_private_key_path" {
  description = "Path to the AuthKey_XXXXXXXXXX.p8 file from Apple Developer"
  type        = string
  default     = ""
}

# Backend secrets
variable "sentry_dsn" {
  description = "Sentry DSN of the {{APP_SLUG}}-node project (empty disables Sentry). Only ever takes effect in the deployed function."
  type        = string
  sensitive   = true
  default     = ""
}

variable "admin_token" {
  description = "Bearer token guarding /admin/* routes. Auto-generated if null."
  type        = string
  sensitive   = true
  default     = null
}
