# ===== STAGE 1: BUILD =====
FROM node:22-alpine AS builder
WORKDIR /app
ENV TZ=Asia/Jakarta

# Install dependencies
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci --ignore-scripts --no-audit --prefer-offline

# Copy source and build
COPY . .
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build
RUN npm prune --omit=dev


# ===== STAGE 2: RUNTIME =====
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    TZ=Asia/Jakarta \
    PORT=3000

RUN apk add --no-cache openssl

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Jalankan migration dan start server
CMD sh -c "npx prisma migrate deploy && node dist/main.js"
