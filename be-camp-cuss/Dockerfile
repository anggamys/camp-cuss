FROM node:22-alpine AS builder
WORKDIR /app
ENV TZ=Asia/Jakarta

RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci --ignore-scripts --no-audit --prefer-offline
COPY . .
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production TZ=Asia/Jakarta PORT=3000

RUN apk add --no-cache openssl
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed:prod && npm run start:prod"]
