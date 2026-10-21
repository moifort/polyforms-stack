terraform {
  backend "gcs" {
    bucket = "{{APP_SLUG}}-polyforms-tfstate"
    prefix = "{{APP_SLUG}}"
  }
}
