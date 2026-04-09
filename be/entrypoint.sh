#!/bin/bash
set -e

echo "========================================="
echo "   LARAVEL APPLICATION STARTUP"
echo "========================================="
cd /app

# Step 1: CLEAN bootstrap cache - CRITICAL!
echo "1️⃣  Cleaning bootstrap cache..."
rm -rf bootstrap/cache/*
mkdir -p bootstrap/cache

# Step 2: CREATE fresh .env from example
echo "2️⃣  Creating fresh .env..."
if [ -f .env ]; then
    rm .env
fi
cp .env.example .env
chmod 644 .env

# Step 3: SET environment variables in .env
echo "3️⃣  Setting environment variables..."

# ENSURE APP_URL is valid
if [ -z "$APP_URL" ]; then
    APP_URL="http://127.0.0.1:8000"
elif [[ ! "$APP_URL" =~ ^https?:// ]]; then
    APP_URL="http://$APP_URL"
fi

# Remove trailing slash if present
APP_URL="${APP_URL%/}"

# Verify no invalid characters
if [[ "$APP_URL" =~ [[:space:]] ]]; then
    echo "   ❌ APP_URL contains spaces! Using fallback..."
    APP_URL="http://127.0.0.1:8000"
fi

echo "   APP_URL: $APP_URL"

APP_ENV="${APP_ENV:-production}"
APP_DEBUG="${APP_DEBUG:-false}"
APP_KEY="${APP_KEY:-base64:XbAzi6vg8BmX26gv/IrDr059QtHqeyoaOy4DoTIlUqU=}"

# Update .env - use single quotes to avoid shell expansion
sed -i.bak "s|^APP_URL=.*|APP_URL=$APP_URL|" .env
sed -i "s|^APP_ENV=.*|APP_ENV=$APP_ENV|" .env
sed -i "s|^APP_DEBUG=.*|APP_DEBUG=$APP_DEBUG|" .env
sed -i "s|^APP_KEY=.*|APP_KEY=$APP_KEY|" .env

# CRITICAL: Ensure DB_CONNECTION is ALWAYS mysql (not sqlite!)
sed -i "s|^DB_CONNECTION=.*|DB_CONNECTION=mysql|" .env

# Step 4: Handle Railway MySQL variables
echo "4️⃣  Configuring database..."
if [ ! -z "$MYSQLHOST" ]; then
    sed -i "s|^DB_HOST=.*|DB_HOST=$MYSQLHOST|" .env
    sed -i "s|^DB_PORT=.*|DB_PORT=${MYSQLPORT:-3306}|" .env
    sed -i "s|^DB_DATABASE=.*|DB_DATABASE=$MYSQLDATABASE|" .env
    sed -i "s|^DB_USERNAME=.*|DB_USERNAME=$MYSQLUSER|" .env
    sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$MYSQLPASSWORD|" .env
    echo "   Database: $MYSQLHOST"
fi

# Step 5: VERIFY .env was written correctly
echo "5️⃣  Verifying .env configuration..."
FINAL_URL=$(grep "^APP_URL=" .env | cut -d= -f2-)
echo "   Stored APP_URL: $FINAL_URL"

if [ -z "$FINAL_URL" ] || [ "$FINAL_URL" = "http://localhost" ]; then
    echo "   ⚠️ Invalid APP_URL in .env, fixing..."
    sed -i "s|^APP_URL=.*|APP_URL=http://127.0.0.1:8000|" .env
fi

# Step 6: Output .env for verification
echo ""
echo "   Current .env values:"
grep "^APP_" .env | head -5
echo ""

# Step 7: Clear all Laravel caches
echo "6️⃣  Clearing Laravel caches..."
php artisan config:clear --no-interaction 2>/dev/null || echo "   (config:clear skipped)"
php artisan cache:clear --no-interaction 2>/dev/null || echo "   (cache:clear skipped)"

# Step 8: Run migrations (only if database configured)
echo "7️⃣  Database migrations..."
if [ ! -z "$MYSQLHOST" ]; then
    php artisan migrate --force --no-interaction 2>&1 | tail -2 || echo "   (migrations skipped)"
else
    echo "   Skipped (no database configured)"
fi

# Step 9: START Laravel
echo ""
echo "========================================="
echo "   ✅ Starting Laravel Server"
echo "   URL: $(grep '^APP_URL=' .env | cut -d= -f2-)"
echo "   Mode: $(grep '^APP_ENV=' .env | cut -d= -f2-)"
echo "========================================="
echo ""

exec php artisan serve --host=0.0.0.0 --port=8000
