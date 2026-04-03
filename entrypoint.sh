#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Checking if seed is needed..."
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count().then(count => {
  console.log(count);
  prisma.\$disconnect();
}).catch(() => {
  console.log('0');
});
" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ]; then
  echo "Running initial seed..."
  if [ -f prisma/dist/seed.js ]; then
    node prisma/dist/seed.js || echo "Seed failed, continuing..."
  else
    echo "Compiled seed not found, skipping..."
  fi
fi

echo "Starting Next.js server..."
node server.js
