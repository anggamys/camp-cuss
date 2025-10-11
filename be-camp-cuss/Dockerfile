FROM node:22-alpine
WORKDIR /app
ENV TZ=Asia/Jakarta PORT=3000

RUN apk add --no-cache openssl

# Copy dan install dependency (termasuk dev)
COPY package*.json ./
RUN npm ci --ignore-scripts --no-audit --prefer-offline

# Copy source
COPY . .

# Generate Prisma Client dan build NestJS
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

# Baru sekarang set environment production
ENV NODE_ENV=production

# Hapus devDependencies agar image kecil
RUN npm prune --omit=dev

# Jalankan migrate dan start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
