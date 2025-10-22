#!/bin/sh
set -e

echo "Menjalankan migrasi Prisma (tanpa menghapus data)..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "Menjalankan Prisma generate (pastikan client up-to-date)..."
npx prisma generate --schema=./prisma/schema.prisma

echo "Menjalankan aplikasi..."
exec "$@"
