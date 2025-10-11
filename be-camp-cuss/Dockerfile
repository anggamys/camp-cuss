FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production TZ=Asia/Jakarta PORT=3000

# Install required package
RUN apk add --no-cache openssl

# Copy package info & install dependencies (termasuk dev)
COPY package*.json ./
RUN npm ci --ignore-scripts --no-audit --prefer-offline

# Copy project files
COPY . .

# Generate Prisma Client & build NestJS
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

# Hapus devDependencies setelah build selesai
RUN npm prune --omit=dev

# Jalankan migration & aplikasi
CMD sh -c "npx prisma migrate deploy && node dist/main.js"
