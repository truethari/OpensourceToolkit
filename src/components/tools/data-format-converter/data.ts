import type { DataFormat } from "./utils";

/** Equivalent sample documents so users can try any direction immediately. */
export const SAMPLES: Record<DataFormat, string> = {
  json: `{
  "name": "my-service",
  "version": "1.4.0",
  "debug": false,
  "ports": [8080, 8443],
  "database": {
    "host": "localhost",
    "port": 5432,
    "replicas": ["db-1", "db-2"]
  },
  "features": {
    "cache": true,
    "ttl": 300
  }
}`,
  yaml: `name: my-service
version: 1.4.0
debug: false
ports:
  - 8080
  - 8443
database:
  host: localhost
  port: 5432
  replicas:
    - db-1
    - db-2
features:
  cache: true
  ttl: 300`,
  toml: `name = "my-service"
version = "1.4.0"
debug = false
ports = [8080, 8443]

[database]
host = "localhost"
port = 5432
replicas = ["db-1", "db-2"]

[features]
cache = true
ttl = 300`,
};
