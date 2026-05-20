# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production=false
COPY . .
RUN npm run build

# Stage 2: production runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Only copy what's needed
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "dist/main.js"]
