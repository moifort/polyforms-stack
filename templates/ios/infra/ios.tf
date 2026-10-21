resource "google_firebase_apple_app" "ios" {
  provider     = google-beta
  project      = google_project.this.project_id
  display_name = "{{APP_NAME}} iOS"
  bundle_id    = "{{BUNDLE_ID}}"
  team_id      = var.apple_team_id

  depends_on = [google_firebase_project.this]
}

data "google_firebase_apple_app_config" "ios" {
  provider = google-beta
  project  = google_project.this.project_id
  app_id   = google_firebase_apple_app.ios.app_id
}

# Written next to the app for a local build; gitignored. CI rebuilds it from the
# IOS_GOOGLE_SERVICE_INFO_PLIST secret.
resource "local_file" "google_service_info_plist" {
  filename        = "${path.root}/../ios/{{APP_NAME}}/GoogleService-Info.plist"
  content_base64  = data.google_firebase_apple_app_config.ios.config_file_contents
  file_permission = "0644"
}

output "ios_app_id" {
  value       = google_firebase_apple_app.ios.app_id
  description = "Firebase iOS app id"
}
