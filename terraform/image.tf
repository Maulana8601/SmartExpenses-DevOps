resource "docker_image" "expenses" {
  name = "expenses-app:latest"

  build {
    context    = "${path.module}/.."
    dockerfile = "dockerfile"
  }
}