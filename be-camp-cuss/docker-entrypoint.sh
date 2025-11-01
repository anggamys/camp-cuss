#!/bin/sh
set -e
echo "Memulai skrip entrypoint Docker..."

echo "Menhapus folder migrasi lama (jika ada)..."
rm -rf prisma/migrations

echo "Menjalankan migrasi Prisma (tanpa menghapus data)..."
npx prisma migrate deploy

echo "Menjalankan Prisma generate (pastikan client up-to-date)..."
npx prisma generate --schema=./prisma/schema.prisma

echo "Menjalankan aplikasi..."
exec "$@"
