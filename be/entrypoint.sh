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

APP_URL="${APP_URL:-http://127.0.0.1:8000}"
APP_ENV="${APP_ENV:-production}"
APP_DEBUG="${APP_DEBUG:-false}"
APP_KEY="${APP_KEY:-base64:XbAzi6vg8BmX26gv/IrDr059QtHqeyoaOy4DoTIlUqU=}"

# Use printf for more reliable replacement
printf -v escaped_app_url '%s\n' "$APP_URL" | sed -e 's/[\/&]/\\&/g'
sed -i "s/^APP_URL=.*/APP_URL=$escaped_app_url/" .env
sed -i "s/^APP_ENV=.*/APP_ENV=$APP_ENV/" .env
sed -i "s/^APP_DEBUG=.*/APP_DEBUG=$APP_DEBUG/" .env
sed -i "s/^APP_KEY=.*/APP_KEY=$APP_KEY/" .env

# Step 4: Handle Railway MySQL variables
echo "4️⃣  Configuring database..."
if [ ! -z "$MYSQLHOST" ]; then
    sed -i "s/^DB_HOST=.*/DB_HOST=$MYSQLHOST/" .env
    sed -i "s/^DB_PORT=.*/DB_PORT=${MYSQLPORT:-3306}/" .env
    sed -i "s/^DB_DATABASE=.*/DB_DATABASE=$MYSQLDATABASE/" .env
    sed -i "s/^DB_USERNAME=.*/DB_USERNAME=$MYSQLUSER/" .env
    sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$MYSQLPASSWORD/" .env
    echo "   Database: $MYSQLHOST"
fi

# Step 5: Verify APP_URL in .env
echo "5️⃣  Verifying configuration..."
ACTUAL_URL=$(grep "^APP_URL=" .env | cut -d= -f2-)
echo "   APP_URL: $ACTUAL_URL"

if [ -z "$ACTUAL_URL" ] || [ "$ACTUAL_URL" == "http://localhost" ]; then
    echo "   ❌ Invalid APP_URL!Using fallback..."
    sed -i "s/^APP_URL=.*/APP_URL=http:\/\/127.0.0.1:8000/" .env
fi

# Step 6: Clear all Laravel caches
echo "6️⃣  Clearing Laravel caches..."
php artisan config:clear --no-interaction 2>/dev/null || true
php artisan cache:clear --no-interaction 2>/dev/null || true
php artisan view:clear --no-interaction 2>/dev/null || true

# Step 7: Run migrations (only if database configured)
echo "7️⃣  Database migrations..."
if [ ! -z "$MYSQLHOST" ]; then
    php artisan migrate --force --no-interaction 2>&1 | tail -3 || true
else
    echo "   Skipped (no database configured)"
fi

# Step 8: START Laravel
echo ""
echo "========================================="
echo "   ✅ Starting application on :8000"
echo "========================================="
echo ""

exec php artisan serve --host=0.0.0.0 --port=8000
