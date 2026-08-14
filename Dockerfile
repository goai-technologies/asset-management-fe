# syntax=docker/dockerfile:1

# ---- Build stage: produce a static SPA bundle (dist/client) ----
FROM node:22-alpine AS build
WORKDIR /app

# Baked into the bundle at build time — the browser reads it, so it must be a URL
# reachable from the user's machine, not from inside the container.
ARG VITE_API_URL=http://localhost:5001/api
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build:spa

# ---- Runtime stage: nginx serving the static bundle ----
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/client /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
