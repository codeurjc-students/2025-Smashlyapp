# Multi-stage Dockerfile to build and run Smashly (backend + frontend)

# --- Frontend build stage ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy source and public assets (vite publicDir is at ../public)
COPY frontend/ ./
COPY public/ /app/public/

# Build static assets
RUN npm run build

# --- Backend build stage ---
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend/api

# Install backend dependencies (including dev deps for build)
COPY backend/api/package.json backend/api/package-lock.json ./
RUN npm ci

# Copy backend source
COPY backend/api/ ./

# Build TypeScript to dist
RUN npm run build

# --- Runtime stage ---
FROM node:20-alpine AS runtime
WORKDIR /app/backend/api

# Install runtime packages
RUN apk add --no-cache openssl curl

# Copy production dependencies only (need package-lock.json for npm ci)
COPY backend/api/package.json ./package.json
COPY backend/api/package-lock.json ./package-lock.json
RUN npm ci --omit=dev

# Copy compiled backend
COPY --from=backend-builder /app/backend/api/dist ./dist

# Copy API docs (backend expects ../docs/api-docs.yaml relative to dist -> /app/backend/api/docs)
RUN mkdir -p docs
COPY docs/api-docs.yaml ./docs/api-docs.yaml

# Copy frontend static build (backend serves from ../static -> /app/backend/api/static)
RUN mkdir -p static
COPY --from=frontend-builder /app/frontend/dist ./static

# Generate self-signed SSL certs for HTTPS in container
RUN mkdir -p certs \
  && openssl req -x509 -newkey rsa:2048 -nodes \
       -keyout certs/key.pem -out certs/cert.pem -days 365 \
       -subj "/CN=localhost" \
       -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

# Environment defaults (can be overridden by docker-compose)
ENV NODE_ENV=production \
    USE_HTTPS=true \
    PORT=443 \
    FRONTEND_URL=https://localhost

# Expose HTTPS port
EXPOSE 443

# Healthcheck hitting API health endpoint (ignore self-signed cert)
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
  CMD curl -k -fsS https://localhost:${PORT}/api/v1/health || exit 1

# Start backend
CMD ["node", "dist/server.js"]