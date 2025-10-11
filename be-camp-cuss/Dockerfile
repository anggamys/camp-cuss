FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production TZ=Asia/Jakarta PORT=3000

# Install dependencies
RUN apk add --no-cache openssl

# Copy package info and install
COPY package*.json ./
RUN npm ci --ignore-scripts --no-audit --prefer-offline

# Copy source code
COPY . .

# Generate Prisma client and build
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

# Jalankan migration dan app
CMD sh -c "npx prisma migrate deploy && node dist/main.js"
