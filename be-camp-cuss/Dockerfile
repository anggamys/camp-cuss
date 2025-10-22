FROM node:22-alpine
WORKDIR /app

# Environment
ENV TZ=Asia/Jakarta \
    NODE_ENV=production \
    PORT=3000

# Install dependency sistem
RUN apk add --no-cache openssl dumb-init

# Copy dan install dependencies
COPY package*.json ./
RUN npm ci --ignore-scripts --no-audit --prefer-offline

# Copy source code
COPY . .

# Generate Prisma client dan build NestJS
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

# Hapus dev dependencies agar ringan
RUN npm prune --omit=dev && npm cache clean --force

# Pastikan file entrypoint tersedia
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["dumb-init", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
