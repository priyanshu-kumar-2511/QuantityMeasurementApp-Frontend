# ── Stage 1: Build Angular App ─────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Install dependencies (clean install for reproducible builds)
RUN npm ci

# Copy rest of source code
COPY . .

# Build production Angular bundle
RUN npm run build -- --configuration production

# ── Stage 2: Serve with Nginx ──────────────────────────────────────────────────
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built Angular files from builder stage
COPY --from=builder /app/dist/quantity-measurement-frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
