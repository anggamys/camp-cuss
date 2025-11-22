# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

# Set timezone dan environment
ENV TZ=Asia/Jakarta \
    NODE_ENV=development

# Install dependencies yang diperlukan build
RUN apk add --no-cache openssl dumb-init

# Copy dependency files dulu agar caching lebih efisien
COPY package*.json ./

# Install dependency dev
RUN npm ci --ignore-scripts --no-audit --prefer-offline

# Copy source code
COPY . .

# Generate Prisma dan build NestJS
RUN npx prisma generate && npx nest build

# Pastikan hasil build ada
RUN test -f dist/main.js

# Stage 2: Runtime (lebih ringan)
FROM node:22-alpine AS runtime
WORKDIR /app

ENV TZ=Asia/Jakarta \
    NODE_ENV=production \
    PORT=3000

RUN apk add --no-cache dumb-init

# Copy hanya file yang dibutuhkan untuk runtime
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --prefer-offline && npm cache clean --force

# Copy hasil build dari stage builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["dumb-init", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
