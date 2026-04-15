#!/bin/sh
set -e

# Warna untuk output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Tanpa Warna

echo -e "${YELLOW}⏳ Menunggu database siap...${NC}"

# Tunggu PostgreSQL 100% siap
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if pg_isready -h postgres -U ${DB_USER:-postgres} -d ${DB_NAME:-camp_cuss} > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL siap!${NC}"
        break
    fi
    echo "Percobaan $attempt/$max_attempts: Menunggu PostgreSQL..."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo -e "${RED}✗ Timeout menunggu PostgreSQL${NC}"
    exit 1
fi

# Debug: Daftar file migrasi
echo -e "${YELLOW}📁 File migrasi ditemukan:${NC}"
ls -la ./prisma/migrations/ 2>/dev/null || echo "Tidak ada folder migrasi"

# Daftar folder migrasi
migration_count=$(find ./prisma/migrations -maxdepth 1 -type d -name "*_*" | wc -l)
echo -e "${YELLOW}📊 Total migrasi: $migration_count${NC}"

echo -e "${YELLOW}🔄 Menjalankan migrasi Prisma...${NC}"
npx prisma migrate deploy || {
    echo -e "${RED}✗ Kesalahan menjalankan migrasi${NC}"
    echo "Mencoba reset migrasi..."
    npx prisma migrate reset --force || true
}

echo -e "${YELLOW}🔧 Generate Prisma Client...${NC}"
npx prisma generate --schema=./prisma/schema.prisma

echo -e "${GREEN}✓ Setup selesai! Memulai aplikasi...${NC}"
exec "$@"
