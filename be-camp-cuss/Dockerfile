FROM node:22-alpine
WORKDIR /app
ENV TZ=Asia/Jakarta PORT=3000

# Install system dependencies
RUN apk add --no-cache openssl dumb-init

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --ignore-scripts --no-audit --prefer-offline

# Copy source code
COPY . .

# Generate Prisma client and build NestJS
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

# Switch to production
ENV NODE_ENV=production

# Remove dev dependencies
RUN npm prune --omit=dev

# Copy entrypoint untuk migrasi otomatis
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 3000

ENTRYPOINT ["dumb-init", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
