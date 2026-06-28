# DataSearch — full-stack build (frontend + backend) served by Express
FROM node:22-slim AS build
ARG BUILD_PROXY=""
WORKDIR /app
# Proxy CA so npm trusts the agent proxy during build (no-op when BUILD_PROXY empty)
COPY ca-bundle.crt /tmp/proxy-ca.crt

# Frontend deps + build
COPY frontend/package*.json ./frontend/
RUN cd frontend && HTTPS_PROXY=$BUILD_PROXY HTTP_PROXY=$BUILD_PROXY NODE_EXTRA_CA_CERTS=/tmp/proxy-ca.crt npm install --include=dev
COPY frontend ./frontend
RUN cd frontend && npm run build

# Backend deps + build
COPY backend/package*.json ./backend/
RUN cd backend && HTTPS_PROXY=$BUILD_PROXY HTTP_PROXY=$BUILD_PROXY NODE_EXTRA_CA_CERTS=/tmp/proxy-ca.crt npm install --include=dev
COPY backend ./backend
RUN cd backend && npx tsc

# Runtime image
FROM node:22-slim AS runtime
ARG BUILD_PROXY=""
WORKDIR /app
ENV NODE_ENV=production
COPY ca-bundle.crt /tmp/proxy-ca.crt

# Backend production deps only
COPY backend/package*.json ./backend/
RUN cd backend && HTTPS_PROXY=$BUILD_PROXY HTTP_PROXY=$BUILD_PROXY NODE_EXTRA_CA_CERTS=/tmp/proxy-ca.crt npm install --omit=dev

# Compiled output + built frontend
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/frontend/dist ./frontend/dist

EXPOSE 8080
ENV PORT=8080
CMD ["sh", "-c", "node backend/dist/db/seed.js; node backend/dist/index.js"]
