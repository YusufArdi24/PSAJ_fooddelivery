#!/bin/bash

# Do NOT exit on error - we need to see all output
set +e

echo "========================================="
echo "LARAVEL ENTRYPOINT SCRIPT STARTING"
echo "========================================="
echo ""
echo "Current Working Directory: $(pwd)"
echo "User: $(whoami)"
echo "Time: $(date)"
echo ""

# Check if .env.example exists
if [ ! -f /app/.env.example ]; then
    echo "❌ CRITICAL: .env.example NOT FOUND!"
    ls -la /app/ | head -20
    exit 1
fi

echo "✓ .env.example found"

# Create or verify .env
if [ ! -f /app/.env ]; then
    echo "❌ .env does not exist, copying from .env.example..."
    cp /app/.env.example /app/.env
    echo "✓ .env created"
else
    echo "✓ .env already exists"
fi

echo ""
echo "========================================="
echo "ENVIRONMENT VARIABLES FROM RAILWAY:"
echo "========================================="
echo "APP_URL env var: '$APP_URL'"
echo "MYSQLHOST: '$MYSQLHOST'"
echo "MYSQLDATABASE: '$MYSQLDATABASE'"
echo ""

# Always set these - especially APP_URL which is causing issues
export APP_KEY="base64:XbAzi6vg8BmX26gv/IrDr059QtHqeyoaOy4DoTIlUqU="
export APP_ENV="production"
export APP_DEBUG="false"

# CRITICAL: APP_URL must be set and valid
if [ -z "$APP_URL" ]; then
    export APP_URL="http://127.0.0.1:8000"
    echo "⚠️  APP_URL was empty, setting to: $APP_URL"
elif [[ "$APP_URL" != http* ]]; then
    # Add http:// if missing scheme
    export APP_URL="http://$APP_URL"
    echo "⚠️  APP_URL missing scheme, updated to: $APP_URL"
fi

echo "✓ APP_URL will be: $APP_URL"
echo ""

# Show current .env content (first 20 lines)
echo "========================================="
echo "CURRENT .env CONTENT (first 20 lines):"
echo "========================================="
head -20 /app/.env
echo ""

echo "========================================="
echo "UPDATING .env FILE WITH VARIABLES"
echo "========================================="

# Use a more robust sed replacement
sed -i.bak "s|^APP_KEY=.*|APP_KEY=$APP_KEY|" /app/.env
sed -i.bak "s|^APP_URL=.*|APP_URL=$APP_URL|" /app/.env
sed -i.bak "s|^APP_ENV=.*|APP_ENV=$APP_ENV|" /app/.env
sed -i.bak "s|^APP_DEBUG=.*|APP_DEBUG=$APP_DEBUG|" /app/.env

# Handle database vars - Railway format
if [ ! -z "$MYSQLHOST" ]; then
    echo "Setting database from Railway variables..."
    sed -i.bak "s|^DB_HOST=.*|DB_HOST=$MYSQLHOST|" /app/.env
    sed -i.bak "s|^DB_DATABASE=.*|DB_DATABASE=$MYSQLDATABASE|" /app/.env
    sed -i.bak "s|^DB_USERNAME=.*|DB_USERNAME=$MYSQLUSER|" /app/.env
    sed -i.bak "s|^DB_PASSWORD=.*|DB_PASSWORD=$MYSQLPASSWORD|" /app/.env
    echo "✓ Database configured"
fi

echo ""
echo "========================================="
echo "AFTER UPDATE - CRITICAL VALUES:"
echo "========================================="
echo "APP_KEY: $(grep '^APP_KEY=' /app/.env)"
echo "APP_URL: $(grep '^APP_URL=' /app/.env)"
echo "APP_ENV: $(grep '^APP_ENV=' /app/.env)"
echo "APP_DEBUG: $(grep '^APP_DEBUG=' /app/.env)"
if [ ! -z "$MYSQLHOST" ]; then
    echo "DB_HOST: $(grep '^DB_HOST=' /app/.env)"
    echo "DB_DATABASE: $(grep '^DB_DATABASE=' /app/.env)"
fi
echo ""

# Verify APP_URL is actually valid
FINAL_APP_URL=$(grep '^APP_URL=' /app/.env | cut -d= -f2-)
echo "✓ Final APP_URL in .env: $FINAL_APP_URL"

if [[ ! "$FINAL_APP_URL" =~ ^http ]]; then
    echo "❌ ERROR: APP_URL still invalid: $FINAL_APP_URL"
    echo "Attempting aggressive fix..."
    echo "APP_URL=http://127.0.0.1:8000" >> /app/.env
fi

echo ""
echo "========================================="
echo "LARAVEL CONFIGURATION"
echo "========================================="

# Clear any cached config
echo "Clearing config cache..."
php /app/artisan config:clear --no-interaction 2>&1 | head -5 || echo "Config clear had issues"

# Remove bootstrap cache files
echo "Removing bootstrap cache..."
rm -f /app/bootstrap/cache/config.php 2>/dev/null || true
rm -f /app/bootstrap/cache/packages.php 2>/dev/null || true
rm -f /app/bootstrap/cache/services.php 2>/dev/null || true

# Try to optimize config
echo "Optimizing autoloader..."
cd /app && composer dump-autoload --no-interaction 2>&1 | tail -3 || echo "Composer dump had issues"

echo ""
echo "========================================="
echo "DATABASE SETUP"
echo "========================================="

if [ ! -z "$MYSQLHOST" ]; then
    echo "Attempting database migrations..."
    php /app/artisan migrate --force --no-interaction 2>&1 | tail -5 || echo "⚠️  Migrations had issues"
else
    echo "⚠️  No database configured, skipping migrations"
fi

echo ""
echo "========================================="
echo "STARTING LARAVEL"
echo "========================================="
echo "Time: $(date)"
echo "App URL: $(grep '^APP_URL=' /app/.env | cut -d= -f2-)"
echo ""
echo "Executing: php /app/artisan serve --host=0.0.0.0 --port=8000"
echo "========================================="
echo ""

# Start the app
cd /app
exec php artisan serve --host=0.0.0.0 --port=8000
