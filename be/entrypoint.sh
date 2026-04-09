#!/bin/bash

# Exit on error for critical steps, but continue on non-critical
trap 'echo "Error occurred" >&2' ERR

echo "========================================="
echo "Starting Laravel Application Initialization"
echo "========================================="

# Ensure .env exists
if [ ! -f /app/.env ]; then
    echo "❌ .env file not found, creating from .env.example..."
    if [ ! -f /app/.env.example ]; then
        echo "ERROR: .env.example also not found!"
        exit 1
    fi
    cp /app/.env.example /app/.env
    echo "✓ .env created successfully"
else
    echo "✓ .env file exists"
fi

echo ""
echo "Setting up environment variables..."

# Set critical environment variables with proper defaults
export APP_KEY="${APP_KEY:-base64:XbAzi6vg8BmX26gv/IrDr059QtHqeyoaOy4DoTIlUqU=}"
export APP_ENV="${APP_ENV:-production}"
export APP_DEBUG="${APP_DEBUG:-false}"

# APP_URL MUST have a valid format - use 127.0.0.1 if empty
if [ -z "$APP_URL" ] || [ "$APP_URL" == "http://localhost" ]; then
    export APP_URL="http://127.0.0.1:8000"
    echo "⚠️  APP_URL was empty or invalid, set to: $APP_URL"
else
    echo "✓ APP_URL is set to: $APP_URL"
fi

# Ensure APP_URL has scheme and port
if [[ ! "$APP_URL" =~ ^https?:// ]]; then
    export APP_URL="http://$APP_URL"
    echo "⚠️  APP_URL missing scheme, updated to: $APP_URL"
fi

# Update .env file with CRITICAL variables
echo ""
echo "Updating .env file with critical variables..."
sed -i "s|^APP_KEY=.*|APP_KEY=$APP_KEY|g" /app/.env
sed -i "s|^APP_URL=.*|APP_URL=$APP_URL|g" /app/.env
sed -i "s|^APP_ENV=.*|APP_ENV=$APP_ENV|g" /app/.env
sed -i "s|^APP_DEBUG=.*|APP_DEBUG=$APP_DEBUG|g" /app/.env

# Database configuration - Handle both Laravel and Railway format
echo ""
echo "Checking database configuration..."

# Railway uses: MYSQLHOST, MYSQLDATABASE, MYSQLUSER, MYSQLPASSWORD
# Laravel uses: DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD

# Convert Railway MySQL variables to Laravel format if they exist
if [ ! -z "$MYSQLHOST" ]; then
    DB_HOST="$MYSQLHOST"
    echo "✓ Found MYSQLHOST, using as DB_HOST"
fi

if [ ! -z "$MYSQLDATABASE" ]; then
    DB_DATABASE="$MYSQLDATABASE"
    echo "✓ Found MYSQLDATABASE, using as DB_DATABASE"
fi

if [ ! -z "$MYSQLUSER" ]; then
    DB_USERNAME="$MYSQLUSER"
    echo "✓ Found MYSQLUSER, using as DB_USERNAME"
fi

if [ ! -z "$MYSQLPASSWORD" ]; then
    DB_PASSWORD="$MYSQLPASSWORD"
    echo "✓ Found MYSQLPASSWORD, using as DB_PASSWORD"
fi

# Now set the .env file with the proper variables
if [ ! -z "$DB_HOST" ]; then
    echo "Configuring database: $DB_HOST"
    sed -i "s|^DB_CONNECTION=.*|DB_CONNECTION=mysql|g" /app/.env
    sed -i "s|^DB_HOST=.*|DB_HOST=$DB_HOST|g" /app/.env
    sed -i "s|^DB_PORT=.*|DB_PORT=${DB_PORT:-3306}|g" /app/.env
    sed -i "s|^DB_DATABASE=.*|DB_DATABASE=${DB_DATABASE:-railway}|g" /app/.env
    sed -i "s|^DB_USERNAME=.*|DB_USERNAME=${DB_USERNAME:-root}|g" /app/.env
    sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|g" /app/.env
    echo "✓ Database configured"
else
    echo "⚠️  No database host configured"
fi

echo ""
echo "========================================="
echo "Environment Summary:"
echo "========================================="
echo "APP_NAME: $(grep '^APP_NAME=' /app/.env | cut -d= -f2-)"
echo "APP_URL: $(grep '^APP_URL=' /app/.env | cut -d= -f2-)"
echo "APP_ENV: $(grep '^APP_ENV=' /app/.env | cut -d= -f2-)"
echo "APP_DEBUG: $(grep '^APP_DEBUG=' /app/.env | cut -d= -f2-)"
if [ ! -z "$DB_HOST" ]; then
    echo "DB_HOST: $(grep '^DB_HOST=' /app/.env | cut -d= -f2-)"
    echo "DB_DATABASE: $(grep '^DB_DATABASE=' /app/.env | cut -d= -f2-)"
fi
echo "========================================="

# Clear caches before running migrations
echo ""
echo "Clearing application caches..."
php /app/artisan config:cache --no-interaction 2>/dev/null || echo "⚠️  config:cache had issues, continuing..."
php /app/artisan cache:clear --no-interaction 2>/dev/null || echo "⚠️  cache:clear had issues, continuing..."

# Run database migrations only if database is configured
echo ""
if [ ! -z "$DB_HOST" ]; then
    if [ "$SKIP_MIGRATIONS" != "true" ]; then
        echo "Running database migrations..."
        php /app/artisan migrate --force --no-interaction || echo "⚠️  Migrations might have had issues, continuing..."
    else
        echo "Skipping migrations (SKIP_MIGRATIONS=true)"
    fi
else
    echo "⚠️  Skipping migrations - no database configured"
fi

# Start PHP development server
echo ""
echo "========================================="
echo "✓ All initialization complete!"
echo "Starting Laravel application on 0.0.0.0:8000..."
echo "App URL: $(grep '^APP_URL=' /app/.env | cut -d= -f2-)"
echo "========================================="
echo ""

exec php /app/artisan serve --host=0.0.0.0 --port=8000
