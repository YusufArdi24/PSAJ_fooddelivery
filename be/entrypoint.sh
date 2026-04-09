#!/bin/bash

# Exit on error
set -e

echo "Setting up Laravel application..."
echo "This script handles both Laravel and Railway MySQL variable formats:"
echo "  Railway format: MYSQLHOST, MYSQLDATABASE, MYSQLUSER, MYSQLPASSWORD"
echo "  Laravel format: DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD"

# Ensure .env exists
if [ ! -f /app/.env ]; then
    echo "Creating .env from .env.example..."
    cp /app/.env.example /app/.env
fi

# Set critical environment variables if not already set
export APP_KEY="${APP_KEY:-base64:XbAzi6vg8BmX26gv/IrDr059QtHqeyoaOy4DoTIlUqU=}"
export APP_URL="${APP_URL:-http://127.0.0.1:8000}"
export APP_ENV="${APP_ENV:-production}"
export APP_DEBUG="${APP_DEBUG:-false}"

# Update .env file with variables
echo "Updating .env file with environment variables..."
sed -i "s|^APP_KEY=.*|APP_KEY=$APP_KEY|g" /app/.env
sed -i "s|^APP_URL=.*|APP_URL=$APP_URL|g" /app/.env
sed -i "s|^APP_ENV=.*|APP_ENV=$APP_ENV|g" /app/.env
sed -i "s|^APP_DEBUG=.*|APP_DEBUG=$APP_DEBUG|g" /app/.env

# Database configuration - Handle both Laravel and Railway format
# Railway uses: MYSQLHOST, MYSQLDATABASE, MYSQLUSER, MYSQLPASSWORD
# Laravel uses: DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD

# Convert Railway MySQL variables to Laravel format if they exist
if [ ! -z "$MYSQLHOST" ]; then
    DB_HOST="$MYSQLHOST"
fi

if [ ! -z "$MYSQLDATABASE" ]; then
    DB_DATABASE="$MYSQLDATABASE"
fi

if [ ! -z "$MYSQLUSER" ]; then
    DB_USERNAME="$MYSQLUSER"
fi

if [ ! -z "$MYSQLPASSWORD" ]; then
    DB_PASSWORD="$MYSQLPASSWORD"
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
fi

echo "Environment variables loaded."
echo "APP_URL: $APP_URL"
echo "APP_ENV: $APP_ENV"
echo "APP_DEBUG: $APP_DEBUG"
if [ ! -z "$DB_HOST" ]; then
    echo "Database Host: $DB_HOST"
    echo "Database Name: ${DB_DATABASE:-Not set}"
fi

# Cache configuration
echo "Running cache:clear..."
php /app/artisan cache:clear --no-interaction || true

# Run database migrations
if [ "$SKIP_MIGRATIONS" != "true" ]; then
    echo "Running migrations..."
    php /app/artisan migrate --force --no-interaction || true
else
    echo "Skipping migrations (SKIP_MIGRATIONS=true)"
fi

# Start PHP development server
echo "Starting Laravel application on 0.0.0.0:8000..."
exec php /app/artisan serve --host=0.0.0.0 --port=8000
