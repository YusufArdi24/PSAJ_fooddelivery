#!/bin/bash

echo "========================================="
echo "LARAVEL STARTUP SCRIPT"
echo "========================================="

cd /app

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

# Set APP_URL with proper default
export APP_URL="${APP_URL:-http://127.0.0.1:8000}"
export APP_ENV="${APP_ENV:-production}"
export APP_DEBUG="${APP_DEBUG:-false}"
export APP_KEY="base64:XbAzi6vg8BmX26gv/IrDr059QtHqeyoaOy4DoTIlUqU="

echo "APP_URL: $APP_URL"
echo "APP_ENV: $APP_ENV"
echo "APP_DEBUG: $APP_DEBUG"

# Update .env with current environment variables  
sed -i "s|^APP_URL=.*|APP_URL=$APP_URL|g" .env
sed -i "s|^APP_ENV=.*|APP_ENV=$APP_ENV|g" .env
sed -i "s|^APP_DEBUG=.*|APP_DEBUG=$APP_DEBUG|g" .env
sed -i "s|^APP_KEY=.*|APP_KEY=$APP_KEY|g" .env

# Handle Railway MySQL variables
if [ ! -z "$MYSQLHOST" ]; then
    sed -i "s|^DB_HOST=.*|DB_HOST=$MYSQLHOST|g" .env
    sed -i "s|^DB_DATABASE=.*|DB_DATABASE=$MYSQLDATABASE|g" .env
    sed -i "s|^DB_USERNAME=.*|DB_USERNAME=$MYSQLUSER|g" .env
    sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$MYSQLPASSWORD|g" .env
    echo "Database configured: $MYSQLHOST"
    
    # Only run migrations if database is configured
    echo "Running migrations..."
    php artisan migrate --force --no-interaction || true
fi

echo "Starting Laravel server..."
echo "========================================="
echo ""

# Start Laravel development server
exec php artisan serve --host=0.0.0.0 --port=8000
