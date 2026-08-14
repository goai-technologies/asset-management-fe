# syntax=docker/dockerfile:1

# ---- Build stage: produce a static SPA bundle (dist/client) ----
FROM node:22-alpine AS build
WORKDIR /app

# Fallback only, used if the runtime container doesn't provide VITE_API_URL via
# env.js (see docker-entrypoint.sh) — e.g. `vite preview` or a non-Docker static host.
ARG VITE_API_URL=http://localhost:5001/api
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build:spa

# The browser reads config from /env.js, generated at container start from the
# real runtime environment — load it before the app bundle so it's ready in time.
RUN sed -i 's#</head>#<script src="/env.js"></script></head>#' dist/client/_shell.html

# ---- Runtime stage: nginx serving the static bundle ----
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/client /usr/share/nginx/html
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
