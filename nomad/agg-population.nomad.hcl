job "agg-population" {
  type = "service"

  update {
    max_parallel = 1
    stagger      = "10s"
  }

  group "api" {
    count = 1

    network {
      port "http" {
        static = 3000
      }
    }

    task "api" {
      driver = "docker"

      config {
        image = "ghcr.io/genudine/agg-population/agg-population:7ef2fe757cec4da36fa9462a09403bbf022f77fa"
        ports = ["http"]
      }
    }
  }
}