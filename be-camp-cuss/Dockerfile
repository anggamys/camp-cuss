FROM node:22-alpine
WORKDIR /app

ENV TZ=Asia/Jakarta \
    PORT=3000

RUN apk add --no-cache openssl dumb-init

COPY package*.json ./
RUN npm ci --ignore-scripts --no-audit --prefer-offline

COPY . .

# Gunakan npx untuk memastikan CLI lokal dipakai
RUN npx prisma generate --schema=./prisma/schema.prisma && \
    npx nest build && \
    echo "=== isi folder dist ===" && ls -la dist && \
    test -f dist/main.js

ENV NODE_ENV=production
RUN npm prune --omit=dev && npm cache clean --force

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["dumb-init", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
