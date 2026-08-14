#!/bin/sh
# Writes the container's runtime environment into env.js so the already-built
# static bundle can read config values that weren't known at `docker build` time.
set -eu

cat <<EOF > /usr/share/nginx/html/env.js
window.__ENV__ = {
  VITE_API_URL: "${VITE_API_URL:-}"
};
EOF

exec "$@"
