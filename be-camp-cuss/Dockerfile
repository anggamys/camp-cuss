# ====== STAGE 1: BUILD ======
FROM node:22-slim AS builder

# Set timezone & workdir
ENV TZ=Asia/Jakarta
WORKDIR /home/node/app

# Salin file package dan install dependency
COPY package*.json ./
RUN npm ci --ignore-scripts --no-audit --prefer-offline

# Salin semua file proyek
COPY . .

# Generate Prisma client (menghasilkan binary untuk Debian)
RUN npx prisma generate

# Build NestJS
RUN npm run build

# Hapus dependency dev agar image runtime kecil
RUN npm prune --omit=dev


# ====== STAGE 2: RUNTIME ======
FROM node:22-slim AS runtime

WORKDIR /home/node/app
ENV NODE_ENV=production
ENV PORT=3000
ENV TZ=Asia/Jakarta

# Install OpenSSL (dibutuhkan Prisma runtime Debian)
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/*

# Copy hasil build dari builder
COPY --from=builder /home/node/app/package*.json ./
COPY --from=builder /home/node/app/node_modules ./node_modules
COPY --from=builder /home/node/app/dist ./dist
COPY --from=builder /home/node/app/prisma ./prisma

# Bersihkan cache
RUN rm -rf /home/node/.npm /tmp/*

EXPOSE 3000

# Jalankan Prisma migrate deploy sebelum start NestJS
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
