resource "docker_container" "expenses" {
  name  = "expenses-container"
  image = docker_image.expenses.image_id

  ports {
    internal = 8000
    external = 8000
  }

  networks_advanced {
    name = docker_network.expenses.name
  }
}

resource "docker_container" "mysql" {
  name  = "mysql-container"
  image = docker_image.mysql.image_id

  env = [
    "MYSQL_DATABASE=expenses_db",
    "MYSQL_USER=expenses_user",
    "MYSQL_PASSWORD=expenses_pass",
    "MYSQL_ROOT_PASSWORD=root_secret"
  ]

  ports {
    internal = 3306
    external = 3306
  }

  networks_advanced {
    name = docker_network.expenses.name
  }

  mounts {
    target = "/var/lib/mysql"
    source = docker_volume.mysql_data.name
    type   = "volume"
  }
}