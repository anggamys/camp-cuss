FROM node:22-alpine AS builder

WORKDIR /app
RUN apk add --no-cache openssl

# Install semua dependency (termasuk dev)
COPY package*.json ./
RUN npm ci --ignore-scripts --no-audit

# Copy seluruh source code
COPY . .

# Generate Prisma Client & build NestJS
RUN npx prisma generate --schema=./prisma/schema.prisma && \
    npm run build

FROM node:22-alpine AS production

WORKDIR /app

# Buat user non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Install dependency runtime
RUN apk add --no-cache openssl dumb-init

ENV NODE_ENV=production \
    TZ=Asia/Jakarta \
    PORT=3000

# Install hanya dependency production
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts --no-audit --prefer-offline && \
    npm cache clean --force

# Copy hasil build dan prisma dari stage builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Tambahkan script entrypoint untuk migrasi otomatis
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Ubah kepemilikan file
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000

# Gunakan entrypoint custom agar migrasi dijalankan otomatis
ENTRYPOINT ["dumb-init", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
