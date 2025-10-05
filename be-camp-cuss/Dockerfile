FROM node:22-alpine AS builder
USER node
WORKDIR /home/node/app

COPY --chown=node:node package*.json ./
RUN npm ci --ignore-scripts --no-audit --prefer-offline
COPY --chown=node:node . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-slim AS runtime
USER node
WORKDIR /home/node/app

ENV NODE_ENV=production
ENV PORT=3000
ENV TZ=Asia/Jakarta

COPY --from=builder --chown=node:node /home/node/app/package*.json ./
COPY --from=builder --chown=node:node /home/node/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /home/node/app/dist ./dist
COPY --from=builder --chown=node:node /home/node/app/prisma ./prisma

# Bersihkan cache user node saja
RUN rm -rf /home/node/.npm /home/node/.cache /tmp/*

ENV NODE_OPTIONS="--max-old-space-size=128 --heapsnapshot-near-heap-limit=1"
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
