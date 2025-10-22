FROM node:22-alpine
WORKDIR /app

# Install dependensi sistem
RUN apk add --no-cache openssl dumb-init

# Copy dan install semua dependency (termasuk dev)
COPY package*.json ./
RUN npm ci --ignore-scripts --no-audit --prefer-offline

# Copy source code
COPY . .

# Generate Prisma dan build NestJS
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

# Setelah build selesai, baru ubah ke mode production
ENV NODE_ENV=production TZ=Asia/Jakarta PORT=3000

# Prune devDependencies agar image kecil
RUN npm prune --omit=dev && npm cache clean --force

# Copy entrypoint
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["dumb-init", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
