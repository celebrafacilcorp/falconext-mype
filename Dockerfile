# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

# Copy all files (package.json and pnpm-lock.yaml)
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install dependencies (use --no-frozen-lockfile for CI compatibility)
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Build Vite app
RUN pnpm run build

# Run stage (Nginx)
FROM nginx:stable-alpine AS runner
WORKDIR /usr/share/nginx/html
# Remove default static assets
RUN rm -rf ./*
# Copy build output
COPY --from=builder /app/dist .
# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
