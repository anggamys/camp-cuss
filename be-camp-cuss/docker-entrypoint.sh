#!/bin/sh
set -e

echo "Menjalankan migrasi Prisma..."
npx prisma migrate deploy

echo "Menjalankan Prisma generate..."
npx prisma generate --schema=./prisma/schema.prisma

echo "Menjalankan aplikasi..."
exec "$@"
