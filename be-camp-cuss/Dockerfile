FROM node:22-alpine AS builder

# Gunakan user non-root
USER node
WORKDIR /home/node/app

# Salin dan install dependency (dengan cache layer)
COPY --chown=node:node package*.json ./
RUN npm ci --ignore-scripts --no-audit --prefer-offline

# Salin seluruh source
COPY --chown=node:node . .

# Generate Prisma Client
RUN npx prisma generate

# Build NestJS (hasil ke dist)
RUN npm run build

# Hapus dependency dev agar image runtime kecil
RUN npm prune --omit=dev


FROM node:22-slim AS runtime

# Gunakan user non-root
USER node
WORKDIR /home/node/app

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy hasil build dari builder
COPY --from=builder --chown=node:node /home/node/app/package*.json ./
COPY --from=builder --chown=node:node /home/node/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /home/node/app/dist ./dist
COPY --from=builder --chown=node:node /home/node/app/prisma ./prisma

# Bersihkan cache & tool tidak penting
RUN rm -rf /home/node/.npm && \
    rm -rf /usr/share/doc && \
    rm -rf /usr/share/man && \
    rm -rf /tmp/*

# Expose port
EXPOSE 3000

# Jalankan dengan batas memori rendah
CMD ["sh", "-c", "npx prisma migrate deploy && node --max-old-space-size=128 dist/main.js"]
